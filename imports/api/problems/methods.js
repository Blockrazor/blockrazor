import { Meteor } from 'meteor/meteor'
import { UserData, Wallet, Problems, ProblemImages, ProblemComments, developmentValidationEnabledFalse } from '/imports/api/indexDB'
import SimpleSchema from 'simpl-schema';
import { check } from 'meteor/check'
import { sendMessage } from '/imports/api/activityLog/methods'


SimpleSchema.defineValidationErrorTransform(error => {
  const ddpError = new Meteor.Error(error.message);
  ddpError.error = 'validation-error';
  ddpError.details = error.details[0].message;
  return ddpError;
});



export const newProblem = new ValidatedMethod({
  name: 'newProblem',
	validate: new SimpleSchema(Problems.schema.pick("type","header","text","images","images.$","bounty"), {
		requiredByDefault: developmentValidationEnabledFalse
	}).validator({clean:true}),
  run({ type, header, text, images, bounty }) {
			if (Meteor.userId()) {
				if (bounty > 0) { // check if the user can finance the bounty
					let user = UserData.findOne({
						_id: Meteor.userId()
					})

					if (user.balance < bounty) {
						throw new Meteor.Error('Error.', 'messages.problems.insufficient_funds')
					}
				}

				Problems.insert({
					type: type,
					header: header,
					text: text,
					images: images,
					createdBy: Meteor.userId(),
					date: new Date().getTime(),
					credit: [{
						userId: Meteor.userId(),
						bounty: bounty
					}],
					open: true,
					solved: false,
					taken: {},
					locked: false,
					cancelled: false,
					votes: [],
					score: 0
				})

				if (bounty > 0) { // take the bounty from user's wallet
					var userData = UserData.findOne({ _id : Meteor.userId() })

					if (userData.balance && typeof(userData.balance) === 'string') {
						var balance = parseFloat(userData.balance);

						// unset the initial balance which is a string value
						UserData.update({ _id: Meteor.userId() }, {
							$unset : { balance: true }
						})

						// update user data with new numerical balance value
						UserData.update({ _id: Meteor.userId() }, {
							$set : { balance: balance }
						})
					}
					
					UserData.upsert({
						_id: Meteor.userId()
					}, {
						$inc: {
							balance: -bounty
						}
					})

				    Wallet.insert({
				    	time: new Date().getTime(),
				    	owner: Meteor.userId(),
				    	type: 'transaction',
				      	from: 'Blockrazor',
				      	message: `KZR has been reserved from your account for funding a problem.`,
				      	amount: -bounty,
				     	read: false,
				     	rewardType: 'problem'
				    })
				}
			} else {
				throw new Meteor.Error('Error.', 'messages.login')
			}
  }
});


Meteor.methods({
	takeProblem: (problemId, additional) => {
		check(problemId, String)
		check(additional, Object)

		let problem = Problems.findOne({
			_id: problemId
		})

		let user = Meteor.users.findOne({
			_id: Meteor.userId()
		})

		const Future = require('fibers/future')
		const fut = new Future()

		if (problem) {
			if (Meteor.userId()) {
				if (~['bug', 'feature'].indexOf(problem.type)) { // check if the problem type is appropriate
					if (!problem.locked && !problem.cancelled && !problem.closed && !problem.solved) {
						let others = Problems.find({
							'taken.userId': Meteor.userId(),
							solved: false
						}).count()

						if (!others) { // user is not currently working on any other problem
							Meteor.call('checkProblemAdditionalInfo', additional, (err, data) => {
								fut.return(data) // check if everything is alright
							})

							let d = fut.wait()
							console.log(d)
							if (d) {
								Problems.update({
									_id: problem._id
								}, {
									$set: {
										taken: {
											userId: Meteor.userId(),
											date: new Date().getTime(),
											additional: additional
										},
										locked: true
									}
								})

								sendMessage(problem.createdBy, `${user.username} has claimed your problem.`, 'System', `/problem/${problem._id}`, 'problem')
							} else {
								throw new Meteor.Error('Error.', 'messages.problems.git_invalid')
							}
						} else {
							throw new Meteor.Error('Error.', 'messages.problems.already_working')
						}
					} else {
						throw new Meteor.Error('Error.', 'messages.problems.already_taken')
					}
				} else {
					throw new Meteor.Error('Error.', 'messages.problems.invalid_take')
				}
			} else {
				throw new Meteor.Error('Error.', 'messages.login')
			}
		} else {
			throw new Meteor.Error('Error.', 'messages.problems.invalid_problem')
		}
	},
	checkProblemAdditionalInfo: (additional) => { // api validation for fork and issue URL
		check(additional, Object)

		const Future = require('fibers/future')
		const fut = new Future()

		if (additional.fork && additional.issue) {
			let repo = additional.fork.replace(/((http|https):\/\/)?github.com\//, '').replace(/\/+$/, '')
			let issue = additional.issue.replace(/((http|https):\/\/)?github.com\//, '').replace(/\/+$/, '')

			HTTP.get(`https://api.github.com/repos/${repo}`, {
      			headers: {
        			"User-Agent": "gazhayes-blockrazor"
      			}
    		}, (err, data) => {
				if (!err) {
					HTTP.get(`https://api.github.com/repos/${issue}`,  {
		      			headers: {
		        			"User-Agent": "gazhayes-blockrazor"
		      			}
		    		}, (err, data) => {
						if (!err) {
							fut.return(true)
						} else {
							console.log(err)
							fut.return(false)
						}
					})
				} else {
					console.log(err)
					fut.return(false)
				}
			})

			return fut.wait()
		} else {
			throw new Meteor.Error('Error.', 'messages.problems.no_fork')
		}
	},
	cancelProblem: (problemId) => {
		check(problemId, String)

		let problem = Problems.findOne({
			_id: problemId
		})

		if (problem) {
			if (!problem.locked) {
				if (Meteor.userId() && Meteor.userId() === problem.createdBy) {
					Problems.update({
						_id: problem._id
					}, {
						$set: {
							open: false,
							cancelled: true,
							locked: true
						}
					})

					problem.credit.forEach(i => {
						UserData.upsert({
							_id: i.userId
						}, {
							$inc: {
								balance: i.bounty
							}
						})

					    Wallet.insert({
					    	time: new Date().getTime(),
					    	owner: i.userId,
					    	type: 'transaction',
					      	from: 'Blockrazor',
					      	message: `KZR has been returned to your account because the problem has been cancelled.`,
					      	amount: i.bounty,
					     	read: false,
					     	rewardType: 'problem'
					    })
					})
				} else {
					throw new Meteor.Error('Error.', 'messages.problems.cancel_own')
				}
			} else {
				throw new Meteor.Error('Error.', 'messages.problems.cancel_solving')
			}
		} else {
			throw new Meteor.Error('Error.', 'messages.problems.invalid_problem')
		}
	},
	addProblemCredit: (problemId, amount) => {
		check(problemId, String)
		check(amount, Number)

		let problem = Problems.findOne({
			_id: problemId
		})

		if (problem.cancelled || problem.solved || problem.closed) {
			throw new Meteor.Error('Error.', 'messages.problems.problem_closed')
		} else {
			if (problem) {
				if (amount > 0) { // check if the user can finance the bounty
					let user = UserData.findOne({
						_id: Meteor.userId()
					})

					if (user.balance < amount) {
						throw new Meteor.Error('Error.', 'messages.problems.insufficient_funds')
					}

					UserData.upsert({
						_id: Meteor.userId()
					}, {
						$inc: {
							balance: -amount
						}
					})

				    Wallet.insert({
				    	time: new Date().getTime(),
				    	owner: Meteor.userId(),
				    	type: 'transaction',
				      	from: 'Blockrazor',
				      	message: `KZR has been reserved from your account for funding a problem.`,
				      	amount: -amount,
				     	read: false,
				     	rewardType: 'problem'
				    })

				    Problems.update({
				    	_id: problem._id
				    }, {
				    	$push: {
				    		credit: {
				    			userId: Meteor.userId(),
				    			bounty: amount
				    		}
				    	}
				    })
				} else {
					throw new Meteor.Error('Error.', 'messages.problems.invalid_amount')
				}
			} else {
				throw new Meteor.Error('Error.', 'messages.problems.invalid_problem')
			}
		}
	},
	removeProblemCredit: (problemId) => {
		check(problemId, String)

		let problem = Problems.findOne({
			_id: problemId
		})

		if (problem) {
			if (!problem.locked) {
				let amount = problem.credit.filter(i => i.userId === Meteor.userId())

				if (amount) {
					amount.forEach(i => {
						UserData.upsert({
							_id: Meteor.userId()
						}, {
							$inc: {
								balance: i.bounty
							}
						})

					    Wallet.insert({
					    	time: new Date().getTime(),
					    	owner: Meteor.userId(),
					    	type: 'transaction',
					      	from: 'Blockrazor',
					      	message: `KZR has been returned to your account because you cancelled the reward.`,
					      	amount: i.bounty,
					     	read: false,
					     	rewardType: 'problem'
					    })

					    Problems.update({
					    	_id: problem._id
					    }, {
					    	$pull: {
					    		credit: i
					    	}
					    })
					})
				} else {
					throw new Meteor.Error('Error.', 'messages.problems.no_credit')
				}
			} else {
				throw new Meteor.Error('Error.', 'messages.problems.taken_credit')
			}
		} else {
			throw new Meteor.Error('Error.', 'messages.problems.invalid_problem')
		}
	},
	solveProblem: (problemId) => {
		check(problemId, String)

		let problem = Problems.findOne({
			_id: problemId
		})

		if (problem && !problem.solved) {
			if (problem.taken.userId === Meteor.userId()) {
				Problems.update({
					_id: problem._id
				}, {
					$set: {
						solved: true
					}
				})
			} else {
				throw new Meteor.Error('Error.', 'messages.problems.invalid_solve')
			}
		} else {
			throw new Meteor.Error('Error.', 'messages.problems.invalid_problems')
		}
	},
	giveUpProblem: (problemId) => {
		check(problemId, String)

		let problem = Problems.findOne({
			_id: problemId
		})

		if (problem) {
			if (problem.taken.userId === Meteor.userId()) {
				Problems.update({
					_id: problem._id
				}, {
					$set: {
						taken: {},
						locked: false
					}
				})
			} else {
				throw new Meteor.Error('Error.', 'messages.problems.invalid_giveup')
			}
		} else {
			throw new Meteor.Error('Error.', 'messages.problems.invalid_problem')
		}
	},
	problemVote: (problemId, type) => {
        if (!Meteor.userId()) {
        	throw new Meteor.Error('Error.', 'messages.login')
        }

        let mod = UserData.findOne({
        	_id: Meteor.userId()
        }, {
        	fields: {
        		moderator: true
        	}
        })

        if (!mod || !mod.moderator) {
          	throw new Meteor.Error('Error.', 'mod-only')
        }

        let problem = Problems.findOne({
        	_id: problemId
        })

        if (problem && problem.solved) { // this only works on solved problems
	        if (!(problem.votes || []).filter(i => i.userId === Meteor.userId()).length) { // user hasn't voted yet
	        	Problems.update({
	        		_id: problem._id
	        	}, {
	        		$inc: {
	        			score: type === 'voteUp' ? 1 : -1, // increase or decrease the current score
	        			[type === 'voteUp' ? 'upvotes' : 'downvotes']: 1 // increase upvotes or downvotes
	        		},
	        		$push: {
	        			votes: {
	        				userId: Meteor.userId(),
	        				type: type,
	        				time: new Date().getTime()
	        			}
	        		}
	        	})
	        }

	        let approveChange = Problems.find({
	        	_id: problem._id
	        }, {
	        	fields: {
	        		score: 1,
	        		upvotes: 1,
	        		downvotes: 1
	        	}
	        }).fetch()[0]

	        if (approveChange.score >= 3) {
	            Problems.update({
	            	_id: problem._id
	            }, {
	            	$set: {
	            		closed: true,
	            		open: false
	            	}
	            })

	            let amount = problem.credit.reduce((i1, i2) => i1 + i2.bounty, 0)

	            UserData.upsert({
					_id: problem.taken.userId
				}, {
					$inc: {
						balance: amount
					}
				})

			    Wallet.insert({
			    	time: new Date().getTime(),
			    	owner: Meteor.userId(),
			    	type: 'transaction',
			      	from: 'Blockrazor',
			      	message: `You have been rewarded with KZR for solving a problem.`,
			      	amount: amount,
			     	read: false,
			     	rewardType: 'problem'
			    })

	            return 'ok'
	        }

	        if (approveChange.score <= -3) {
				Problems.update({
	            	_id: problems._id
	            }, {
	            	$set: {
	            		solved: false,
	            		locked: false,
	            		taken: {}
	            	}
	            })

	            return 'not-ok'
	        }
    	} else {
			throw new Meteor.Error('Error.', 'messages.problems.invalid_problem')
		}
    },
    editProblem: (problemId, field, value) => {
		check(problemId, String)
		check(field, String)
		check(value, String)

		let problem = Problems.findOne({
			_id: problemId
		})

		if (problem) {
			if (!problem.locked) {
				if (Meteor.userId() && Meteor.userId() === problem.createdBy) {
					if (~['header', 'text'].indexOf(field)) {
						Problems.update({
							_id: problem._id
						}, {
							$set: {
								[field]: value
							}
						})
					} else {
						throw new Meteor.Error('Error.', 'messages.problems.invalid_field')
					}
				} else {
					throw new Meteor.Error('Error.', 'messages.problems.invalid_edit')
				}
			} else {
				throw new Meteor.Error('Error.', 'messages.problems.edit_solving')
			}
		} else {
			throw new Meteor.Error('Error.', 'messages.problems.invalid_problem')
		}
	},
	uploadProblemImage: (fileName, binaryData, md5) => {
    	let md5validate = CryptoJS.MD5(CryptoJS.enc.Latin1.parse(binaryData)).toString()

      	if (md5validate !== md5) {
        	throw new Meteor.Error('Error.', 'messages.problems.invalid_md5')
        	return false
      	}
        if (!Meteor.userId()) {
          	throw new Meteor.Error('Error.', 'messages.login');
          	return false
        }

        const fs = require('fs')

        let mime = require('/imports/api/miscellaneous/mime').default
        let mimetype = mime.lookup(fileName)
        let validFile = _supportedFileTypes.includes(mimetype)
        let fileExtension = mime.extension(mimetype)
        let filename = `${_problemUploadDirectory}${md5}.${fileExtension}`
        let filename_thumbnail = `${_problemUploadDirectory}${md5}_thumbnail.${fileExtension}`

        let insert = false

        if (!validFile) {
            throw new Meteor.Error('Error.', 'messages.problems.invalid_file');
            return false
        }

        try {
        	insert = ProblemImages.insert({
            	_id: md5,
            	createdAt: new Date().getTime(),
            	createdBy: Meteor.userId(),
            	extension: fileExtension
          	})
        } catch(error) {
        	throw new Meteor.Error('Error.', 'messages.problems.image_exists');
        }

        if (insert !== md5) {
        	throw new Meteor.Error('Error.', 'messages.problems.something_wrong')
        }

        fs.writeFileSync(filename, binaryData, {
        	encoding: 'binary'
        }, Meteor.bindEnvironment((error) => {
            if (error) {
            	log.error('Error in uploadProblemImage', error)
            }
        }))

        if (gm.isAvailable) {
            var size = { width: 100, height: 100 };
            gm(filename)
                .resize(size.width, size.height + ">")
                .gravity('Center')
                .write(filename_thumbnail, function(error) {
                    if (error) console.log('Error - ', error)
                })
        }
	},
	addProblemComment: (problemId, parentId, text, depth) => {
		check(problemId, String)
		check(parentId, String)
		check(text, String)
		check(depth, Number)

		let problem = Problems.findOne({
			_id: problemId
		})

		if (problem) {
			if (Meteor.userId()) {
			    let user = Meteor.users.findOne({
			      _id: Meteor.userId()
			    })

			    sendMessage(problem.createdBy, `${user.username} has commented on your problem.`, 'System', `/problem/${problem._id}`, 'problem')
				
				return ProblemComments.insert({
					problemId: problem._id,
					parentId: parentId,
					depth: depth,
					createdBy: Meteor.userId(),
					author: Meteor.users.findOne({
						_id: Meteor.userId()
					}).username,
					date: new Date().getTime(),
					text: text,
					appeal: 2,
				    appealNumber: 2,
				    appealVoted: [Meteor.userId()],
				    rating: 1
				})
			} else {
				throw new Meteor.Error('Error.', 'messages.login')
			}
		} else {
			throw new Meteor.Error('Error.', 'messages.problems.invalid_problem')
		}
	},
	problemCommentVote: (commentId, direction) => {
        if (Meteor.userId()) {
            let comment = ProblemComments.findOne({
                _id: commentId
            })

            if (comment) {
	            if (_.include(comment.appealVoted, Meteor.userId())) {
	                throw new Meteor.Error('Error', 'messages.problems.vote_once')
	            }

	            ProblemComments.update({
	                _id: commentId
	            }, {
	                $addToSet: {
	                    appealVoted: Meteor.userId()
	                },
	                $inc: {
	                    appeal: direction,
	                    appealNumber: 1
	                }
	            })

	            ProblemComments.upsert({
	                _id: commentId
	            }, {
	                $set: {
	                    rating: comment.appeal / comment.appealNumber
	                }
	            })
        	} else {
        		throw new Meteor.Error('Error.', 'messages.problems.invalid_comment')
        	}
        } else {
            throw new Meteor.Error('Error', 'messages.login')
        }
    },
    acceptAnswer: (problemId, commentId) => {
    	check(problemId, String)
    	check(commentId, String)

    	let problem = Problems.findOne({
			_id: problemId
		})

		let comment = ProblemComments.findOne({
			_id: commentId
		})

		if (problem && problem.type === 'question' && !problem.accepted) { // authors can only accept solution on questions, other types need moderator approval
			if (Meteor.userId() && Meteor.userId() === problem.createdBy) {
				if (comment && comment.createdBy !== Meteor.userId()) {
					Problems.update({
						_id: problem._id
					}, {
						$set: {
							solved: true,
							closed: true,
							accepted: commentId,
							locked: true,
							open: false
						}
					})

					UserData.update({
						_id: comment.createdBy
					}, {
						$inc: {
							answerPoints: 1
						}
					})
				} else {
					throw new Meteor.Error('Error.', 'messages.problems.invalid_comment')
				}
			} else {
				throw new Meteor.Error('Error.', 'messages.problems.invalid_accept')
			}
		} else {
        	throw new Meteor.Error('Error.', 'messages.problems.invalid_problem')
        }
    },
    isWorkingOnAProblem: (userId) => {
    	check(userId, String)

    	return !!Problems.findOne({
    		'taken.userId': userId,
    		solved: false
    	})
    },
    cleanTakenProblems: () => {
    	Problems.find({}).fetch().forEach(i => {
    		if (!_.isEmpty(i.taken)) {
    			if (i.taken.date + 5*24*60*60*1000 - new Date().getTime() <= 0) { // 5 days have passed
    				Problems.update({
    					_id: i._id
    				}, {
    					taken: {},
    					locked: false
    				})
    			}
    		}
    	})
    }
})


Meteor.methods({
	fetchProblems(){
		return Problems.find().fetch()
	}
})
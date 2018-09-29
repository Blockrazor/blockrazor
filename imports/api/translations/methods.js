import { Meteor } from 'meteor/meteor'
import fs from 'fs'
import { gitCommitPush } from 'git-commit-push-via-github-api'
const octokit = require('@octokit/rest')()

import { Translations } from './translations'
import { UserData } from '/imports/api/indexDB'

const dirname = process.env.PWD

const deepMerge = (target, source) => {
  	for (let key in source) {
    	let original = target[key]
    	let next = source[key]

		if (original && next && typeof next == 'object') {
			deepMerge(original, next)
		} else {
			target[key] = next
		}
	}
  	
  	return target
}

Meteor.methods({
	getLanguageScopes: (lang) => {
		return fs.readdirSync(`${dirname}/i18n`).filter(i => i.includes(`${lang}.i18n.json`)).map(i => i.replace(`.${lang}.i18n.json`, ''))
	},
	getLanguageData: (scope, lang) => {
		let data = {}

		try {
			data = JSON.parse(fs.readFileSync(`${dirname}/i18n/${scope}.${lang}.i18n.json`).toString('utf-8'))
		} catch(e) {}

		let translation = Translations.findOne({
			scope: scope,
			language: lang
		})

		if (translation) {
			return deepMerge(data, translation.data)
		}

		return data
	},
	saveLanguageData: (scope, lang, langName, data) => {
		const unflatten = data => {
  			let result = {}
  			
  			for (let i in data) {
    			let keys = i.split('.')
    			
    			keys.reduce((r, e, j) => {
      				return r[e] || (r[e] = isNaN(Number(keys[j + 1])) ? (keys.length - 1 == j ? data[i] : {}) : [])
    			}, result)
  			}
  
  			return result
  		}

  		data = unflatten(data)

		let prevData = {}
		try {
			prevData = JSON.parse(fs.readFileSync(`${dirname}/i18n/${scope}.${lang}.i18n.json`).toString('utf-8'))
		} catch(e) {}

		let translation = Translations.findOne({
			scope: scope,
			language: lang
		})

		if (translation) {
			prevData = deepMerge(prevData, translation.data)
		}

		let newData = deepMerge(prevData, data)

		if (translation) {
			Translations.update({
				_id: translation._id
			}, {
				$set: {
					data: newData,
					lastEdit: new Date().getTime(),
					status: 'new',
					votes: [],
					score: 0,
					upvotes: 0,
					downvotes: 0
				},
				$addToSet: {
					authors: Meteor.userId()
				}
			})
		} else {
			Translations.insert({
				scope: scope,
				language: lang,
				languageName: langName,
				data: newData,
				lastEdit: new Date().getTime(),
				status: 'new',
				authors: [Meteor.userId()]
			})
		}

		// fs.writeFileSync(`${dirname}/i18n/${scope}.${lang}.i18n.json`, JSON.stringify(newData), { flag: 'w' })
	},
	sendDailyPRRequest: async () => {
		let translations = Translations.find({
			status: 'approved'
		}).fetch()

		// if there are approved translations that still haven't been merged
		if (translations.length) {
			let scope = {}

			translations.forEach(i => {
				scope[i.scope] = scope[i.scope] || []

				scope[i.scope].push(i.languageName)
			})

			// generate a solution string
			let translatedScopes = Object.keys(scope).map(i => `${i} (${scope[i].toString().replace(/,/g, ', ')})`).toString().replace(/,/g, ', ')

			// authenticate with github
			octokit.authenticate({
  				type: 'token',
  				token: process.env.GITHUB_API_TOKEN
			})

			// get the latest ref from Blockrazor master branch
			let ref = await octokit.gitdata.getReference({
				owner: 'blockrazor',
				repo: 'Blockrazor',
				ref: 'heads/master'
			})

			// update our fork's translate branch to the latest commit, to prevent conflicts
			let update = await octokit.gitdata.updateReference({
				owner: 'emurgobot',
				repo: 'Blockrazor',
				ref: 'heads/translate',
				sha: ref.data.object.sha,
				force: true
			})

			// push all translation files that can be merged
			gitCommitPush({
			    owner: 'emurgobot',
			    repo: 'Blockrazor',
			    files: translations.map(i => ({
			    	path: `i18n/${i.scope}.${i.language}.i18n.json`,
			    	content: new Buffer(JSON.stringify(i.data, null, 4))
			    })),
			    fullyQualifiedRef: 'heads/translate',
			    forceUpdate: false,
			    token: process.env.GITHUB_API_TOKEN,
			    commitMessage: 
`Problem: Blockrazor strings are not translated

Solution: Translate ${translatedScopes}.
`
			}).then(res => {
				// finally, create a PR following C4
				octokit.pullRequests.create({
					owner: 'blockrazor', 
					repo: 'Blockrazor',
					title: 'Problem: Blockrazor strings are not translated',
					head: 'emurgobot:translate',
					base: 'master',
					body: `Solution: Translate ${translatedScopes}.`
				}).then(data => {
					Translations.update({
						_id: {
							$in: translations.map(i => i._id)
						}
					}, {
						$set: {
							status: 'pr-sent'
						}
					})
				})
			}).catch(err => {})
		}
	},
	translationVote: function(translationId, type) {
        if (!Meteor.userId()) {
        	throw new Meteor.Error('Error.', 'messages.login')
        }

        let mod = UserData.findOne({
        	_id: this.userId
        }, {
        	fields: {
        		moderator: true
        	}
        })

        if (!mod || !mod.moderator) {
          	throw new Meteor.Error('Error.', 'mod-only')
        }
        
        let translation = Translations.findOne({
        	_id: translationId
        }) || {}

        if (!(translation.votes || []).filter(i => i.userId === this.userId).length) {
        	Translations.update({
        		_id: translation._id
        	}, {
        		$inc: {
        			score: type === 'voteUp' ? 1 : -1,
        			[type === 'voteUp' ? 'upvotes' : 'downvotes']: 1
        		},
        		$push: {
        			votes: {
        				userId: this.userId,
        				type: type,
        				time: new Date().getTime()
        			}
        		}
        	})
        }
           
        let approveChange = Translations.find({
        	_id: translation._id
        }, {
        	fields: {
        		score: 1,
        		upvotes: 1,
        		downvotes: 1 
        	} 
        }).fetch()[0]

        if (approveChange.score >= 2) {
            Translations.update({
            	_id: translation._id
            }, {
            	$set: {
            		status: 'approved'
            	}
            })

            return 'ok'
        }

        if (approveChange.score <= -2) {
			Translations.remove({
				_id: translation._id
			})
                
            return 'not-ok'
        }
    }
})
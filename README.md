# Blockrazor

## To run locally:   
#### Install Meteor   
curl https://install.meteor.com/ | sh   

#### Clone repository    
git clone https://github.com/Blockrazor/blockrazor.git

Note: if you want to edit things and send a pull request you should _fork_ this project on Github first and clone _your_ fork instead of https://github.com/Blockrazor/blockrazor.git.

#### Install Dependencies
`meteor npm install --save core-js`   
`meteor npm install`   

#### Set environment variables for local usage
`export ROOT_URL=http://localhost:3000`    
`export HTTP_FORWARDED_COUNT=0`    

For blockrazor.org production server:   
`export ROOT_URL=https://blockrazor.org`
`export HTTP_FORWARDED_COUNT=1`

#### Run meteor
`meteor`   
(use `meteor --production` to minify everything and simulate production speeds    

#### Insert the database if running locally (never for production)
While meteor is running, in a new shell from within the Blockrazor directory run:
`mongorestore -h 127.0.0.1 --port 3001 -d meteor dump/meteor`   
(You will need Mongo to be installed so you have mongorestore on your system).

If you already have the database but want to update it to the latest version, do a `meteor reset` first.

### Mongo errors   
If Mongo exists with status 1:
Quick fix: `export LC_ALL=C`   
Proper fix: something is wrong with your OS locales, good luck.


## Contributing
Contribution protocol/policy: [Collective Code Construction Contract (C4)](/CONTRIBUTING.MD)    

If you're wondering why any of the rules in the C4 are there, take a look at the [line by line explanation](/DESCRIPTIVE_C4.MD) of everything in the C4, this explains the rationale and history behind everything in the protocol and makes it easier to understand.

### Contributing FAQ
#### Q: I'm kind of new to Github, how do I get started?   
0. Read the [contribution protocol](/CONTRIBUTING.MD) and the [line by line explanation](/DESCRIPTIVE_C4.MD) of the protocol.    
1. Fork this github repository under your own github account.    
2. Clone _your_ fork locally on your development machine.   
3. Choose _one_ problem to solve. If you aren't solving a problem that's already in the issue tracker you should describe the problem there (and your idea of the solution) first to see if anyone else has something to say about it (maybe someone is already working on a solution, or maybe you're doing somthing wrong).

**If the issue is in the issue tracker, you should comment on the issue to say you're working on the solution so that other people don't work on the same thing.**    

4. Add the Blockrazor repository as an upstream source and pull any changes:    
```
@: git remote add upstream git://github.com/blockrazor/blockrazor //only needs to be done once
@: git checkout master //just to make sure you're on the correct branch
@: git pull upstream master //this grabs any code that has changed, you want to be working on the latest 'version'
@: git push //update your remote fork with the changes you just pulled from upstream master
```
5. Create a local branch on your machine `git checkout -b branch_name` (it's usually a good idea to call the branch something that describes the problem you are solving). Never develop on the `master` branch, as the `master` branch is exclusively used to accept incoming changes from `upstream:master`.
6. Solve the problem in the absolute most simple and fastest possible way with the smallest number of changes humanly possible. Tell other people what you're doing by putting _very clear and descriptive comments in your code every 2-3 lines_.    
Add your name to the AUTHORS file so that you become a part owner of Blockrazor.    
7. Commit your changes to your own fork:
Before you commit changes, you should check if you are working on the latest version (again). Go to the github website and open _your_ fork of Blockrazor, it should say _This branch is even with Blockrazor:master._    
If **not**, you need to pull the latest changes from the upstream Blockrazor repository and replay your changes on top of the latest version:
```
@: git stash //save your work locally
@: git checkout master
@: git pull upstream master
@: git push
@: git checkout -b branch_name_stash
@: git stash pop //_replay_ your work on the new branch which is now fully up to date with the Blockrazor repository
```

Note: after running `git stash pop` you should look over your code again and check that everything still works as sometimes a file you worked on was changed in the meantime.

Now you can add your changes:   
```
@: git add changed_file.js //repeat for each file you changed
```

And then commit your changes:
```
@: git commit -m 'problem: very short description of problem //do not close the '', press ENTER two (2) times
>
>solution: short description of how you solved the problem.' //Now you can close the ''. Also mention the issue number if there is one (e.g. #6)    
@: git push //this will send your changes to _your_ fork on Github
```    
8. Go to your fork on Github and select the branch you just worked on. Click "pull request" to send a pull request back to the Blockrazor repository.
9. Send the pull request.    

#### Q: What happens after I send a pull request?    
If your pull request contains a correct patch (read the C4) a maintainer should merge it.    
If you want to work on another problem while you are waiting for it to merge simply repeat the above steps starting at:    
```
@: git checkout master
```

#### Q: Can I be paid to contribute to Blockrazor?
Yes, this is sometimes possible. Your first step is to _very carefully read and understand everything above_, including the linked files, then start fixing problems and sending pull requests! If your code is amazing and brilliant but you don't understand the contribution process we cannot consider you for a paid position. Make sure you follow the project on Github so you get updates. Contact Blockrazor's BDFL (Benevolent Dictator For Life): gareth.hayes AT gmail.com if you've been contributing code to Blockrazor and want to keep doing it but but you require financial assistance.

## License
This project is licensed under the [MPL v2.0 license](LICENSE) and Copyright [AUTHORS](AUTHORS).

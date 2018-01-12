# Blockrazor

## To run locally:   
#### Install Meteor   
curl https://install.meteor.com/ | sh   

#### Clone repository    
git clone https://github.com/Blockrazor/blockrazor.git

Note: if you want to edit things and send a pull request you should _fork_ this project first and clone your own fork instead of https://github.com/Blockrazor/blockrazor.git. [problem #42]

#### Install Dependencies
`meteor npm install --save core-js`   
`meteor npm install`   

#### Set environment variables
`export ROOT_URL=http://localhost:3000`    
(set to https://blockrazor.org for production)    
`export HTTP_FORWARDED_COUNT=0`    
(set to 1 for production if behind nginx forwarder)

#### Run meteor
`meteor`   
(use `meteor --production` to minify everything and simulate production speeds    

### Mongo errors   
If Mongo exists with status 1:
Quick fix: `export LC_ALL=C`   
Proper fix: something is wrong with your OS locales, good luck.


## Contributing
Contributing to Blockrazor should be a fun experience. To try and keep it fun (as well as maintain quality) we follow the [Collective Code Construction Contract (C4)](/CONTRIBUTING.MD), which is essentially a hill climbing algorithm applied to the github fork+pull model. Please respect others involved in this project by reading the contract before sending a pull request.

If you're wondering why any of the rules in the C4 are there, take a look at the [line by line explanation](/DESCRIPTIVE_C4.MD) of everything in the C4, this explains the rationale behind everything in the protocol.

### Contributing FAQ
#### Q: How do I get started?   
0. Read the [contribution protocol](/CONTRIBUTING.MD) and the [line by line explanation](/DESCRIPTIVE_C4.MD) of the protocol. Seriously, read it, don't be lazy.
1. Fork this github repository under your own github account.    
2. Clone _your_ fork locally on your development machine.   
3. Choose _one_ problem to solve. If you aren't solving a problem that's already in the issue tracker you should describe the problem there (and your idea of the solution) first to see if anyone else has something to say about it (maybe someone is already working on a solution, or maybe you're doing somthing wrong). If the issue is in the issue tracker, you should comment on the issue to say you're working on the solution so that other people don't work on the same thing.
3. Add the Blockrazor repository as an upstream source and pull any changes:    
```
@: git remote add upstream git://github.com/blockrazor/blockrazor //only needs to be done once
@: git checkout master //just to make sure you're on the correct branch
@: git pull upstream master //this grabs any code that has changed, you want to be working on the latest 'version'
```
4. Create a local branch on your machine `git checkout -b branch_name`(it's usually a good idea to call the branch something that describes the problem you are solving).
5. Solve the problem in the absolute most simple possible way with the smallest number of changes humanly possible. Tell other people what you're doing by putting very clear and descriptive comments in your code every 2-3 lines. Add your name to the AUTHORS file.
6. Commit your changes to your own fork:    
```
@: git add changed_file.js //repeat for each file you changed
@: git commit -m 'problem: very short description of problem //do not close the '', press ENTER two (2) times
>
>solution: short description of how you solved the problem.' //Now you can close the ''. Also mention the issue number if there is one (e.g. #6)    
@: git push //this will send your changes to your fork on Github
```    
7. Go to your fork on Github and select the branch you just worked on. Click "pull request" to send a pull request back to the Blockrazor repository.
8. Send the pull request.    

#### Q: What happens after I send a pull request?    
If your pull request contains a correct patch (read the C4) a maintainer should merge it.    
If you want to work on another problem in the meantime simply repeat the above steps starting at:    
```
@: git checkout master
```

#### Q: Can I be paid to contribute to Blockrazor?
Possibly. Your first step is to very carefully read and understand everything above, then send your first pull request. The quality of your code is less important than understanding and following the process. Make sure you follow the project on Github so you get updates. Contact Blockrazor's BDFL (Benevolent Dictator For Life): gareth.hayes AT gmail.com for payment related questions.

## License
This project is licensed under the [MPL v2.0 license](LICENSE) and copyright [AUTHORS](AUTHORS).

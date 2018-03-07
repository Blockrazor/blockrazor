# Blockrazor
Every latest detail about every blockchain project in a comparison tool that anyone can understand.

<details>
  <summary>How to run Blockrazor locally</summary>
<p>
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
(You will need Mongo to be installed on your system).

If you already have the database but want to update it to the latest version, do a `meteor reset` before running the above.

#### Mongo errors   
If Mongo exists with status 1:
Quick fix: `export LC_ALL=C`   
Proper fix: something is wrong with your OS locales, good luck.

#### Meteor errors
If you do a `git pull` and Meteor doesn't start, the first thing to do is run `meteor npm install` as there may be package updates.

</p>
</details>


<details>
  <summary>Contributing to Blockrazor</summary>
<p>
A cardinal sin that many open source developers make is to place themselves above others. "I founded this project thus my intellect is superior to that of others". It's immodest and rude, and usually inaccurate. The contribution policy we use at Blockrazor applies equally to everyone, without distinction.    

The contribution policy we follow is the [Collective Code Construction Contract (C4)](/CONTRIBUTING.MD)    

If you're wondering why any of the rules in the C4 are there, take a look at the [line by line explanation](/DESCRIPTIVE_C4.MD) of everything in the C4, this explains the rationale and history behind everything in the protocol and makes it easier to understand.

Take a look at past [pull requests](https://github.com/Blockrazor/blockrazor/pulls?q=is%3Apr+is%3Aclosed) to see how we usually do things. You may also want to look at the [bad pull request role of honour](https://github.com/Blockrazor/blockrazor/pulls?utf8=✓&q=is%3Apr+label%3A"Bad+Pull+Request"+) to see how _not_ to send a pull request.
</p>
</details>

<details>
  <summary>Step-by-step guide to sending a pull request</summary>
<p>
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
5. Create a local branch on your machine `git checkout -b branch_name` (it's usually a good idea to call the branch something that describes the problem you are solving). _Never_ develop on the `master` branch, as the `master` branch is exclusively used to accept incoming changes from `upstream:master` and you'll run into problems if you try to use it for anything else.
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

Note: after running `git stash pop` you should run Meteor and look over your code again and check that everything still works as sometimes a file you worked on was changed in the meantime.

Now you can add your changes:   
```
@: git add changed_file.js //repeat for each file you changed
```

And then commit your changes:
```
@: git commit -m 'problem: <50 characters describing the problem //do not close the '', press ENTER two (2) times
>
>solution: short description of how you solved the problem.' //Now you can close the ''. Be sure to mention the issue number if there is one (e.g. #6)    
@: git push //this will send your changes to _your_ fork on Github
```    
8. Go to your fork on Github and select the branch you just worked on. Click "pull request" to send a pull request back to the Blockrazor repository.
9. Send the pull request.   

#### What happens after I send a pull request?    
If your pull request contains a correct patch (read the C4) a maintainer will merge it.    
If you want to work on another problem while you are waiting for it to merge simply repeat the above steps starting at:    
```
@: git checkout master
```

</p>
</details>

#### Can I be paid to contribute to Blockrazor?
Yes, this is sometimes possible. Your first step is to _very carefully read and understand everything above_, including the linked files, then start fixing problems and sending pull requests! If your code is amazing and brilliant but you don't understand the contribution process we cannot consider you for a paid position. Make sure you follow the project on Github so you get updates. Contact Blockrazor's BDFL (Benevolent Dictator For Life): gareth.hayes AT gmail.com if you've been contributing code to Blockrazor and want to keep doing it but but you are hungry.

## License
This project is licensed under the [MPL v2.0 license](LICENSE) and Copyright [AUTHORS](AUTHORS). This prevents others from using your code in a closed-source project competing with Blockrazor. Competitors to Blockrazor are welcome to use any code from this repository as long as their project is also released under a share-alike license and their code is public (so that anyone, including us, can use their improvements).

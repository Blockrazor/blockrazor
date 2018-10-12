# Blockrazor
#### Absolutely _all_ information about _every_ blockchain project in a comparison tool that _anyone_ can understand.   

[![Build Status](https://travis-ci.org/Blockrazor/blockrazor.svg?branch=master)](https://travis-ci.org/Blockrazor/blockrazor)   
https://blockrazor.org builds directly from Master with every merge.  
**Sample login credentials:**   
moderator: frank:rodviv   
user: simply create a new account for yourself.   

<img src="https://i.imgur.com/strfbRx.png" width="800px" height="auto">
<img src="https://i.imgur.com/BgiN7VA.png" width="800px" height="auto">       
<img src="https://i.imgur.com/IOSme9w.png" width="800px" height="auto">


<details>
  <summary>How to run Blockrazor locally</summary>
<p>

#### Install Meteor   
```
curl https://install.meteor.com/ | sh
```

#### Clone repository    
```
git clone https://github.com/Blockrazor/blockrazor.git
```

Note: if you want to edit things and send a pull request you should _fork_ this project on Github first and clone _your_ fork instead of https://github.com/Blockrazor/blockrazor.git.

#### Install Dependencies   
```
meteor npm install
```

#### Run meteor
`npm start`
(use `npm run prod` to minify everything and simulate production speeds)
(use `npm run debug` to start Meteor in debug mode)

If Meteor starts but you get a white screen:
```
meteor npm install --save core-js
```

#### Environment Variables

Create `.env` file on home directory and add your variables

#### Email Setup

Add `MAIL_URL` to `.env` file.

Example : For sendgrid email

```
MAIL_URL=smtp://username:password@smtp.sendgrid.net:587
```

#### Insert the database if running locally (never for production)
While meteor is running, in a new shell from *outside* of the Blockrazor directory run:
```
wget https://blockrazor.org/static/dump.tar.gz && tar -xvf dump.tar.gz && mongorestore -h 127.0.0.1 --port 3001 -d meteor dump/meteor
```   
(You will need [Mongo](https://docs.mongodb.com/manual/installation/) to be installed on your system).

If you already have the database but want to update it to the latest version, do a `meteor reset` before running the above.

#### Mongo errors   
If Mongo exists with status 1:
Quick fix: `export LC_ALL=C`   
Proper fix: something is wrong with your OS locales, good luck.

#### Meteor errors
If you do a `git pull` and Meteor doesn't start, the first thing to do is run `meteor npm install` as there may be package updates.

</p>
</details>    


## Contributing to Blockrazor    
A cardinal sin that many open source developers make is to place themselves above others. "I founded this project thus my intellect is superior to that of others". It's immodest and rude, and usually inaccurate. The contribution policy we use at Blockrazor applies equally to everyone, without distinction.    

The contribution policy we follow is the [Collective Code Construction Contract (C4)](/CONTRIBUTING.MD)    

If you're wondering why any of the rules in the C4 are there, take a look at the [line by line explanation](/DESCRIPTIVE_C4.MD) of everything in the C4, this explains the rationale and history behind everything in the protocol and makes it easier to understand.

Take a look at past [pull requests](https://github.com/Blockrazor/blockrazor/pulls?q=is%3Apr+is%3Aclosed) to see how we usually do things. You may also want to look at the [bad pull request role of honour](https://github.com/Blockrazor/blockrazor/issues?utf8=✓&q=label%3A"Bad+Pull+Request+Role+of+Honour") to see how _not_ to send a pull request.    

Want to see server logs? Go [here](https://blockrazor.org/static/log.txt).

The project style guide is [here](/STYLES.md).


<details>
  <summary>Step-by-step guide to sending a pull request</summary>
<p>

0. Read the [contribution protocol](/CONTRIBUTING.MD) and the [line by line explanation](/DESCRIPTIVE_C4.MD) of the protocol.
1. Fork this github repository under your own github account.
2. Clone _your_ fork locally on your development machine.
3. Choose _one_ problem to solve. If you aren't solving a problem that's already in the issue tracker you should describe the problem there (and your idea of the solution) first to see if anyone else has something to say about it (maybe someone is already working on a solution, or maybe you're doing somthing wrong).

**It is important to claim the issue you want to work on so that others don't work on the same thing. Make a comment in the issue: `@emurgobot claim` before you start working on the issue.**

If at some point you want to abandon the issue and let someone else have a go, comment: @emurgobot abandon.

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
9. Send the pull request, be sure to mention the issue number with a # symbol at the front (e.g. #1014).  
10. Go back to the issue, and make a comment:
  ```
    Done in #(PR_NUMBER)
    @emurgobot done
  ```
  
  This will label this issue as complete, and everyone can test your solution and close the issue if it solves the problem.

#### What happens after I send a pull request?    
If your pull request contains a correct patch (read the C4) a maintainer will merge it.
If you want to work on another problem while you are waiting for it to merge simply repeat the above steps starting at:
```
@: git checkout master
```

#### Tests
To run tests:
```
meteor test --driver-package practicalmeteor:mocha
```

You should generally write a test for anything you don't want to break later, otherwise it will probably end up being broken by someone. We use [Mocha + Chai](https://guide.meteor.com/testing.html#mocha) for testing. You can see an example in [this](https://github.com/Blockrazor/blockrazor/pull/378/files) pull request.
</p>
</details>    

<details>
  <summary>Can I be paid to contribute to Blockrazor?</summary>
<p>

Yes, this is sometimes possible.

Your first step is to _very carefully read and understand everything above_, including the linked files, then start fixing problems and sending pull requests!

If your code is amazing and brilliant but you don't understand the contribution process we cannot consider you for a paid position.

Make sure you follow the project on Github so you get updates.

Contact Blockrazor's BDFL (Benevolent Dictator For Life): gareth.hayes AT gmail.com if you've been contributing code to Blockrazor and want to keep doing it but you are hungry.

</p>
</details>


<details>
  <summary>Rules for paid contributors</summary>
<p>

0. Write tests for your code so that people don't break it later. We use We use [Mocha + Chai](https://guide.meteor.com/testing.html#mocha) for testing. You can see an example in [this](https://github.com/Blockrazor/blockrazor/pull/378/files) pull request.

1. Engage in discussion about problems even if you aren't working on them yourself. Be helpful to other contributors, many are volunteers who just want to be part of the project. You (should) have a pretty good understanding of the codebase and can probably save others a lot of time.

2. Your code should be _very_ well commented and easy to read. It should be immediately clear what your code is doing. You should be able to look at your code a year later, in the morning before coffee, and immediately know what it's doing. Write code and comments like you are teaching someone else how to do what you're doing.

3. Your pull requests should be a glowing example to others of how to work with the C4. Each one should be a model that others can refer to.

4. In an ideal world, you would be able to work on any issue you want and there would be no need to assign tasks so that our budget is kept under control. This would be possible because you would always work on the the problems that are _really_ worth solving _right now_ to get to some form of MVP. We can't predict the future, there are no plans or roadmaps (these are not compatible with the C4). Blockrazor grows through evolution not intelligent design or central planning. So if something isn't an in-your-face problem right now, it may never be, we could end up going down a totally different road before we get to it. While we want to avoid technical debt, we also don't want to be working on things that will someday maybe become a problem if Blockrazor becomes a thing. Demonstrate that we can trust _your_ own judgement on what you should be working on and what's worth spending time on.
</p>
</details>

## License
The license and contribution policy are two halves of the same puzzle. This project is licensed under the [MPL v2.0 license](LICENSE). The code is owned (and Copyright) by _all_ contributors. Contributors are listed in the [AUTHORS](AUTHORS) file. Please add your name to the end of this file in your first pull request so that you also become an owner.

This license ensures that:
1. Contributors to Blockrazor cannot have their code stolen and used by closed-source projects without their permission. It's very common for corporate software merchants to steal code from open source projects and use it in their closed source or even patented products and services in direct competition with the original project. For example, anyone who contributes code to a project released under a BSD/MIT style license effectively has no rights to their own code or any improvements made upon it.
2. Anyone using any code from Blockrazor must also share their work under a _share-alike_ license so that anyone else can use their improvements.
3. No one can change the above, without explicit written permission from _all_ contributors, which is essentially impossible to get. That means even the founder of this project cannot ever relicense and sell Blockrazor and its code. It belongs to everyone who contributed to it (and it always will).

It is not permissible to use _any_ code from this codebase in _anything_ that isn't using a _share-alike_ license. Violations of the license will absolutely not be tolerated, and the terms of this license will be _brutally_ enforced through a variety of _very_ creative methods.

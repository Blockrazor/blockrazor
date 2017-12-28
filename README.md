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
Pull requests that are *correct patches* as per the [C4](https://rfc.zeromq.org/spec:42/C4) *will* be merged.

Plase read the C4, but most notably:   
* A patch SHOULD be a *minimal* and *accurate* answer to exactly one problem.
* A patch MUST compile cleanly and pass project self-tests on at least the principle target platform.
* A patch commit message MUST consist of a single short (less than 50 characters) line stating the problem ("Problem: ...") being solved, followed by a blank line and then the proposed solution ("Solution: ...").
* With your first pull request, please add your name to the AUTHORS file.

## License
This project is licensed under the [MPL v2.0 license](LICENSE) and copyright [AUTHORS](AUTHORS).

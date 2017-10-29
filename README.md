# Blockrazor

To build:   
Install Meteor:   
curl https://install.meteor.com/ | sh   
Clone repository    
`meteor npm install`
`meteor`   

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

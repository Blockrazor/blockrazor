# Running WDIO tests locally
In order to successfully run WDIO + Mocha tests locally, you'll have to follow the following steps:

### Installing and running selenium-standalone
- npm install selenium-standalone@latest -g
- selenium-standalone install
- selenium-standalone start &

(*Please note that first two commands only have to be run once, the first time*)

### Installing WDIO + Mocha
- npm install -g wdio-mocha-framework webdriverio assert

### Running WDIO tests
- wdio wdio.conf.js 

(*Please note that this command has to be run from the project directory*)

### Possible problems
- ERROR: unknown error: no chrome binary at /usr/bin/google-chrome-stable

If this error ocurrs, please update `wdio.conf.js` to use the correct path to `chrome` binary. 
Changing the path to `chrome` binary requires editing line 9 of `wdio.conf.js` (`binary: '/usr/bin/google-chrome-stable'`).
For example, to get it running on Windows, you'll probably have to change it to: 
`binary: 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'`.
Please don't commit your modified `wdio.conf.js` as it'll break Travis CI build cycle.
If you don't have Chrome installed, you'll have to install it first. The latest version works correctly in headless mode without modifications.

- All tests are failing

If you experience this error, please make sure that the Meteor instance is running, as WDIO doesn't report that the host is down, it just fails tests.

### Example output
If everything goes correctly, when running the tests, you'll currently get something like this:
```

..

2 passing (182.70s)
```
Don't worry if tests are taking too long, we have some time-intensive tests already.

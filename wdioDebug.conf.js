// didn't manage to get it to work
exports.config = {
  specs: ['./imports/**/*.ui-test.js'],
  exclude: [],
  maxInstances: 1,
  capabilities: [{
      browserName: 'chrome',
      chromeOptions: {
          args: ['--headless', '--disable-gpu', '--window-size=1280,800'],
      }
  }],
  debug: true,
  execArgv: ['--inspect=127.0.0.1:5859'],
  sync: true,
  logLevel: 'silent',
  coloredLogs: true,
  deprecationWarnings: true,
  bail: 0,
  screenshotPath: './screens/',
  baseUrl: 'http://localhost:3000',
  waitforTimeout: 100000,
  connectionRetryTimeout: 90000,
  connectionRetryCount: 3,
  framework: 'mocha',
  reporters: ['dot'],
  mochaOpts: {
      ui: 'bdd'
  }
}

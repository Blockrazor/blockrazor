exports.config = {
    specs: ['./imports/**/*.ui-test.js'],
    exclude: [],
    maxInstances: 10,
    capabilities: [{
        browserName: 'chrome',
        chromeOptions: {
            args: ['--headless', '--disable-gpu', '--window-size=1280,800'],
            binary: '/usr/bin/google-chrome-stable'
        }
    }],
    sync: true,
    logLevel: 'silent',
    coloredLogs: true,
    deprecationWarnings: true,
    bail: 0,
    screenshotPath: './screens/',
    baseUrl: 'http://localhost:3000',
    waitforTimeout: 10000,
    connectionRetryTimeout: 90000,
    connectionRetryCount: 3,
    framework: 'mocha',
    reporters: ['dot'],
    mochaOpts: {
        ui: 'bdd',
        timeout: 300000 // 300 seconds
    }
}

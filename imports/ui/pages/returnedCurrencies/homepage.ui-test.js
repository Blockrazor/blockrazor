const assert = require('assert')

const baseUrl = 'http://localhost:3000' // baseUrl of the app we are testing, it's localhost here, as we're starting a local server in Travis CI cycle

// see the full webdriverio browser API here: http://webdriver.io/api.html
describe('Home page', function () {
    it('Currencies should render properly', function () {
        browser.url(`${baseUrl}/`) // navigate to the home route `/`
        browser.pause(5000) // let it load, wait for 2 seconds
        assert(browser.isExisting('.container'), true) // check if at least one currency card has rendered, isExisting === $() !== undefined
        assert(browser.isVisible('.container'), true) // check if at least one currency card is visible on the page isVisible === $().is(':visible')
    })
})

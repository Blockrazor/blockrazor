const assert = require('assert')

const baseUrl = 'http://localhost:3000' // baseUrl of the app we are testing, it's localhost here, as we're starting a local server in Travis CI cycle

// see the full webdriverio browser API here: http://webdriver.io/api.html
describe('Mime should be available on the client', function () {
    it('Should be defined', function() {
      browser.timeouts('script', 5000)

      browser.url(`${baseUrl}/`)
      browser.pause(4000)

      let mime = browser.execute(() => {
        return window.mime
      })

      assert(!!mime.value, true)
    })

    it('Should have lookup and extension methods', function() {
      browser.timeouts('script', 5000)

      browser.url(`${baseUrl}/`)
      browser.pause(4000)

      let mime = browser.execute(() => {
        return window.mime
      })

      assert(!!mime.value.lookup, true)
      assert(!!mime.value.extension, true)
    })
})
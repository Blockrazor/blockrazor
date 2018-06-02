const assert = require('assert')

const baseUrl = 'http://localhost:3000/compareCurrencies' // baseUrl of the app we are testing, it's localhost here, as we're starting a local server in Travis CI cycle

describe('Localizable collection: ', function () {
    it('test initialization', function() {
        browser.url('http://localhost:3000')
        browser.pause(10000)

        browser.execute(() => {
            Meteor.call('generateTestUser', (err, data) => {})

            return 'ok'
        })

        browser.pause(10000)
        browser.execute(() => {
            Meteor.loginWithPassword('testing', 'testing')

            return 'ok'
        })

        browser.pause(2000)
    })

    it('populateLocal only calls method once', function() {
        browser.url(baseUrl)

        browser.execute(() => {
            Meteor.testCount = 0
            Meteor.tmp = Meteor.call

            Meteor.call = function() {
                let method = arguments[0]
                let params = Array.from(arguments)
                params.shift()

                if (method === 'fetchCurrencies') {
                    Meteor.testCount++
                }

                Meteor.apply(method, params)
            }

            return 'ok'
        })

        browser.pause(10000)

        assert(browser.execute(() => Meteor.testCount).value === 1, true)
        browser.pause(2000)
    })

    it('local collection is updated with live queries (observers) and insert are actionable', function() {
        browser.url(baseUrl)
        browser.pause(10000)

        browser.execute(() => {
            Meteor.call('newTestCurrency', (err, data) => {})
        })

        browser.pause(5000)

        assert(browser.execute(() => !!testingCurrencies.findOne({currencySymbol: 'NNN'})).value, true)
        browser.pause(2000)
    })

    it('all instances have method param that exists and returns data', function() { // add new instances here
        let instances = ['testingCurrencies', 'testingProblems', 'testingExchanges']

        instances.forEach(i => {
            browser.execute(i => {
                let method = window[i].methodName

                Meteor.call(method, (err, data) => {
                    Meteor[method] = data
                })
            }, i)

            browser.pause(7000)

            assert(browser.execute(i => !!Meteor[window[i].methodName], i).value, true)
        })

        browser.pause(2000)
    })
})
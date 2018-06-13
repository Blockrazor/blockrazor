const assert = require('assert')

const baseUrl = 'http://localhost:3000/compareCurrencies' // baseUrl of the app we are testing, it's localhost here, as we're starting a local server in Travis CI cycle

// see the full webdriverio browser API here: http://webdriver.io/api.html
describe("a:", function () { //typeahead's compareCurrencies implementation
    var childSel = 'div.tt-menu.tt-open>div>:nth-child(1)'
    var inputSel = '.tt-input'

    //opens typeahead menu

    function FRparams() {
        return browser.execute(() => {
            let path = window.location.pathname.replace(/\/$/, '')

            return path.substr(path.lastIndexOf('/') + 1).split('-').filter(i => !!i) // get the required array and filter out possible empty fields
        })
    }

    function exchangeExists(name) {
        return browser.execute((name) => {
            return !!testingExchanges.findOne({
                name: name
            })
        }, name).value
    }

    function listChild() {
        browser.click(inputSel)
        var currency = browser.execute(() => {
            var handle = Meteor.subscribe('approvedcurrencies')
            var list = $('div.tt-menu.tt-open').children()
            var name
            //if list is empty then the list div doesn't have children

            if (list.children().length) { // this will hold even if the data wasn't found, it'll return the div, so you can check here whether it's a currency or a notFound div and return the appropriate result
                name = list.children()[0].innerHTML

                return testingCurrencies.findOne({currencyName: name}) || testingCurrencies.findOne({currencyName: $(name).text()}) || $(name).text()
            } else {
                return list[0].innerHTML // This is the actual problem that causes tests to fail. innerHTML is currencyName, while we use currencySymbol in the URL. Adding a data attribute with currencySymbol and using that value or something similar should do the trick
            }
        }).value
        return currency
    }

    it('initializes test data successfully', function() {
        browser.url('http://localhost:3000/')
        browser.pause(10000)
        // tests were failing because there was no currency data in the CI environment, so we have to create some test data here
        browser.execute(() => {
            Meteor.call('generateTestCurrencies', (err, data) => {})
            Meteor.call('generateTestUser', (err, data) => {})
            Meteor.call('removeExchanges', (err, data) => {})

            return 'ok'
        })
        browser.pause(10000)
        browser.execute(() => {
            Meteor.loginWithPassword('testing', 'testing')

            return 'ok'
        })
        browser.pause(2000)
    })

    it('renders route comparedCurrencies with typeahead', function () {
        browser.url(`${baseUrl}/`) // navigate to the home route `/`
        browser.pause(10000) // let it load, wait for 2 seconds

        assert(browser.isExisting('.tt-input'), true) // check if at least one currency card has rendered, isExisting === $() !== undefined
        assert(browser.isVisible('.tt-input'), true) // check if at least one currency card is visible on the page isVisible === $().is(':visible')
    })
    it("follows 'focus' prop focusing on page enter", function () {
        assert(browser.hasFocus(inputSel), true)
    })
    it("follows 'quickEnter' prop, it triggers add action", function () {
        var child = listChild()
        browser.setValue(inputSel, "Enter")
        browser.pause(2000)
        assert(child.currencySymbol === FRparams().value.pop(), true)
        browser.click(".js-delete")
        browser.pause(1000)
    })
    it("will autocomplete", function () {
        var child = listChild()
        browser.setValue(inputSel, "Tab")
        browser.pause(2000)
        assert(child.currencySymbol === FRparams().value.pop(), true)
        browser.click(".js-delete")
        browser.pause(1000)
    })
    it("will select", function () {
        var child = listChild()
        browser.click(childSel)
        browser.pause(2000)
        assert(child.currencySymbol === FRparams().value.pop(), true)
        browser.click(".js-delete")
        browser.pause(1000)
    })
    it("updates typeahead menu source on outside change, works as if input is constantly focused(therefore testing cursor change as well)", function () {
        var child = listChild()
        browser.click(childSel)
        browser.pause(2000)
        assert(child._id != listChild()._id, true)

        // If I understand this test correctly, upon deletion of a currency that's compared, it should return to the menu for selection.
        // So, basically, if you select the first one, the ids of that one and the new first one in the list won't match (the first assert).
        // When you delete the currency, it should go back to the selection, so, ids of the first one and the deleted one match, as they're supposed to.
        // So, there's no need to update the child here, hence I've commented it out and the test works again.

        // child = listChild()
        browser.click(".js-delete")
        browser.pause(2000)
        assert(child._id == listChild()._id, true)
    })
    it("doesn't erase input on outside change", function () {
        listChild() //focus
        browser.click(childSel)
        browser.pause(2000)
        browser.setValue(inputSel, "bit")
        browser.click(".js-delete")
        browser.pause(2000)
        assert(browser.getValue(inputSel) == "bit", true)
    })
    it("can use nx framework (typeNX filename) for empty template", function () {
        assert(!!browser.execute(() => window.nx).value != false, true)
    })
    // it ("doesn't erase input on change of cursor observer", function(){ //no access to collections
    //   assert(true, true)r
    // })
    it("placeholder property works", function () {
        assert(browser.execute(() => $('.tt-input').attr('placeholder')).value === 'Select Currency', true)
    })
    it("limit property works", function () {
        browser.click(inputSel)
        browser.pause(1000)

        assert(browser.execute(() => $('div.tt-menu.tt-open').children().children().length).value < 15, true)
    })
    it("displayField property works", function() {
        let currency = listChild()

        assert(!!currency, true)
    })
    it("renders input text in empty template", function () {
        var string = "zzzzzzzzzzzzzzzzzzzzzz////"
        browser.setValue(inputSel, string)
        browser.pause(2000)
        var child = listChild()
        assert(child.indexOf(string)!= -1, true)
    })
    it('renders default empty text message', function () {
        const string = 'testingemptymessage'

        browser.setValue(inputSel, string)
        browser.pause(2000)
        
        const child = listChild()
        
        assert(child.indexOf('not found') !== -1, true)
    })
    it('when there\'s no item creation, neither inline nor external button exist', function () {
        const string = 'Somethingtotallyrandom'

        browser.setValue(inputSel, string)
        browser.pause(2000)
        
        const child = listChild()
        
        assert(child.indexOf('create') === -1, true)
        assert(!browser.isExisting('.createItem'), true)
    })
    it('creates an item with inline button click', function () {
        browser.setValue(inputSel, '')
        browser.pause(3000)

        browser.setValue(inputSel, 'test 0')
        browser.pause(3000)

        // console.log(browser.execute(() => testingCurrencies.find().fetch().map(i => i.currencyName)).value)

        const child = listChild()
        // console.log(child)

        browser.url(`http://localhost:3000/currency/${child.slug}`) // go to first child
        browser.pause(20000)

        browser.click('a[href$="#exchangestab"]')
        browser.pause(3000)

        const string = `RandomStringy${new Date().getTime()}`
        browser.setValue(inputSel, string)
        browser.pause(3000)

        browser.click('div.tt-menu.tt-open')
        browser.pause(5000)

        assert(exchangeExists(string), true)
        browser.pause(3000)
    })
    it('inline button exists and works if an external button is not available', function() {
        const string = `AnotherRnd${new Date().getTime()}`
        browser.setValue(inputSel, '') // empty it out
        browser.pause(2000)
        
        browser.setValue(inputSel, string)
        browser.pause(3000)

        browser.click('div.tt-menu.tt-open')
        browser.pause(5000)

        assert(exchangeExists(string), true)

        assert(!browser.isExisting('.createItem'), true)
        browser.pause(3000)
    }) // note that the browser is on addcoin page right now
    it('creates an item when the external button is clicked', function() {
        browser.url('http://localhost:3000/addcoin')
        browser.pause(10000)

        //browser.execute(() => window.location.hash = '#step-4')
        browser.scroll(0, 0)
        browser.pause(1000)
        for (let i = 0; i < 3; i++) {
            browser.click('.sw-btn-next')
            browser.pause(2000)
        }

        const string = `NestoSkrozRandom${new Date().getTime()}`

        browser.setValue(inputSel, string)
        browser.pause(3000)

        browser.click('.createItem')
        browser.pause(5000)

        assert(exchangeExists(string), true)
        browser.pause(3000)
    })
    it('inline button doesn\'t exist if an external button is available', function() {
        browser.url('http://localhost:3000/addcoin')
        browser.pause(10000)

        //browser.execute(() => window.location.hash = '#step-4')
        browser.scroll(0, 0)
        browser.pause(1000)
        for (let i = 0; i < 3; i++) {
            browser.click('.sw-btn-next')
            browser.pause(2000)
        }

        const string = `JosJedanRandomString${new Date().getTime()}`
        browser.setValue(inputSel, '') // empty it out
        browser.pause(2000)

        browser.setValue(inputSel, string)
        browser.pause(3000)

        browser.click('div.tt-menu.tt-open')
        browser.pause(5000)

        assert(browser.isExisting('.createItem'), true)

        assert(!exchangeExists(string), true) // the exchange shouldn't be created
        browser.pause(3000)
    }) // note that the browser is on addcoin page right now
    it('search results update when new item is added externally', function() {
        const string = 'AaaandrejTest1'
        browser.execute((string) => Meteor.call('addExchange', string), string)
        browser.pause(5000)

        browser.url('http://localhost:3000/addcoin')
        browser.pause(10000)

        //browser.execute(() => window.location.hash = '#step-4')
        browser.scroll(0, 0)
        browser.pause(1000)
        for (let i = 0; i < 3; i++) {
            browser.click('.sw-btn-next')
            browser.pause(2000)
        }

        browser.setValue(inputSel, '')
        browser.pause(3000)

        browser.setValue(inputSel, string)
        browser.pause(3000)

        const child = listChild()
        let exchange = browser.execute((name) => testingExchanges.findOne({
            name: name
        }), child).value

        assert.equal(exchange.name, string)
        browser.pause(3000)
    }) // note that the browser is on addcoin page right now
    // it ('runs add function on click', function(){
    //   assert(true, true)
    // })
})
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

    function listChild() {
        browser.click(inputSel)
        var currency = browser.execute(() => {
            var handle = Meteor.subscribe('approvedcurrencies')
            var list = $('div.tt-menu.tt-open').children()
            var name
            //if list is empty then the list div doesn't have children
            if (list.children().length) {
                name = list.children()[0].innerHTML
            } else {
                return list[0].innerHTML // This is the actual problem that causes tests to fail. innerHTML is currencyName, while we use currencySymbol in the URL. Adding a data attribute with currencySymbol and using that value or something similar should do the trick
            }
            return Currencies.findOne({currencyName: name})
        }).value
        return currency
    }

    it('renders route comparedCurrencies with typeahead', function () {
        browser.url(`${baseUrl}/`) // navigate to the home route `/`
        browser.pause(2000) // let it load, wait for 2 seconds
        assert(browser.isExisting('.tt-input'), true) // check if at least one currency card has rendered, isExisting === $() !== undefined
        assert(browser.isVisible('.tt-input'), true) // check if at least one currency card is visible on the page isVisible === $().is(':visible')
    })
    it("follows 'focus' prop focusing on page enter", function () {
        assert(browser.hasFocus(inputSel), true)
    })
    it("follows 'quickEnter' prop, it triggers add action", function () {
        var child = listChild()
        browser.setValue(inputSel, "Enter")
        // console.log(FRparams().value.pop()) // returns currencySymbol
        // console.log(child) // returns currencyName
        assert(child.currencySymbol === FRparams().value.pop(), true)
        browser.click(".js-delete")
    })
    it("will autocomplete", function () {
        var child = listChild()
        browser.setValue(inputSel, "Tab")
        assert(child.currencySymbol === FRparams().value.pop(), true)
        browser.click(".js-delete")
    })
    it("will select", function () {
        var child = listChild()
        browser.click(childSel)
        assert(child.currencySymbol === FRparams().value.pop(), true)
        browser.click(".js-delete")
    })
    it("updates typeahead menu source on outside change, works as if input is constantly focused(therefore testing cursor change as well)", function () {
        var child = listChild()
        browser.click(childSel)
        assert(child._id != listChild()._id, true)
        child = listChild()
        browser.click(".js-delete")
        console.log(FRparams().value, listChild().currencyName, child.currencyName)
        assert(child._id == listChild()._id, true)
    })
    it("doesn't erase input on outside change", function () {
        listChild() //focus
        browser.click(childSel)
        browser.setValue(inputSel, "bit")
        browser.click(".js-delete")
        assert(browser.getValue(inputSel) == "bit", true)
    })
    it("can use nx framework (typeNX filename) for empty template", function () {
        assert(!!browser.execute(() => window.nx).value != false, true)
    })
    // it ("doesn't erase input on change of cursor observer", function(){ //no access to collections
    //   assert(true, true)r
    // })
    it("renders input text in empty template", function () {
        var string = "zzzzzzzzzzzzzzzzzzzzzz////"
        browser.setValue(inputSel, string)
        browser.pause(1000)
        var child = listChild()
        console.log("results", child)
        assert(child.indexOf(string)!= -1, true)
    })
    // it ('runs add function on click', function(){
    //   assert(true, true)
    // })
})
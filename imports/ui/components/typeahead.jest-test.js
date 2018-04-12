import renderBlaze from 'blaze-renderer'
import assert from 'assert'
// require('./typeahead')

const baseUrl = 'http://localhost:3000' // baseUrl of the app we are testing, it's localhost here, as we're starting a local server in Travis CI cycle

describe('test', function() {
	it ('passes', function() {
		assert(true, true)
	})
})

//see the full webdriverio browser API here: http://webdriver.io/api.html
// describe('Home page', function () {
//     it('Currencies should render properly', function () {
//         browser.url(`${baseUrl}/`) // navigate to the home route `/`
//         browser.pause(2000) // let it load, wait for 2 seconds
//         assert(browser.isExisting('.currency-card'), true) // check if at least one currency card has rendered, isExisting === $() !== undefined
//         assert(browser.isVisible('.currency-card'), true) // check if at least one currency card is visible on the page isVisible === $().is(':visible')
//     })
// // })

/* it('renders typeahead', () => {
    const typeahead = renderBlaze('typeaheadSnapshotTesting')
    expect(typeahead).toMatchSnapshot()
})

Template.typeaheadSnapshotTesting.onCreate(()=>{
	this.selectedId = new ReactiveVar()
})

Template.typeaheadSnapshotTesting.helpers({
	params(){
        return {
    	    limit: 15,
            query: function(templ, entry) {
                return {
               		$or: [{
                 		currencyName: new RegExp(entry, 'ig')
               		}, {
                 		currencySymbol: new RegExp(entry, 'ig')
               		}],
             	}
           },
           projection: function(templ, entry) {
             	return {
               		limit: 15,
               		sort: {
                 		currencyName: 1
              		}
             	}
           	},
           	add: function(event, doc, templ) {
           		templ.selectedId.set(doc.currencySymbol)
           	},
           	col: Currencies, //collection to use
           	template: Template.instance(), //parent template instance
           	focus: false,
           	autoFocus: false,
          	quickEnter: true,
           	displayField: 'currencyName', //field that appears in typeahead select menu
           	placeholder: 'Search cryptocurrencies'
        }
    }
})
*/
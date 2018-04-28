const assert = require('assert')

const baseUrl = 'http://localhost:3000' // baseUrl of the app we are testing, it's localhost here, as we're starting a local server in Travis CI cycle

// see the full webdriverio browser API here: http://webdriver.io/api.html
describe('Fast render\'s sub params match params in declared in templates by subsCache by each route (else it breaks #1196)', function () {
  it('should pass for all', function() {
  browser.timeouts('script', 5000)

  browser.url(`${baseUrl}/`)
  browser.pause(4000)

  let routeStrings = browser.execute(() => {
    return window.FlowRouter._routes.map(x => x.pathDef)
  })

  routeStrings.value.forEach(x => {
    console.log(`Testing route ${x}`)
      browser.url(`${baseUrl}/${x}`) // navigate to the home route `/`
      browser.pause(3000) // let it fully load, wait for 3 second

      // browser.execute is used to execute arbitary javascript code in the headless browser and get the result, it accepts a function (or a string) as the first param
      let subsCache = browser.execute(() => {
        let s = window.SubsCache.cache

        return Object.keys(s).map(i => ({
          args: s[i].args
        })) // getting the whole object is not necessary, so just map it out to fields we need
      }) // get all subs caches
      let subs = browser.execute(() => {
        let s = Meteor.default_connection._subscriptions

        return Object.keys(s).map(i => ({
          name: s[i].name,
          params: s[i].params
        })) // getting the whole object here is impossible as it's recursive, so we have to map out the fields we need
      }) // get all active subs
      let fr = browser.execute(() => {
        let s = FastRender._payload.subscriptions

        return Object.keys(s).map(i => ({
          name: i,
          params: eval(Object.keys(s[i])[0])
        })) // getting the whole object here is impossible as it's recursive, so we have to map out the fields we need (eval is evil, but it does the job here, as FastRender stores data in a weird form)
      }) // get all active fast renders

      // check all subsCaches, they all have to match (.value is the returned value from the headless browser)
      assert(subsCache.value.every(i => {
        i = i.args
        // find subscription by name
        let sub = subs.value.filter(j => j.name === i[0])
        // find fast render by name
        let f = fr.value.filter(j => j.name === i[0])

        // first try the fast render sub, if it's not available, fallback to the regular sub
        if (f.length > 0) {
          if (f[0].params.length === i.length - 1) { // check if the size matches, there's no need to continue if the size is not the same
            return f[0].params.every((k, ind) => {
              return k === i[ind + 1] // check if all of them are the same, the final step
            })
          }

          // return false if sizes don't match
          return false
        } else if (sub.length > 0) {
          if (sub[0].params.length === i.length - 1) { // check if the size matches, there's no need to continue if the size is not the same
            return sub[0].params.every((k, ind) => {
              return k === i[ind + 1] // check if all of them are the same, the final step
            })
          }

          // return false if sizes don't match
          return false
        }

        // else, we can fail the test, since something is definitely wrong
        return false
      }), true)
    })
  })
})
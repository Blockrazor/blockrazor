export const callWithPromise = function() { // we have to transform meteor.call methods to promises in order to work with Mocha
    let method = arguments[0]
    let params = Array.from(arguments)
    params.shift()

    return new Promise((resolve, reject) => {
        Meteor.apply(method, params, (err, res) => {
            if (err) reject(err)
            resolve(res)
        })
    })
} 
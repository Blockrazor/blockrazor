const validate = address => {
	address = address.split('@').pop()

    const disposable = require('disposable-email')
    const ourList = ['mvrht.net'] // disposable emails currently not on the list

    return !~ourList.indexOf(address) && disposable.validate(address)
}

export { validate }
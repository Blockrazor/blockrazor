import { Template } from 'meteor/templating'

import './userPendingBounty.html'

Template.userPendingBounty.helpers({
	title: () => {
		let templ = Template.instance().data

		if (templ.type && templ.type.includes('currency-')) { // currency-x
			let curName = templ.type.replace('currency-', '')
			curName = `${curName[0].toUpperCase()}${curName.substring(1)}`

			return `${TAPi18n.__('user.pending.hash_power')} ${curName}`
		}

		let title = templ.type && templ.type.replace('new-', '') // new-codebase, new-wallet, new-community, new-currency
		title = `${title[0].toUpperCase()}${title.substring(1)}`

		return `${title} ${TAPi18n.__('user.pending.bounty')}`
	},
	fixed: val => val && parseFloat(val).toFixed(2)
})
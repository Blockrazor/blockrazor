import { Meteor } from 'meteor/meteor'
import fs from 'fs'

const dirname = process.env.PWD

Meteor.methods({
	getLanguageScopes: (lang) => {
		return fs.readdirSync(`${dirname}/i18n`).filter(i => i.includes(`${lang}.i18n.json`)).map(i => i.replace(`.${lang}.i18n.json`, ''))
	},
	getLanguageData: (scope, lang) => {
		try {
			return JSON.parse(fs.readFileSync(`${dirname}/i18n/${scope}.${lang}.i18n.json`).toString('utf-8'))
		} catch(e) {
			throw new Meteor.Error('Error.', 'translations.data_doesn\'t_exist')
		}
	},
	saveLanguageData: (scope, lang, data) => {
		const unflatten = data => {
  			let result = {}
  			
  			for (let i in data) {
    			let keys = i.split('.')
    			
    			keys.reduce((r, e, j) => {
      				return r[e] || (r[e] = isNaN(Number(keys[j + 1])) ? (keys.length - 1 == j ? data[i] : {}) : [])
    			}, result)
  			}
  
  			return result
  		}

  		const deepMerge = (target, source) => {
  			for (let key in source) {
    			let original = target[key]
    			let next = source[key]

    			if (original && next && typeof next == 'object') {
      				deepMerge(original, next)
    			} else {
      				target[key] = next
    			}
  			}
  	
  			return target
		}

  		data = unflatten(data)

		let prevData = {}
		try {
			prevData = JSON.parse(fs.readFileSync(`${dirname}/i18n/${scope}.${lang}.i18n.json`).toString('utf-8'))
		} catch(e) {}

		let newData = deepMerge(prevData, data)

		fs.writeFileSync(`${dirname}/i18n/${scope}.${lang}.i18n.json`, JSON.stringify(newData), { flag: 'w' })
	}
})
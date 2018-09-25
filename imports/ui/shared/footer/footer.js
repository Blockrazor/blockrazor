import './footer.html'
import { Cookies } from 'meteor/ostrio:cookies'
const cookies = new Cookies()

Template.footer.onCreated(function () {
  this.defaultLanguage = 'en'
  TAPi18n.setLanguage(cookies.get('language') || 'en')
})

Template.footer.helpers({
  languages: () => {
    return Object.keys(TAPi18n.languages_names).map(key => {
      return {
        code: key,
        name: TAPi18n.languages_names[key][1],
        selected: key === TAPi18n.getLanguage()
      }
    })
  }
})

Template.footer.events({
  'change #selectLanguage' (event) {
    event.preventDefault()
    TAPi18n.setLanguage(event.target.value)
  }
})

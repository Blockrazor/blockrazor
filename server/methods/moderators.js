import { PendingCurrencies } from '../../lib/database/Currencies.js';
import { Currencies } from '../../lib/database/Currencies.js';
import { UserData } from '../serverdb/UserData.js';


Meteor.methods({
  approveCurrency: function(currencyId) {
    if(UserData.findOne({_id: Meteor.user()._id}).moderator) {
        console.log("approvecurrencymethod")
        var original = PendingCurrencies.findOne({_id: currencyId});
        if (original.owner == Meteor.user()._id) {
          throw new Meteor.Error("Approving your own currency is no fun!")
        }
        var insert = _.extend(original, {
          approvedBy: Meteor.user()._id,
          approvedTime: new Date().getTime()
        })
        Currencies.insert(insert, function(error, result) {
          if (!error) {
            PendingCurrencies.remove(currencyId)
          }
        });
    }

  },
})

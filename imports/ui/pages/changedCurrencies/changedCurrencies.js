import { Template } from 'meteor/templating';
import { Currencies, ChangedCurrencies } from '../../../../lib/database/Currencies.js'

import '../../../api/coins/methods.js';
import '../../layouts/MainBody.html'
import './changedCurrencies.html';

Template.changedCurrencies.onCreated(function bodyOnCreated() {
    var self = this
    self.autorun(function() {
        self.subscribe('changedCurrencies');
    })
});

Template.changedCurrencies.helpers({
    changedCurrencies() {

        return ChangedCurrencies.find({});

    },
    checkType(val) {
        if (val) {
            if (typeof val == "string") {
                return val;
            } else if (typeof val == "object") {
                return JSON.stringify(val);
            }
        } else {
            return 'NULL'
        }
    }

});
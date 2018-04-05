import { Meteor } from 'meteor/meteor'
import { UserData, Currencies, Communities, developmentValidationEnabledFalse } from '/imports/api/indexDB'
import SimpleSchema from 'simpl-schema'; //you must import SimpleSchema 


//Define a ValidatedMethod which can be called from both the client and server 
export const saveCommunity = new ValidatedMethod({
    name: 'saveCommunity',
    //Define the validation rules which will be applied on both the client and server
    validate:
        new SimpleSchema({
            currencyId: { type: String, max: 17, optional: false},
            url: {type: String, regEx:SimpleSchema.RegEx.Url, optional: false},
            image: {label:'Your Image',type: String, optional: false, regEx: /\.(gif|jpg|jpeg|tiff|png)$/
},
        }, { requiredByDefault: developmentValidationEnabledFalse }).validator(),
    run({ currencyId,url,image }) {
    	//Define the body of the ValidatedMethod, e.g. insert some data to a collection
        if (Meteor.userId()) {
            Meteor.call('parseCommunityUrl', url, (err, data) => {
                if (!err) {
                    if (!data || !data.error) {
                        data = data || {}
                        
                        Communities.insert({
                            'url': url,
                            'currencyId': currencyId,
                            'currencyName': Currencies.findOne({
                                _id: currencyId
                            }).currencyName,
                            'createdAt': new Date().getTime(),
                            'createdBy': Meteor.userId(),
                            'image': image,
                            'approved': false,
                            size: data.size || 0,
                            time: data.time || 0
                        })
                    } else {
                        throw new Meteor.Error('Error.', 'Invalid community url.')
                    }
                }
            })
        } else {
            throw new Meteor.Error('Error.', 'You have to be logged in.')
        }
    }
});


Meteor.methods({

    flagCommunityImage: function(imageId) {
        if(!this.userId){throw new Meteor.Error('error', 'please log in')};

        Communities.update(imageId, {
            $addToSet: {flaglikers: Meteor.userId()},
            $inc: {flags: 1}
        })

        Meteor.call('userStrike', Meteor.userId(), 'bad-wallet', 's3rv3r-only', (err, data) => {}) // user earns 1 strike here
    },

    approveCommunityImage: function(imageId) {
        if(!this.userId){throw new Meteor.Error('error', 'please log in')};
        if(Communities.findOne({_id: imageId}).createdBy == this.userId) {
            throw new Meteor.Error('error', "You can't approve your own item.")
        };

        Communities.update(imageId, {
            $set: {approved: true, approvedBy: this.userId},
            $inc: {likes: 1}
        });
    }

});

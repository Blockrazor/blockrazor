import { Mongo } from 'meteor/mongo';
export const FormData = new Mongo.Collection('formdata');

if (Meteor.isServer) {
if (FormData.find().count() === 0) {
  [{
        name: 'Proof of Work',
        subsecurity: [
          { name: 'SHA-256' },
          { name: 'Scrypt' },
          { name: 'X11' },
          { name: 'Quark' },
          { name: 'Groestl' },
          { name: 'Blake-256' },
          { name: 'NeoScrypt' },
          { name: 'Lyra2REv2' },
          { name: 'CryptoNight' },
          { name: 'EtHash' },
          { name: 'Equihash' },
          { name: 'Cuckoo16' },
          { name: 'Cuckoo30' },
        ],
      },
      {
        name: 'Proof of Stake',
      },
      {
        name: 'Hybrid',
        subsecurity: [
        { name: 'Staking and SHA-256' },
        { name: 'Staking and Scrypt' },
        { name: 'Staking and X11' },
        { name: 'Staking and Quark' },
        { name: 'Staking and Groestl' },
        { name: 'Staking and Blake-256' },
        { name: 'Staking and NeoScrypt' },
        { name: 'Staking and Lyra2REv2' },
        { name: 'Staking and CryptoNight' },
        { name: 'Staking and EtHash' },
        { name: 'Staking and Equihash' },
        { name: 'Staking and Cuckoo16' },
        { name: 'Staking and Cuckoo30' },
        ],
      },
      {
        name: 'Proof of Vitalik',
      },].forEach(doc => {FormData.insert(doc)})
};
Meteor.publish('formdata', function formdataPublication() {
return FormData.find();
});
}

if (Meteor.isServer) {
Meteor.methods({
  insertFormData(data) {
 FormData.insert(data, function(error, result){
 if (!result) {
 console.log(error);
 //return error;
 throw new Meteor.Error('Invalid', error);
 } else {
   //console.log(error);
   //console.log(result);
   return "OK";
 }
 });
  }
})
}

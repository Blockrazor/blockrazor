/*
The following global helpers can be used to access public directories each image 
type. This will avoid the need to define each global param in local helpers.
*/

Template.registerHelper('_walletUpoadDirectoryPublic', function() {
return _walletUpoadDirectoryPublic;
});

Template.registerHelper('_coinUpoadDirectoryPublic', function() {
return _coinUpoadDirectoryPublic;
});

Template.registerHelper('_hashPowerUploadDirectoryPublic', function() {
return _hashPowerUploadDirectoryPublic;
});

Template.registerHelper('_profilePictureUploadDirectoryPublic', function() {
 return _profilePictureUploadDirectoryPublic;
});

Template.registerHelper('_problemUploadDirectoryPublic', function() {
return _problemUploadDirectoryPublic;
});

Template.registerHelper('_communityUploadDirectoryPublic', function() {
return _communityUploadDirectoryPublic;
});
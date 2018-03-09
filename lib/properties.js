_walletUpoadDirectory = '/var/www/static/images/wallets/'; //wallet upload directory ///var/www/static/images/wallets/
_walletUpoadDirectoryPublic = '/static/images/wallets/'; //The public facing image directory. Can't use above for now unless a standard is in place.
_walletFileSizeLimit = 9999999999; //max wallet filesize in bytes
_supportedFileTypes = ['image/png', 'image/gif', 'image/jpeg'];

_coinUpoadDirectory = '/var/www/static/images/coin/';
_coinUpoadDirectoryPublic = '/static/images/coin/';
_coinFileSizeLimit = 2097152; //max wallet filesize in bytes

_hashPowerUploadDirectory = '/Users/hellofriend/Documents/upload/hashpower/'
_hashPowerUploadDirectoryPublic = '/static/images/hashpower/'
_hashPowerFileSizeLimit = 9999999999

_profilePictureUploadDirectory = '/var/www/static/images/profile/'
_profilePictureUploadDirectoryPublic = '/static/images/profile/'
_profilePictureFileSizeLimit = 9999999999

_watermarkLocation = '/Users/hellofriend/Documents/upload/watermark.png' //watermark image used in wallet watermarking.

_coinApprovalThreshold = 0;
_coinMergeDeleteThreshold = 3;

_globalDateFormat = 'DD/MM/YYYY'; //Global formatting of dates

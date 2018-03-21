//variable used to bypass validation logic if app is launched with "meteor" rather than "meteor --production" or --testing.
//feel free to adjust to true in all cases if testing validation
if (Meteor.isDevelopment){
  devValidationEnabled = false
} else {
  devValidationEnabled = true
}

export { devValidationEnabled }
import '/imports/api/users/client/users.js'
import '../both/index.js'

Meteor.startup(() => {
  //functions to call before logout such that userId is still availabe
  var hookedLogout = []
  Meteor.beforeLogout = (cb)=>{
    hookedLogout.push(cb)
  }
  
  Meteor.logout = ()=>{
    hookedLogout.forEach(x=>{
      x()
    })
    Meteor.logout()
  }
  console.log(Meteor.beforeLogout)
  })
  
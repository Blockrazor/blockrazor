Meteor.startup(() => {
  //functions to call before logout such that userId is still availabe
  //prevents duplicate function names in hook
  let hookedLogout = []

  Meteor.beforeLogout = cb => {
    if (hookedLogout.filter(x=>x.name==cb.name).length==0){
    hookedLogout.push(cb)
    }
  }
  
  const logout = Meteor.logout

  Meteor.logout = ()=>{
    window.isLoggingOut = true
    hookedLogout.forEach(x => {
      x()
    })
    logout()
  }

  Meteor.beforeLogout(() => {
    Meteor.call('end2faSession', (err, data) => {
      Meteor.setTimeout(() => window.isLoggingOut = false, 2000) // hacky solution that prevent the router from redirecting the user to /2fa while he/she's logging out
    })
  })
})
  
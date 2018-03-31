Meteor.startup(() => {
  //functions to call before logout such that userId is still availabe
  let hookedLogout = []

  Meteor.beforeLogout = cb => {
    hookedLogout.push(cb)
  }
  
  const logout = Meteor.logout

  Meteor.logout = ()=>{
    hookedLogout.forEach(x => {
      x()
    })
    
    logout()
  }
})
  
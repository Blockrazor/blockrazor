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
    hookedLogout.forEach(x => {
      x()
    })
    logout()
  }
})
  
const passport=require('passport')
const LocalStrategy=require('passport-local').Strategy
const Admin=require('../models/Admin')
const verify=Admin.authenticate()
passport.use(new LocalStrategy({usernameField:'username',passwordField:'password'},(username,password,done)=>{
 verify(username,password,(error,admin)=>{
  if(error)return done(error)
  if(!admin||!admin.isActive||admin.role!=='admin')return done(null,false)
  return done(null,admin)
 })
}))
passport.serializeUser((admin,done)=>done(null,admin.id))
passport.deserializeUser(async(id,done)=>{
 try{const admin=await Admin.findById(id).select('-hash -salt');if(!admin||!admin.isActive||admin.role!=='admin')return done(null,false);done(null,admin)}
 catch(error){done(error)}
})
module.exports=passport
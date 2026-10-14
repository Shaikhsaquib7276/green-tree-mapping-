const session=require('express-session')
const MongoStore=require('connect-mongo')
const mongoose=require('mongoose')
function createSessionMiddleware(){
  if(!process.env.SESSION_SECRET||process.env.SESSION_SECRET.length<32)throw new Error('SESSION_SECRET must be a unique random value of at least 32 characters.')
  return session({name:'greenmap.sid',secret:process.env.SESSION_SECRET,resave:false,saveUninitialized:false,rolling:true,
    store:MongoStore.create({client:mongoose.connection.getClient(),collectionName:'greenmap_sessions',ttl:28800,autoRemove:'native'}),
    cookie:{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',maxAge:8*60*60*1000}})
}
module.exports=createSessionMiddleware
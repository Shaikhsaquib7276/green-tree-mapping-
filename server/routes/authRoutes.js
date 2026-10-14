const express=require('express')
const passport=require('passport')
const {randomBytes}=require('node:crypto')
const rateLimit=require('express-rate-limit')
const Admin=require('../models/Admin')
const {recordAudit}=require('../services/auditService')
const router=express.Router()
const loginLimiter=rateLimit({windowMs:15*60*1000,limit:12,standardHeaders:true,legacyHeaders:false,message:{success:false,error:{code:'LOGIN_RATE_LIMIT',message:'Too many login attempts. Please try again later.'}}})
router.get('/csrf',(req,res)=>{if(!req.session.csrfToken)req.session.csrfToken=randomBytes(32).toString('hex');res.json({token:req.session.csrfToken})})
router.get('/me',(req,res)=>res.json({user:req.user?{id:req.user.id,username:req.user.username,displayName:req.user.displayName,role:req.user.role}:null}))
router.post('/login',loginLimiter,(req,res,next)=>{
 passport.authenticate('local',(error,admin)=>{
  if(error)return next(error)
  if(!admin)return res.status(401).json({success:false,error:{code:'LOGIN_FAILED',message:'The username or password is incorrect, or the account is disabled.'}})
  req.logIn(admin,async loginError=>{
   if(loginError)return next(loginError)
   try{
    admin.lastLoginAt=new Date();await admin.save()
    await recordAudit({actor:admin,action:'login',entityType:'Admin',entityId:admin.id})
    req.session.csrfToken=randomBytes(32).toString('hex')
    res.json({success:true,user:{id:admin.id,username:admin.username,displayName:admin.displayName,role:admin.role},csrfToken:req.session.csrfToken})
   }catch(saveError){next(saveError)}
  })
 })(req,res,next)
})
router.post('/logout',(req,res,next)=>{
 const user=req.user
 req.logout(async error=>{
  if(error)return next(error)
  await recordAudit({actor:user,action:'logout',entityType:'Admin',entityId:user?.id})
  req.session.destroy(err=>{
   if(err)return next(err)
   res.clearCookie('greenmap.sid',{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production'})
   res.json({success:true})
  })
 })
})
module.exports=router
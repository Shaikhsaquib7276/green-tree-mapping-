function requireAdmin(req,res,next){
 if(!req.user||req.user.role!=='admin'||!req.user.isActive)return res.status(401).json({success:false,error:{code:'ADMIN_AUTH_REQUIRED',message:'An active administrator session is required.'}})
 next()
}
module.exports=requireAdmin
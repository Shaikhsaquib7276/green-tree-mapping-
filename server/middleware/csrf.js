const {randomBytes,timingSafeEqual}=require('node:crypto')
function csrfToken(req,res){if(!req.session.csrfToken)req.session.csrfToken=randomBytes(32).toString('hex');res.json({token:req.session.csrfToken})}
function protectMutation(req,res,next){
 if(['GET','HEAD','OPTIONS'].includes(req.method))return next()
 const origin=req.get('origin')
 const allowed=[process.env.CLIENT_URL,`https://${req.get('host')}`,`http://${req.get('host')}`].filter(Boolean)
 if(origin&&!allowed.includes(origin))return res.status(403).json({success:false,error:{code:'INVALID_ORIGIN',message:'Request origin is not allowed.'}})
 const expected=req.session?.csrfToken
 const supplied=req.get('x-csrf-token')||''
 const a=Buffer.from(expected||'');const b=Buffer.from(supplied)
 if(!expected||a.length!==b.length||!timingSafeEqual(a,b))return res.status(403).json({success:false,error:{code:'CSRF_INVALID',message:'Security token expired. Retry your request.'}})
 next()
}
module.exports={csrfToken,protectMutation}
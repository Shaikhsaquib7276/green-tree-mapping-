const express=require('express')
const fs=require('node:fs')
const path=require('node:path')
const cors=require('cors')
const helmet=require('helmet')
const createSessionMiddleware=require('./config/session')
const passport=require('./config/passport')
const {protectMutation}=require('./middleware/csrf')
const authRoutes=require('./routes/authRoutes')
const treeRoutes=require('./routes/treeRoutes')
const zoneRoutes=require('./routes/zoneRoutes')
const greenSpaceRoutes=require('./routes/greenSpaceRoutes')
const galleryRoutes=require('./routes/galleryRoutes')
const surveyRoutes=require('./routes/surveyRoutes')
const statisticsRoutes=require('./routes/statisticsRoutes')
const adminRoutes=require('./routes/adminRoutes')
const requireAdmin=require('./middleware/requireAdmin')
const AuditLog=require('./models/AuditLog')
const app=express()
const clientDist=path.resolve(__dirname,'..','dist')
const clientIndex=path.join(clientDist,'index.html')
app.disable('x-powered-by')
app.set('trust proxy',1)
app.use(helmet({
  crossOriginResourcePolicy:{policy:'cross-origin'},
  contentSecurityPolicy:{
    directives:{
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      imgSrc:["'self'","data:","blob:","https://tile.openstreetmap.org","https://*.tile.openstreetmap.org","https://basemaps.cartocdn.com","https://*.basemaps.cartocdn.com","https://res.cloudinary.com"],
      connectSrc:["'self'","https://tile.openstreetmap.org","https://*.tile.openstreetmap.org","https://basemaps.cartocdn.com","https://*.basemaps.cartocdn.com"],
      styleSrc:["'self'","'unsafe-inline'","https://fonts.googleapis.com"],
      fontSrc:["'self'","data:","https://fonts.gstatic.com"]
    }
  }
}))
app.use(express.static(clientDist,{index:false,setHeaders(res,filePath){if(path.basename(filePath)==='index.html')res.setHeader('Cache-Control','no-cache')}}))
app.use(cors({origin:process.env.CLIENT_URL||'http://localhost:5173',credentials:true}))
app.use(express.json({limit:'1mb'}))
app.use(express.urlencoded({extended:false,limit:'1mb'}))
app.use(createSessionMiddleware())
app.use(passport.initialize())
app.use(passport.session())
app.use('/api/v1',protectMutation)
app.use('/api/v1/auth',authRoutes)
app.use('/api/v1/trees',treeRoutes)
app.use('/api/v1/zones',zoneRoutes)
app.use('/api/v1/green-spaces',greenSpaceRoutes)
app.use('/api/v1/gallery',galleryRoutes)
app.use('/api/v1/survey',surveyRoutes)
app.use('/api/v1/statistics',statisticsRoutes)
app.use('/api/v1/admin',adminRoutes)
app.get('/api/v1/admin/dashboard',requireAdmin,async(req,res,next)=>{try{const recent=await AuditLog.find().sort({createdAt:-1}).limit(10).lean();res.json({recent})}catch(e){next(e)}})
app.get('/',(_req,res)=>{if(fs.existsSync(clientIndex))return res.sendFile(clientIndex);return res.json({ok:true,name:'GreenMap API',message:'GreenMap backend is running.',health:'/api/health',apiBase:'/api/v1'})})
app.get('/api/health',(req,res)=>res.json({ok:true,service:'greenmap-api'}))
app.use('/api',(_req,res)=>res.status(404).json({success:false,error:{code:'API_NOT_FOUND',message:'API endpoint not found.'}}))
app.get(/.*/,(req,res)=>{if(fs.existsSync(clientIndex))return res.sendFile(clientIndex);return res.status(404).json({success:false,error:{code:'ROUTE_NOT_FOUND',message:'Route not found.'}})})
app.use((err,req,res,_next)=>{
 console.error('API request failed:',err.message)
 if(err.name==='ValidationError')return res.status(400).json({success:false,error:{code:'VALIDATION_ERROR',message:err.message}})
 if(err.code===11000)return res.status(409).json({success:false,error:{code:'DUPLICATE_RECORD',message:'A record with that unique identifier already exists.'}})
 if(err.name==='MulterError')return res.status(400).json({success:false,error:{code:'UPLOAD_ERROR',message:err.code==='LIMIT_FILE_SIZE'?'Image must be 5 MB or smaller.':err.message}})
 const status=Number(err.status)||500
 res.status(status).json({success:false,error:{code:status>=500?'SERVER_ERROR':'REQUEST_ERROR',message:status>=500?'The server could not complete this request. Check server logs and configuration.':err.message}})
})
module.exports=app
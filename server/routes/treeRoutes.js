const express=require('express')
const mongoose=require('mongoose')
const Joi=require('joi')
const Tree=require('../models/Tree')
const CampusZone=require('../models/CampusZone')
const requireAdmin=require('../middleware/requireAdmin')
const upload=require('../middleware/upload')
const {treeSchema}=require('../validators/treeValidator')
const {uploadBuffer,deleteAsset}=require('../services/cloudinaryService')
const {recordAudit}=require('../services/auditService')
const router=express.Router()
const asyncRoute=fn=>(req,res,next)=>Promise.resolve(fn(req,res,next)).catch(next)
const escapeRegex=s=>String(s).replace(/[.*+?^${}()|[\]\\]/g,'\\$&')
async function resolveZone(value){
 if(!value)return null
 let zone=null
 if(mongoose.isValidObjectId(value))zone=await CampusZone.findById(value)
 if(!zone)zone=await CampusZone.findOne({slug:String(value).toLowerCase()})
 if(!zone)throw Object.assign(new Error('Choose a valid campus zone.'),{status:400})
 return zone._id
}
async function populateQuery(query){return query.populate('zone','name slug').lean()}
router.get('/',asyncRoute(async(req,res)=>{
 const filter={}
 if(!req.user)filter.verificationStatus={$ne:'rejected'}
 if(req.query.condition)filter.condition=req.query.condition
 if(req.query.verificationStatus&&req.user)filter.verificationStatus=req.query.verificationStatus
 if(req.query.zone){const z=await CampusZone.findOne({$or:[{slug:String(req.query.zone).toLowerCase()},...(mongoose.isValidObjectId(req.query.zone)?[{_id:req.query.zone}]:[])]}).select('_id');if(!z)return res.json({items:[],total:0,page:1,limit:20});filter.zone=z._id}
 if(req.query.q){const q=new RegExp(escapeRegex(req.query.q).slice(0,80),'i');filter.$or=[{treeId:q},{commonName:q},{scientificName:q}]}
 if(req.query.hasLocation==='true')filter['location.coordinates.0']={$exists:true}
 const page=Math.max(1,Number.parseInt(req.query.page,10)||1),limit=Math.min(100,Math.max(1,Number.parseInt(req.query.limit,10)||24))
 const [items,total]=await Promise.all([populateQuery(Tree.find(filter).sort({treeId:1}).skip((page-1)*limit).limit(limit)),Tree.countDocuments(filter)])
 res.json({items,total,page,limit})
}))
router.get('/:id',asyncRoute(async(req,res)=>{
 const filter=mongoose.isValidObjectId(req.params.id)?{_id:req.params.id}:{treeId:String(req.params.id).toUpperCase()}
 if(!req.user)filter.verificationStatus={$ne:'rejected'}
 const tree=await Tree.findOne(filter).populate('zone','name slug').lean()
 if(!tree)return res.status(404).json({success:false,error:{code:'TREE_NOT_FOUND',message:'Tree record not found.'}})
 res.json({tree})
}))
router.post('/',requireAdmin,asyncRoute(async(req,res)=>{
 const {error,value}=treeSchema.validate(req.body,{abortEarly:false,convert:true})
 if(error)return res.status(400).json({success:false,error:{code:'VALIDATION_ERROR',message:error.details[0].message}})
 const zone=await resolveZone(value.zone)
 const hasCoordinates=value.latitude!==undefined&&value.longitude!==undefined
 const tree=await Tree.create({
  treeId:value.treeId,commonName:value.commonName,scientificName:value.scientificName,zone,condition:value.condition,notes:value.notes,
  location:hasCoordinates?{type:'Point',coordinates:[value.longitude,value.latitude]}:null,
  locationVerified:hasCoordinates && value.locationVerified === true,verificationStatus:'pending',createdBy:req.user._id,updatedBy:req.user._id,source:'Admin entry'
 })
 await recordAudit({actor:req.user,action:'create',entityType:'Tree',entityId:tree.id,details:{treeId:tree.treeId}})
 res.status(201).json({success:true,tree:await tree.populate('zone','name slug')})
}))
router.patch('/:id',requireAdmin,asyncRoute(async(req,res)=>{
 if(!mongoose.isValidObjectId(req.params.id))return res.status(400).json({success:false,error:{message:'Invalid tree record ID.'}})
 const {error,value}=treeSchema.validate(req.body,{abortEarly:false,convert:true})
 if(error)return res.status(400).json({success:false,error:{code:'VALIDATION_ERROR',message:error.details[0].message}})
 const tree=await Tree.findById(req.params.id)
 if(!tree)return res.status(404).json({success:false,error:{message:'Tree record not found.'}})
 const zone=await resolveZone(value.zone)
 Object.assign(tree,{treeId:value.treeId,commonName:value.commonName,scientificName:value.scientificName,zone,condition:value.condition,notes:value.notes,updatedBy:req.user._id})
 if(value.clearLocation)tree.location=null
 else if(value.latitude!==undefined&&value.longitude!==undefined)tree.location={type:'Point',coordinates:[value.longitude,value.latitude]}
 if(value.clearLocation)tree.locationVerified=false;else if(value.locationVerified!==undefined)tree.locationVerified=Boolean(value.locationVerified&&tree.location?.coordinates?.length===2)
 await tree.save()
 await recordAudit({actor:req.user,action:'update',entityType:'Tree',entityId:tree.id,details:{treeId:tree.treeId}})
 res.json({success:true,tree:await tree.populate('zone','name slug')})
}))
router.patch('/:id/verification',requireAdmin,asyncRoute(async(req,res)=>{
 const {error,value}=Joi.object({verificationStatus:Joi.string().valid('pending','verified','rejected').required()}).validate(req.body)
 if(error)return res.status(400).json({success:false,error:{message:'Invalid verification status.'}})
 const tree=await Tree.findById(req.params.id)
 if(!tree)return res.status(404).json({success:false,error:{message:'Tree record not found.'}})
 tree.verificationStatus=value.verificationStatus;tree.updatedBy=req.user._id
 await tree.save()
 await recordAudit({actor:req.user,action:'verification_change',entityType:'Tree',entityId:tree.id,details:{status:value.verificationStatus}})
 res.json({success:true,tree:await tree.populate('zone','name slug')})
}))
router.post('/:id/photos',requireAdmin,upload.single('image'),asyncRoute(async(req,res)=>{
 if(!req.file)return res.status(400).json({success:false,error:{message:'Choose an image file.'}})
 const tree=await Tree.findById(req.params.id)
 if(!tree)return res.status(404).json({success:false,error:{message:'Tree record not found.'}})
 const {error,value}=Joi.object({altText:Joi.string().trim().max(180).allow('').default('')}).validate(req.body)
 if(error)return res.status(400).json({success:false,error:{message:'Photo alt text must be 180 characters or fewer.'}})
 const image=await uploadBuffer(req.file.buffer,'greenmap/trees')
 tree.photos.push({url:image.url,publicId:image.publicId,altText:value.altText||tree.commonName})
 tree.updatedBy=req.user._id
 await tree.save()
 await recordAudit({actor:req.user,action:'photo_upload',entityType:'Tree',entityId:tree.id,details:{publicId:image.publicId}})
 res.status(201).json({success:true,tree:await tree.populate('zone','name slug')})
}))
router.delete('/:id/photos/:photoId',requireAdmin,asyncRoute(async(req,res)=>{
 const tree=await Tree.findById(req.params.id)
 if(!tree)return res.status(404).json({success:false,error:{message:'Tree record not found.'}})
 const photo=tree.photos.id(req.params.photoId)
 if(!photo)return res.status(404).json({success:false,error:{message:'Photo not found.'}})
 const publicId=photo.publicId;photo.deleteOne();await tree.save();await deleteAsset(publicId)
 await recordAudit({actor:req.user,action:'photo_delete',entityType:'Tree',entityId:tree.id})
 res.json({success:true,tree:await tree.populate('zone','name slug')})
}))
router.delete('/:id',requireAdmin,asyncRoute(async(req,res)=>{
 const tree=await Tree.findById(req.params.id)
 if(!tree)return res.status(404).json({success:false,error:{message:'Tree record not found.'}})
 for(const photo of tree.photos)await deleteAsset(photo.publicId).catch(e=>console.error('Cloudinary cleanup failed:',e.message))
 await tree.deleteOne()
 await recordAudit({actor:req.user,action:'delete',entityType:'Tree',entityId:tree.id,details:{treeId:tree.treeId}})
 res.json({success:true})
}))
module.exports=router
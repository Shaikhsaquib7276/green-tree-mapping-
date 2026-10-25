const express=require('express')
const mongoose=require('mongoose')
const Joi=require('joi')
const GreenSpace=require('../models/GreenSpace')
const CampusZone=require('../models/CampusZone')
const requireAdmin=require('../middleware/requireAdmin')
const upload=require('../middleware/upload')
const {uploadBuffer,deleteAsset}=require('../services/cloudinaryService')
const {recordAudit}=require('../services/auditService')
const router=express.Router()
const asyncRoute=fn=>(req,res,next)=>Promise.resolve(fn(req,res,next)).catch(next)
async function resolveZone(value){if(!value)return null;let zone=null;if(mongoose.isValidObjectId(value))zone=await CampusZone.findById(value);if(!zone)zone=await CampusZone.findOne({slug:String(value).toLowerCase()});if(!zone)throw Object.assign(new Error('Choose a valid campus zone.'),{status:400});return zone._id}
const schema=Joi.object({
 name:Joi.string().trim().min(2).max(140).required(),
 description:Joi.string().trim().max(2000).allow('').default(''),
 zone:Joi.string().allow('',null).default(null),
 status:Joi.string().valid('draft','published').default('published'),
 latitude:Joi.number().min(-90).max(90).empty('').allow(null),
 longitude:Joi.number().min(-180).max(180).empty('').allow(null),
 locationVerified:Joi.boolean().default(false)
}).custom((v,h)=>{
 const lat=v.latitude!==undefined&&v.latitude!==null, lng=v.longitude!==undefined&&v.longitude!==null
 if(lat!==lng)return h.error('any.custom',{message:'Enter both latitude and longitude, or leave both blank.'})
 return v
}).unknown(false)
function locationFrom(value){return value.latitude!==undefined&&value.latitude!==null&&value.longitude!==undefined&&value.longitude!==null?{type:'Point',coordinates:[value.longitude,value.latitude]}:null}
router.get('/',asyncRoute(async(req,res)=>{const filter=req.user?{}:{status:'published'};const items=await GreenSpace.find(filter).populate('zone','name slug').sort({createdAt:-1}).lean();res.json({items})}))
router.get('/:id',asyncRoute(async(req,res)=>{const filter={_id:req.params.id};if(!req.user)filter.status='published';const item=await GreenSpace.findOne(filter).populate('zone','name slug').lean();if(!item)return res.status(404).json({success:false,error:{message:'Green space not found.'}});res.json({item})}))
router.post('/',requireAdmin,asyncRoute(async(req,res)=>{
 const {error,value}=schema.validate(req.body);if(error)return res.status(400).json({success:false,error:{message:error.details[0].message}})
 const location=locationFrom(value)
 const item=await GreenSpace.create({...value,zone:await resolveZone(value.zone),location,locationVerified:Boolean(location&&value.locationVerified),createdBy:req.user._id,updatedBy:req.user._id})
 await recordAudit({actor:req.user,action:'create',entityType:'GreenSpace',entityId:item.id})
 res.status(201).json({success:true,item:await item.populate('zone','name slug')})
}))
router.patch('/:id',requireAdmin,asyncRoute(async(req,res)=>{
 const {error,value}=schema.validate(req.body);if(error)return res.status(400).json({success:false,error:{message:error.details[0].message}})
 const item=await GreenSpace.findById(req.params.id);if(!item)return res.status(404).json({success:false,error:{message:'Green space not found.'}})
 const location=locationFrom(value)
 Object.assign(item,{name:value.name,description:value.description,zone:await resolveZone(value.zone),status:value.status,location,locationVerified:Boolean(location&&value.locationVerified),updatedBy:req.user._id})
 await item.save()
 await recordAudit({actor:req.user,action:'update',entityType:'GreenSpace',entityId:item.id})
 res.json({success:true,item:await item.populate('zone','name slug')})
}))
router.post('/:id/photos',requireAdmin,upload.single('image'),asyncRoute(async(req,res)=>{
 if(!req.file)return res.status(400).json({success:false,error:{message:'Choose an image file.'}})
 const item=await GreenSpace.findById(req.params.id);if(!item)return res.status(404).json({success:false,error:{message:'Green space not found.'}})
 const {error,value}=Joi.object({altText:Joi.string().trim().max(180).allow('').default('')}).validate(req.body)
 if(error)return res.status(400).json({success:false,error:{message:'Photo alt text must be 180 characters or fewer.'}})
 const image=await uploadBuffer(req.file.buffer,'greenmap/spaces');item.photos.push({url:image.url,publicId:image.publicId,altText:value.altText||item.name});item.updatedBy=req.user._id;await item.save()
 await recordAudit({actor:req.user,action:'photo_upload',entityType:'GreenSpace',entityId:item.id})
 res.status(201).json({success:true,item:await item.populate('zone','name slug')})
}))
router.delete('/:id',requireAdmin,asyncRoute(async(req,res)=>{
 const item=await GreenSpace.findById(req.params.id);if(!item)return res.status(404).json({success:false,error:{message:'Green space not found.'}})
 for(const photo of item.photos)await deleteAsset(photo.publicId).catch(e=>console.error('Cloudinary cleanup failed:',e.message))
 await item.deleteOne();await recordAudit({actor:req.user,action:'delete',entityType:'GreenSpace',entityId:item.id});res.json({success:true})
}))
module.exports=router
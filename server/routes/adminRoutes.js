const express=require('express')
const mongoose=require('mongoose')
const Joi=require('joi')
const AuditLog=require('../models/AuditLog')
const SurveyResponse=require('../models/SurveyResponse')
const Tree=require('../models/Tree')
const CampusZone=require('../models/CampusZone')
const GreenSpace=require('../models/GreenSpace')
const GalleryImage=require('../models/GalleryImage')
const SurveySummary=require('../models/SurveySummary')
const {deleteAsset}=require('../services/cloudinaryService')
const requireAdmin=require('../middleware/requireAdmin')
const {recordAudit}=require('../services/auditService')
const router=express.Router()
const asyncRoute=fn=>(req,res,next)=>Promise.resolve(fn(req,res,next)).catch(next)
router.use(requireAdmin)
router.put('/survey-summary',asyncRoute(async(req,res)=>{
 const count=Joi.number().integer().min(0).max(100000).required()
 const {error,value}=Joi.object({
  surveyDate:Joi.date().required(),
  totalTrees:count,
  zoneCounts:Joi.array().items(Joi.object({name:Joi.string().trim().min(1).max(100).required(),count:Joi.number().integer().min(0).max(100000).required()})).required(),
  conditionCounts:Joi.object({healthy:count,needsAttention:count,uncertain:count}).required(),
  speciesCounts:Joi.array().items(Joi.object({name:Joi.string().trim().min(1).max(120).required(),count:Joi.number().integer().min(0).max(100000).required()})).required(),
  verificationStatus:Joi.string().valid('verified','provisional').default('provisional'),
  sourceNotes:Joi.string().trim().max(2000).allow('').default('')
 }).validate(req.body,{abortEarly:false,convert:true})
 if(error)return res.status(400).json({success:false,error:{message:error.details[0].message}})
 const summary=await SurveySummary.findOneAndUpdate(
  {projectKey:'theem-campus-2026'},
  {$set:{...value,projectKey:'theem-campus-2026'}},
  {upsert:true,new:true,runValidators:true,setDefaultsOnInsert:true}
 )
 await recordAudit({actor:req.user,action:'upsert',entityType:'SurveySummary',entityId:summary.id,details:{totalTrees:summary.totalTrees}})
 res.json({success:true,summary})
}))
router.post('/reset-content',asyncRoute(async(req,res)=>{
 const {error}=Joi.object({confirmation:Joi.string().valid('CLEAR GREENMAP CONTENT').required()}).validate(req.body)
 if(error)return res.status(400).json({success:false,error:{message:'Type CLEAR GREENMAP CONTENT to confirm the reset.'}})
 const [trees,spaces,gallery]=await Promise.all([
  Tree.find().select('photos.publicId').lean(),
  GreenSpace.find().select('photos.publicId').lean(),
  GalleryImage.find().select('cloudinaryPublicId').lean()
 ])
 const assets=[
  ...trees.flatMap(item=>(item.photos||[]).map(photo=>photo.publicId).filter(Boolean)),
  ...spaces.flatMap(item=>(item.photos||[]).map(photo=>photo.publicId).filter(Boolean)),
  ...gallery.map(item=>item.cloudinaryPublicId).filter(Boolean)
 ]
 const assetResults=await Promise.allSettled(assets.map(publicId=>deleteAsset(publicId)))
 const [treeResult,spaceResult,galleryResult,zoneResult,responseResult,summaryResult]=await Promise.all([
  Tree.deleteMany({}),
  GreenSpace.deleteMany({}),
  GalleryImage.deleteMany({}),
  CampusZone.deleteMany({}),
  SurveyResponse.deleteMany({}),
  SurveySummary.deleteMany({})
 ])
 const deleted={
  trees:treeResult.deletedCount||0,
  greenSpaces:spaceResult.deletedCount||0,
  galleryImages:galleryResult.deletedCount||0,
  campusZones:zoneResult.deletedCount||0,
  surveyResponses:responseResult.deletedCount||0,
  surveySummaries:summaryResult.deletedCount||0
 }
 const cloudinaryDeleteFailures=assetResults.filter(result=>result.status==='rejected').length
 await recordAudit({actor:req.user,action:'reset_content',entityType:'GreenMapContent',entityId:'all',details:{deleted,cloudinaryAssets:assets.length,cloudinaryDeleteFailures}})
 res.json({success:true,deleted,cloudinaryAssetsAttempted:assets.length,cloudinaryDeleteFailures,message:'Content reset complete. Administrator accounts, sessions and audit history were preserved.'})
}))
router.get('/survey-responses',asyncRoute(async(req,res)=>{const page=Math.max(1,Number.parseInt(req.query.page,10)||1);const limit=Math.min(100,Math.max(1,Number.parseInt(req.query.limit,10)||50));const [items,total]=await Promise.all([SurveyResponse.find().sort({createdAt:-1}).skip((page-1)*limit).limit(limit).lean(),SurveyResponse.countDocuments()]);res.json({items,total,page,limit})}))
router.patch('/survey-responses/:id',asyncRoute(async(req,res)=>{if(!mongoose.isValidObjectId(req.params.id))return res.status(400).json({success:false,error:{message:'Invalid survey response ID.'}});const {error,value}=Joi.object({status:Joi.string().valid('new','reviewed').required()}).validate(req.body);if(error)return res.status(400).json({success:false,error:{message:'Status must be new or reviewed.'}});const item=await SurveyResponse.findByIdAndUpdate(req.params.id,{status:value.status},{new:true,runValidators:true});if(!item)return res.status(404).json({success:false,error:{message:'Survey response not found.'}});await recordAudit({actor:req.user,action:'update',entityType:'SurveyResponse',entityId:item.id,details:{status:item.status}});res.json({success:true,item})}))
router.delete('/survey-responses/:id',asyncRoute(async(req,res)=>{if(!mongoose.isValidObjectId(req.params.id))return res.status(400).json({success:false,error:{message:'Invalid survey response ID.'}});const item=await SurveyResponse.findById(req.params.id);if(!item)return res.status(404).json({success:false,error:{message:'Survey response not found.'}});await item.deleteOne();await recordAudit({actor:req.user,action:'delete',entityType:'SurveyResponse',entityId:item.id});res.json({success:true})}))
router.get('/audit-logs',asyncRoute(async(req,res)=>{const limit=Math.min(100,Math.max(1,Number.parseInt(req.query.limit,10)||50));res.json({items:await AuditLog.find().populate('actor','username displayName').sort({createdAt:-1}).limit(limit).lean()})}))
module.exports=router
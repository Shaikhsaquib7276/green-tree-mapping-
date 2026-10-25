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
const {recordAudit}=require('../services/auditService')
const requireAdmin=require('../middleware/requireAdmin')
const {recordAudit}=require('../services/auditService')
const router=express.Router()
const asyncRoute=fn=>(req,res,next)=>Promise.resolve(fn(req,res,next)).catch(next)
router.use(requireAdmin)
router.post('/import-cep-trees',asyncRoute(async(req,res)=>{
 const zones=[
  {name:'Main Ground',slug:'main-ground',sortOrder:1,description:'CEP survey zone; individual tree coordinates were not supplied.'},
  {name:'Volleyball Ground',slug:'volleyball-ground',sortOrder:2,description:'CEP survey zone; individual tree coordinates were not supplied.'},
  {name:'Parking',slug:'parking',sortOrder:3,description:'CEP survey zone; individual tree coordinates were not supplied.'},
  {name:'Flower Garden',slug:'flower-garden',sortOrder:4,description:'CEP survey zone; no trees were recorded in the 20 September 2026 survey.'}
 ]
 const zoneBySlug={}
 let createdZones=0
 for(const zone of zones){
  const result=await CampusZone.updateOne({slug:zone.slug},{$setOnInsert:{...zone,isActive:true}},{upsert:true})
  createdZones+=result.upsertedCount||0
  zoneBySlug[zone.slug]=await CampusZone.findOne({slug:zone.slug})
 }
 const rows=[
  ...Array.from({length:5},(_,i)=>({treeId:'T-'+String(i+1).padStart(3,'0'),commonName:'Gulmohar',zoneSlug:'main-ground'})),
  {treeId:'T-006',commonName:'Sitaphal',zoneSlug:'main-ground'},
  {treeId:'T-007',commonName:'Black Jamun',zoneSlug:'main-ground'},
  {treeId:'T-008',commonName:'White Jamun',zoneSlug:'main-ground'},
  {treeId:'T-009',commonName:'Other / not identified',zoneSlug:'main-ground'},
  {treeId:'T-010',commonName:'Other / not identified',zoneSlug:'main-ground'},
  {treeId:'T-011',commonName:'Neem',zoneSlug:'volleyball-ground'},
  {treeId:'T-012',commonName:'Neem',zoneSlug:'volleyball-ground'},
  {treeId:'T-013',commonName:'Gulmohar',zoneSlug:'volleyball-ground'},
  {treeId:'T-014',commonName:'Gulmohar',zoneSlug:'volleyball-ground'},
  {treeId:'T-015',commonName:'Ashoka',zoneSlug:'volleyball-ground'},
  {treeId:'T-016',commonName:'Bore (Ber)',zoneSlug:'volleyball-ground'},
  {treeId:'T-017',commonName:'Bore (Ber)',zoneSlug:'volleyball-ground'},
  {treeId:'T-018',commonName:'Sitaphal',zoneSlug:'volleyball-ground'},
  {treeId:'T-019',commonName:'Sitaphal',zoneSlug:'volleyball-ground'},
  {treeId:'T-020',commonName:'Amrud (Guava)',zoneSlug:'volleyball-ground'},
  {treeId:'T-021',commonName:'Jamun',zoneSlug:'volleyball-ground'},
  {treeId:'T-022',commonName:'Khajur',zoneSlug:'volleyball-ground'},
  {treeId:'T-023',commonName:'Khajur',zoneSlug:'volleyball-ground'},
  {treeId:'T-024',commonName:'Black Jamun',zoneSlug:'volleyball-ground'},
  {treeId:'T-025',commonName:'Black Jamun',zoneSlug:'volleyball-ground'},
  {treeId:'T-026',commonName:'White Jamun',zoneSlug:'volleyball-ground'},
  {treeId:'T-027',commonName:'Badam',zoneSlug:'volleyball-ground'},
  {treeId:'T-028',commonName:'Badam',zoneSlug:'volleyball-ground'},
  {treeId:'T-029',commonName:'Other / not identified',zoneSlug:'volleyball-ground'},
  {treeId:'T-030',commonName:'Other / not identified',zoneSlug:'volleyball-ground'},
  {treeId:'T-031',commonName:'Other / not identified',zoneSlug:'volleyball-ground'},
  {treeId:'T-032',commonName:'Gulmohar',zoneSlug:'parking'},
  {treeId:'T-033',commonName:'Gulmohar',zoneSlug:'parking'},
  {treeId:'T-034',commonName:'Jamun',zoneSlug:'parking'},
  {treeId:'T-035',commonName:'Khajur',zoneSlug:'parking'},
  {treeId:'T-036',commonName:'Black Jamun',zoneSlug:'parking'},
  {treeId:'T-037',commonName:'Other / not identified',zoneSlug:'parking'},
  {treeId:'T-038',commonName:'Other / not identified',zoneSlug:'parking'}
 ]
 const summaryData={
  projectKey:'theem-campus-2026',
  surveyDate:new Date('2026-09-20T00:00:00.000Z'),
  totalTrees:38,
  zoneCounts:[{name:'Main Ground',count:10},{name:'Volleyball Ground',count:21},{name:'Parking',count:7},{name:'Flower Garden',count:0}],
  conditionCounts:{healthy:25,needsAttention:10,uncertain:3},
  speciesCounts:[{name:'Neem',count:2},{name:'Gulmohar',count:9},{name:'Ashoka',count:1},{name:'Bore (Ber)',count:2},{name:'Sitaphal',count:3},{name:'Amrud (Guava)',count:1},{name:'Jamun',count:2},{name:'Khajur',count:3},{name:'Black Jamun',count:4},{name:'White Jamun',count:2},{name:'Badam',count:2},{name:'Other / not identified',count:7}],
  verificationStatus:'verified',
  sourceNotes:'Aggregate counts taken from the GreenMap CEP report for 20 September 2026. Individual T-001 to T-038 rows are reconstructed from aggregate species/zone counts; IDs are report identifiers, not verified physical tree tags. Per-tree GPS, observed condition and photo references were not supplied.'
 }
 const summaryResult=await SurveySummary.updateOne({projectKey:summaryData.projectKey},{$setOnInsert:summaryData},{upsert:true})
 let createdTrees=0,existingTrees=0
 for(const row of rows){
  const zone=zoneBySlug[row.zoneSlug]
  if(!zone)throw new Error('Could not resolve campus zone: '+row.zoneSlug)
  const treeData={
   treeId:row.treeId,commonName:row.commonName,scientificName:'',scientificNameVerified:false,zone:zone._id,
   condition:'uncertain',location:null,locationVerified:false,photos:[],
   notes:'Reconstructed from CEP zone/species counts. Individual condition, precise GPS coordinates and a photo-to-tree link were not recorded in the supplied report. Verify this row against the original field sheet.',
   verificationStatus:'pending',source:'CEP reconstructed inventory',recordedAt:new Date('2026-09-20T00:00:00.000Z')
  }
  const result=await Tree.updateOne({treeId:row.treeId},{$setOnInsert:treeData},{upsert:true,runValidators:true})
  if(result.upsertedCount)createdTrees++;else existingTrees++
 }
 await recordAudit({actor:req.user,action:'cep_import',entityType:'Tree',entityId:'CEP-2026',details:{rows:rows.length,createdTrees,existingTrees,createdZones,createdSummary:Boolean(summaryResult.upsertedCount)}})
 res.json({
  success:true,
  surveyRowsInReport:rows.length,
  createdTrees,
  existingTreesPreserved:existingTrees,
  createdZones,
  createdSurveySummary:Boolean(summaryResult.upsertedCount),
  message:'CEP data import finished. Reconstructed entries are visible as pending; exact per-tree GPS, individual conditions and photo associations remain unverified.'
 })
}))
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
const express=require('express')
const Tree=require('../models/Tree')
const SurveySummary=require('../models/SurveySummary')
const router=express.Router()
const asyncRoute=fn=>(req,res,next)=>Promise.resolve(fn(req,res,next)).catch(next)
router.get('/overview',asyncRoute(async(req,res)=>{
 const [summary,storedTreeCount,verifiedTreeCount,mappedTreeCount]=await Promise.all([
  SurveySummary.findOne({projectKey:'theem-campus-2026'}).lean(),
  Tree.countDocuments(),Tree.countDocuments({verificationStatus:'verified'}),
  Tree.countDocuments({verificationStatus:'verified',locationVerified:true,'location.coordinates.0':{$exists:true},'location.coordinates.1':{$exists:true}})
 ])
 res.json({summary:summary?{...summary,counts:{storedTreeCount,verifiedTreeCount,mappedTreeCount}}:null,counts:{storedTreeCount,verifiedTreeCount,mappedTreeCount}})
}))
router.get('/by-zone',asyncRoute(async(req,res)=>{
 const summary=await SurveySummary.findOne({projectKey:'theem-campus-2026'}).lean()
 const records=await Tree.aggregate([{$match:{verificationStatus:'verified'}},{$group:{_id:'$zone',count:{$sum:1}}}])
 res.json({surveySummary:summary?.zoneCounts||[],individualRecords:records})
}))
router.get('/by-condition',asyncRoute(async(req,res)=>{
 const summary=await SurveySummary.findOne({projectKey:'theem-campus-2026'}).lean()
 const records=await Tree.aggregate([{$match:{verificationStatus:'verified'}},{$group:{_id:'$condition',count:{$sum:1}}}])
 res.json({surveySummary:summary?.conditionCounts||null,individualRecords:records})
}))
router.get('/by-species',asyncRoute(async(req,res)=>{
 const summary=await SurveySummary.findOne({projectKey:'theem-campus-2026'}).lean()
 const records=await Tree.aggregate([{$match:{verificationStatus:'verified'}},{$group:{_id:'$commonName',count:{$sum:1}}},{$sort:{count:-1}}])
 res.json({surveySummary:summary?.speciesCounts||[],individualRecords:records})
}))
module.exports=router
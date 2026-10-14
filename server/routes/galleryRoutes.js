const express=require('express')
const Joi=require('joi')
const GalleryImage=require('../models/GalleryImage')
const requireAdmin=require('../middleware/requireAdmin')
const upload=require('../middleware/upload')
const {uploadBuffer,deleteAsset}=require('../services/cloudinaryService')
const {recordAudit}=require('../services/auditService')
const router=express.Router()
const asyncRoute=fn=>(req,res,next)=>Promise.resolve(fn(req,res,next)).catch(next)
router.get('/',asyncRoute(async(req,res)=>{
 const filter=req.user?{}:{isPublished:true}
 if(req.query.category)filter.category=req.query.category
 const items=await GalleryImage.find(filter).sort({createdAt:-1}).lean()
 res.json({items})
}))
router.post('/',requireAdmin,upload.single('image'),asyncRoute(async(req,res)=>{
 if(!req.file)return res.status(400).json({success:false,error:{message:'Choose an image file.'}})
 const {error,value}=Joi.object({title:Joi.string().trim().min(1).max(160).required(),description:Joi.string().max(1500).allow('').default(''),category:Joi.string().valid('field-visit','tree','green-space','community').default('field-visit'),altText:Joi.string().max(180).allow('').default('')}).validate(req.body)
 if(error)return res.status(400).json({success:false,error:{message:error.details[0].message}})
 const image=await uploadBuffer(req.file.buffer,'greenmap/gallery')
 const item=await GalleryImage.create({title:value.title,description:value.description,category:value.category,altText:value.altText||value.title,imageUrl:image.url,cloudinaryPublicId:image.publicId,uploadedBy:req.user._id,isPublished:true})
 await recordAudit({actor:req.user,action:'create',entityType:'GalleryImage',entityId:item.id})
 res.status(201).json({success:true,item})
}))
router.patch('/:id',requireAdmin,asyncRoute(async(req,res)=>{
 const {error,value}=Joi.object({title:Joi.string().trim().min(1).max(160),description:Joi.string().max(1500).allow(''),category:Joi.string().valid('field-visit','tree','green-space','community'),altText:Joi.string().max(180).allow(''),isPublished:Joi.boolean()}).min(1).unknown(false).validate(req.body)
 if(error)return res.status(400).json({success:false,error:{message:error.details[0].message}})
 const item=await GalleryImage.findByIdAndUpdate(req.params.id,value,{new:true,runValidators:true})
 if(!item)return res.status(404).json({success:false,error:{message:'Gallery image not found.'}})
 await recordAudit({actor:req.user,action:'update',entityType:'GalleryImage',entityId:item.id});res.json({success:true,item})
}))
router.delete('/:id',requireAdmin,asyncRoute(async(req,res)=>{
 const item=await GalleryImage.findById(req.params.id);if(!item)return res.status(404).json({success:false,error:{message:'Gallery image not found.'}})
 await deleteAsset(item.cloudinaryPublicId);await item.deleteOne();await recordAudit({actor:req.user,action:'delete',entityType:'GalleryImage',entityId:item.id});res.json({success:true})
}))
module.exports=router
const Joi=require('joi')
const treeSchema=Joi.object({
 treeId:Joi.string().trim().min(1).max(50).required(),commonName:Joi.string().trim().min(1).max(120).required(),
 scientificName:Joi.string().trim().max(180).allow('').default(''),zone:Joi.string().allow('',null).default(null),
 condition:Joi.string().valid('healthy','needs_attention','uncertain').default('uncertain'),
 notes:Joi.string().trim().max(3000).allow('').default(''),latitude:Joi.number().min(-90).max(90).allow(null),
 longitude:Joi.number().min(-180).max(180).allow(null),clearLocation:Joi.boolean().default(false),
 locationVerified:Joi.boolean().default(false)
}).custom((v,h)=>{const lat=v.latitude!==undefined&&v.latitude!==null;const lng=v.longitude!==undefined&&v.longitude!==null;if(lat!==lng)return h.error('any.custom',{message:'Enter both latitude and longitude, or leave both blank.'});return v}).unknown(false)
module.exports={treeSchema}
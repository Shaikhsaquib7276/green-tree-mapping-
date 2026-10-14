const Joi=require('joi')
const surveyResponseSchema=Joi.object({
 ageGroup:Joi.string().valid('Under 18','18–22','23–30','Above 30','Prefer not to say').required(),
 zone:Joi.string().valid('Main Ground','Volleyball Ground','Parking','Flower Garden').required(),
 awareness:Joi.string().valid('Very aware','Somewhat','Not much').required(),
 greenSpaceImportance:Joi.string().valid('Very important','Important','Not sure').required(),
 treeCareAwareness:Joi.string().max(100).allow('',null).default(''),
 participationInterest:Joi.string().valid('Yes','Maybe','No').required(),
 suggestions:Joi.string().max(1200).allow('').default('')
}).unknown(false)
module.exports={surveyResponseSchema}
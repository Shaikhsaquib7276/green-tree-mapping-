const mongoose=require('mongoose')
const SurveyResponseSchema=new mongoose.Schema({
 ageGroup:{type:String,trim:true,maxlength:40,required:true},zone:{type:String,trim:true,maxlength:100,required:true},
 awareness:{type:String,trim:true,maxlength:60,required:true},greenSpaceImportance:{type:String,trim:true,maxlength:60,required:true},
 treeCareAwareness:{type:String,trim:true,maxlength:100,default:''},participationInterest:{type:String,trim:true,maxlength:60,required:true},
 suggestions:{type:String,trim:true,maxlength:1200,default:''},status:{type:String,enum:['new','reviewed'],default:'new'}
},{timestamps:true})
SurveyResponseSchema.index({createdAt:-1})
module.exports=mongoose.models.SurveyResponse||mongoose.model('SurveyResponse',SurveyResponseSchema)
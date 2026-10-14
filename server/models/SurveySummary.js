const mongoose=require('mongoose')
const CountSchema=new mongoose.Schema({name:{type:String,required:true},count:{type:Number,required:true,min:0}},{_id:false})
const SurveySummarySchema=new mongoose.Schema({
 projectKey:{type:String,required:true,unique:true,index:true},surveyDate:{type:Date,required:true},totalTrees:{type:Number,required:true,min:0},
 zoneCounts:{type:[CountSchema],default:[]},conditionCounts:{healthy:{type:Number,default:0,min:0},needsAttention:{type:Number,default:0,min:0},uncertain:{type:Number,default:0,min:0}},
 speciesCounts:{type:[CountSchema],default:[]},verificationStatus:{type:String,enum:['verified','provisional'],default:'verified'},sourceNotes:{type:String,default:''}
},{timestamps:true})
module.exports=mongoose.models.SurveySummary||mongoose.model('SurveySummary',SurveySummarySchema)
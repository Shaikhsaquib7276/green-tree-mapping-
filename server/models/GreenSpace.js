const mongoose=require('mongoose')
const GreenSpaceSchema=new mongoose.Schema({
 name:{type:String,required:true,trim:true,maxlength:140},description:{type:String,trim:true,maxlength:2000,default:''},
 zone:{type:mongoose.Schema.Types.ObjectId,ref:'CampusZone',default:null},
 location:{type:{type:String,enum:['Point']},coordinates:{type:[Number]},default:null},locationVerified:{type:Boolean,default:false},
 photos:[{url:{type:String,required:true},publicId:{type:String,required:true},altText:{type:String,default:''}}],
 status:{type:String,enum:['draft','published'],default:'published'},
 createdBy:{type:mongoose.Schema.Types.ObjectId,ref:'Admin',default:null},updatedBy:{type:mongoose.Schema.Types.ObjectId,ref:'Admin',default:null}
},{timestamps:true})
module.exports=mongoose.models.GreenSpace||mongoose.model('GreenSpace',GreenSpaceSchema)
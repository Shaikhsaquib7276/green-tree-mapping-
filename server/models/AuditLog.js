const mongoose=require('mongoose')
const AuditLogSchema=new mongoose.Schema({
 actor:{type:mongoose.Schema.Types.ObjectId,ref:'Admin',default:null},
 action:{type:String,required:true,maxlength:100},entityType:{type:String,required:true,maxlength:100},
 entityId:{type:String,default:''},details:{type:mongoose.Schema.Types.Mixed,default:{}}
},{timestamps:{createdAt:true,updatedAt:false}})
AuditLogSchema.index({createdAt:-1})
module.exports=mongoose.models.AuditLog||mongoose.model('AuditLog',AuditLogSchema)
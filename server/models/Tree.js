const mongoose=require('mongoose')
const PhotoSchema=new mongoose.Schema({url:{type:String,required:true},publicId:{type:String,required:true},altText:{type:String,trim:true,maxlength:180,default:''},uploadedAt:{type:Date,default:Date.now}})
const TreeSchema=new mongoose.Schema({
 treeId:{type:String,required:true,unique:true,trim:true,uppercase:true,maxlength:50},
 commonName:{type:String,required:true,trim:true,maxlength:120},
 scientificName:{type:String,trim:true,maxlength:180,default:''},
 scientificNameVerified:{type:Boolean,default:false},
 zone:{type:mongoose.Schema.Types.ObjectId,ref:'CampusZone',default:null},
 condition:{type:String,enum:['healthy','needs_attention','uncertain'],default:'uncertain'},
 location:{type:{type:String,enum:['Point']},coordinates:{type:[Number],validate:{validator:v=>!v||v.length===2,message:'GeoJSON coordinates must be [longitude, latitude].'}},default:null},
 locationVerified:{type:Boolean,default:false},photos:{type:[PhotoSchema],default:[]},
 notes:{type:String,trim:true,maxlength:3000,default:''},
 verificationStatus:{type:String,enum:['pending','verified','rejected'],default:'pending'},
 source:{type:String,trim:true,maxlength:300,default:'Admin entry'},recordedAt:{type:Date,default:null},
 createdBy:{type:mongoose.Schema.Types.ObjectId,ref:'Admin',default:null},updatedBy:{type:mongoose.Schema.Types.ObjectId,ref:'Admin',default:null}
},{timestamps:true})
TreeSchema.index({location:'2dsphere'})
TreeSchema.index({commonName:1,verificationStatus:1})
TreeSchema.index({zone:1,condition:1,verificationStatus:1})
module.exports=mongoose.models.Tree||mongoose.model('Tree',TreeSchema)
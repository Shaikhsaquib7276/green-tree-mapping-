const mongoose=require('mongoose')
const passportLocalMongoose=require('passport-local-mongoose')
const AdminSchema=new mongoose.Schema({
  displayName:{type:String,trim:true,maxlength:100,default:'GreenMap Administrator'},
  role:{type:String,enum:['admin'],default:'admin',immutable:true},
  isActive:{type:Boolean,default:true},lastLoginAt:{type:Date,default:null}
},{timestamps:true})
AdminSchema.plugin(passportLocalMongoose,{usernameLowerCase:true,usernameUnique:true,errorMessages:{UserExistsError:'That admin username already exists.'}})
module.exports=mongoose.models.Admin||mongoose.model('Admin',AdminSchema)
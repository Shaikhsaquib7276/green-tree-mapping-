const mongoose=require('mongoose')
const GalleryImageSchema=new mongoose.Schema({
 title:{type:String,required:true,trim:true,maxlength:160},description:{type:String,trim:true,maxlength:1500,default:''},
 category:{type:String,enum:['field-visit','tree','green-space','community'],default:'field-visit'},
 imageUrl:{type:String,required:true},cloudinaryPublicId:{type:String,required:true},
 altText:{type:String,trim:true,maxlength:180,default:''},isPublished:{type:Boolean,default:true},
 uploadedBy:{type:mongoose.Schema.Types.ObjectId,ref:'Admin',default:null}
},{timestamps:true})
module.exports=mongoose.models.GalleryImage||mongoose.model('GalleryImage',GalleryImageSchema)
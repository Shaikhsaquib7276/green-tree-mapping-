const mongoose=require('mongoose')
const PolygonSchema=new mongoose.Schema({
 type:{type:String,enum:['Polygon'],required:true},
 coordinates:{type:[[[Number]]],required:true}
},{_id:false})
const CampusZoneSchema=new mongoose.Schema({
 name:{type:String,required:true,trim:true,maxlength:100},
 slug:{type:String,required:true,unique:true,lowercase:true,trim:true},
 description:{type:String,trim:true,maxlength:1000,default:''},
 boundary:{type:PolygonSchema,default:undefined},
 isActive:{type:Boolean,default:true},sortOrder:{type:Number,default:0}
},{timestamps:true})
module.exports=mongoose.models.CampusZone||mongoose.model('CampusZone',CampusZoneSchema)

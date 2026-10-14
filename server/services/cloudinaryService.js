const {Readable}=require('node:stream')
const {cloudinary,isCloudinaryConfigured}=require('../config/cloudinary')
function uploadBuffer(buffer,folder){
 if(!isCloudinaryConfigured())throw new Error('Cloudinary is not configured. Add CLOUDINARY credentials to server/.env.')
 return new Promise((resolve,reject)=>{
  const stream=cloudinary.uploader.upload_stream({folder,resource_type:'image',quality:'auto',fetch_format:'auto'},(error,result)=>{
   if(error)return reject(error)
   if(!result?.secure_url||!result?.public_id)return reject(new Error('Cloudinary returned an incomplete upload result.'))
   resolve({url:result.secure_url,publicId:result.public_id,width:result.width,height:result.height,format:result.format,bytes:result.bytes})
  })
  Readable.from([buffer]).pipe(stream)
 })
}
async function deleteAsset(publicId){if(!publicId||!isCloudinaryConfigured())return;await cloudinary.uploader.destroy(publicId,{resource_type:'image',invalidate:true})}
module.exports={uploadBuffer,deleteAsset}
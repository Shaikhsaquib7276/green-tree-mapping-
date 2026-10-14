require('dotenv').config({path:require('node:path').join(__dirname,'..','.env')})
const mongoose=require('mongoose')
const connectDB=require('../config/db')
const Admin=require('../models/Admin')
async function main(){
 const username=process.env.ADMIN_USERNAME
 const password=process.env.ADMIN_PASSWORD
 if(!username||!password||password.length<6)throw new Error('Set ADMIN_USERNAME and ADMIN_PASSWORD (minimum 6 characters) in server/.env.')
 await connectDB()
 try{
  const admin=await Admin.findOne({username:username.toLowerCase()})
  if(!admin)throw new Error('Admin username was not found. Run npm run admin:create first.')
  await new Promise((resolve,reject)=>admin.setPassword(password,error=>error?reject(error):resolve()))
  admin.isActive=true
  if(process.env.ADMIN_DISPLAY_NAME)admin.displayName=process.env.ADMIN_DISPLAY_NAME
  await admin.save()
  console.log(`Password reset for "${username}". Remove ADMIN_PASSWORD from server/.env after verifying login.`)
 }finally{await mongoose.disconnect()}
}
main().catch(error=>{console.error('Password reset failed:',error.message);process.exitCode=1})
require('dotenv').config({path:require('node:path').join(__dirname,'..','.env')})
const mongoose=require('mongoose')
const connectDB=require('../config/db')
const Admin=require('../models/Admin')
async function main(){
 const username=process.env.ADMIN_USERNAME
 const password=process.env.ADMIN_PASSWORD
 const displayName=process.env.ADMIN_DISPLAY_NAME||'GreenMap Administrator'
 if(!username||!password||password.length<6)throw new Error('Set ADMIN_USERNAME and ADMIN_PASSWORD (minimum 6 characters) in server/.env.')
 await connectDB()
 try{
  const existing=await Admin.findOne({username:username.toLowerCase()})
  if(existing)throw new Error('That admin username already exists. Run npm run admin:reset to change its password.')
  const admin=new Admin({username,displayName,role:'admin',isActive:true})
  await Admin.register(admin,password)
  console.log(`Admin account created for "${username}". Remove ADMIN_PASSWORD from server/.env after verifying login.`)
 }finally{await mongoose.disconnect()}
}
main().catch(error=>{console.error('Admin setup failed:',error.message);process.exitCode=1})
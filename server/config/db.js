const mongoose=require('mongoose')
async function connectDB(){
  const uri=process.env.MONGO_URL
  if(!uri||/YOUR_CLUSTER|<cluster-host>|YOUR_USERNAME/.test(uri)) throw new Error('MONGO_URL is missing or still contains example placeholders. Set a real MongoDB Atlas URI in server/.env.')
  mongoose.set('strictQuery',true)
  await mongoose.connect(uri,{serverSelectionTimeoutMS:12000})
  console.log(`MongoDB connected: ${mongoose.connection.name}`)
  return mongoose.connection
}
module.exports=connectDB
require('dotenv').config({path:require('node:path').join(__dirname,'.env')})
const connectDB=require('./config/db')
const port=Number(process.env.PORT||5000)

async function start(){
  await connectDB()
  const app=require('./app')
  app.listen(port,'0.0.0.0',()=>console.log(`GreenMap API listening on port ${port}`))
}
start().catch(error=>{console.error(`GreenMap failed to start: ${error.message}`);process.exitCode=1})
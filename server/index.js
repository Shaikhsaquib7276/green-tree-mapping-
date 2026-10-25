require('dotenv').config({path:require('node:path').join(__dirname,'.env')})
const connectDB=require('./config/db')
const Admin=require('./models/Admin')
const port=Number(process.env.PORT||5000)

async function bootstrapAdminFromEnvironment(){
  const username=String(process.env.ADMIN_USERNAME||'').trim().toLowerCase()
  const password=process.env.ADMIN_PASSWORD||''
  if(!username||!password){
    console.log('Admin bootstrap skipped: ADMIN_USERNAME and ADMIN_PASSWORD are not both configured.')
    return
  }
  if(password.length<6)throw new Error('ADMIN_PASSWORD must be at least 6 characters to create the initial admin.')
  const existing=await Admin.findOne({username})
  if(existing){
    console.log(`Admin bootstrap skipped: account "${username}" already exists; its password was not changed.`)
    return
  }
  const admin=new Admin({
    username,
    displayName:process.env.ADMIN_DISPLAY_NAME||'GreenMap Administrator',
    role:'admin',
    isActive:true
  })
  await Admin.register(admin,password)
  console.log(`Initial admin account "${username}" created from Render environment variables. Remove ADMIN_PASSWORD after verifying login.`)
}

async function start(){
  await connectDB()
  await bootstrapAdminFromEnvironment()
  const app=require('./app')
  app.listen(port,'0.0.0.0',()=>console.log(`GreenMap API listening on port ${port}`))
}
start().catch(error => {
  const servers = error.reason?.servers;

  const details = {
    name: error.name,
    message: error.message,
    code: error.code,
    cause: error.cause?.message,
    servers: servers
      ? [...servers.entries()].map(([address, server]) => ({
          address,
          state: server.type,
          error: server.error?.message,
          code: server.error?.code
        }))
      : undefined
  };

  console.error(
    'GreenMap startup diagnostics:',
    JSON.stringify(details, null, 2)
  );

  process.exitCode = 1;
});

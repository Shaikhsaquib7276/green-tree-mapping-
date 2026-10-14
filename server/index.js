require('dotenv').config({path:require('node:path').join(__dirname,'.env')})
const connectDB=require('./config/db')
const port=Number(process.env.PORT||5000)

async function start(){
  await connectDB()
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

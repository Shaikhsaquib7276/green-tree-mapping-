import { spawn } from 'node:child_process'
const isWindows = process.platform === 'win32'
const npm = isWindows ? 'npm.cmd' : 'npm'
const jobs = [{name:'API',args:['run','dev:api']},{name:'WEB',args:['run','dev:web']}]
const children = jobs.map(({name,args}) => {
  const child = spawn(npm,args,{stdio:['inherit','pipe','pipe'],shell:isWindows,env:process.env})
  child.stdout?.on('data',chunk=>process.stdout.write(`[${name}] ${chunk}`))
  child.stderr?.on('data',chunk=>process.stderr.write(`[${name}] ${chunk}`))
  child.on('exit',code=>{if(code && code!==0) console.error(`[${name}] exited with code ${code}`)})
  return child
})
function stop(){children.forEach(child=>child.kill('SIGTERM'))}
process.on('SIGINT',()=>{stop();process.exit(0)})
process.on('SIGTERM',()=>{stop();process.exit(0)})
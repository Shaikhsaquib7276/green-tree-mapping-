const AuditLog=require('../models/AuditLog')
async function recordAudit({actor,action,entityType,entityId,details={}}){
 try{await AuditLog.create({actor:actor?._id||actor||null,action,entityType,entityId:String(entityId||''),details})}
 catch(error){console.error('Audit log write failed:',error.message)}
}
module.exports={recordAudit}
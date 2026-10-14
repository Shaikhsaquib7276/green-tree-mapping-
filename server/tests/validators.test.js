const test=require('node:test')
const assert=require('node:assert/strict')
const {treeSchema}=require('../validators/treeValidator')
const {surveyResponseSchema}=require('../validators/surveyValidator')
const requireAdmin=require('../middleware/requireAdmin')

test('tree record accepts unknown location without inventing coordinates',()=>{
 const result=treeSchema.validate({treeId:'TG-001',commonName:'Neem',zone:null,condition:'healthy',notes:''})
 assert.equal(result.error,undefined)
 assert.equal(result.value.latitude,undefined)
 assert.equal(result.value.longitude,undefined)
})

test('tree record rejects half-specified coordinates',()=>{
 const result=treeSchema.validate({treeId:'TG-001',commonName:'Neem',latitude:19.8})
 assert.ok(result.error)
})

test('tree record rejects out-of-range latitude',()=>{
 const result=treeSchema.validate({treeId:'TG-001',commonName:'Neem',latitude:91,longitude:72})
 assert.ok(result.error)
})

test('survey response accepts only supported campus zones and answers',()=>{
 const result=surveyResponseSchema.validate({
  ageGroup:'18–22',zone:'Main Ground',awareness:'Somewhat',
  greenSpaceImportance:'Very important',participationInterest:'Yes',suggestions:''
 })
 assert.equal(result.error,undefined)
})

test('survey response rejects unknown or invented zone names',()=>{
 const result=surveyResponseSchema.validate({
  ageGroup:'18–22',zone:'Central Lawn',awareness:'Somewhat',
  greenSpaceImportance:'Very important',participationInterest:'Yes'
 })
 assert.ok(result.error)
})

test('admin middleware rejects unauthenticated access',()=>{
 let status=0,body
 const res={status(value){status=value;return this},json(value){body=value;return this}}
 requireAdmin({},res,()=>assert.fail('next must not be called'))
 assert.equal(status,401)
 assert.equal(body.error.code,'ADMIN_AUTH_REQUIRED')
})

test('admin middleware allows an active administrator',()=>{
 let proceeded=false
 requireAdmin({user:{role:'admin',isActive:true}},{status(){throw Error('should not reject')},json(){throw Error('should not reject')}},()=>{proceeded=true})
 assert.equal(proceeded,true)
})

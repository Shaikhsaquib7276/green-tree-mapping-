const multer=require('multer')
const upload=multer({
 storage:multer.memoryStorage(),limits:{fileSize:5*1024*1024,files:1},
 fileFilter(req,file,done){const types=new Set(['image/jpeg','image/png','image/webp']);if(!types.has(file.mimetype))return done(new Error('Only JPG, PNG and WEBP images are allowed.'));done(null,true)}
})
module.exports=upload
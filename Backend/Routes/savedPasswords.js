const express=require("express")
const router=express.Router()
const {renderPasswords,createFields,deleteField,updateField}=require("../Controller/savedPasswords")
const { requireAuth } = require("../Middleware/Auth")

router.use(requireAuth)

router.get("/",renderPasswords)
router.post("/",createFields)
router.delete("/:id",deleteField)
router.patch("/:id",updateField)
module.exports=router;
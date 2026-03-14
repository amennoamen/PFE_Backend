const express=require("express");
const router=express.Router();
const upload=require("../middleware/upload");

const documentController=require("../controllers/document.controller");


router.post("/upload",upload.single("file"),documentController.uploadDocument);

router.get("/documents",documentController.listDocuments);

module.exports = router;

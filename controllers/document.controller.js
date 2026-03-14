const documentService=require("../services/document.service");
exports.uploadDocument=async (req, res)=>{
  try {

    const result=await documentService.uploadDocument(req.file);

    res.status(200).json({
      message:"Upload successful",
      document:result
    });

  } catch (error) {
    res.status(500).json({error:error.message });
  }
};


exports.listDocuments=async(req,res)=>{
  try {

    const documents=await documentService.listDocuments();

    res.status(200).json(documents);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

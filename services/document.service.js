const fs=require("fs");
const path=require("path");

exports.uploadDocument=async(file)=>{

  if (!file){
    throw new Error("No file uploaded");
  }

  if (!fs.existsSync(file.path)){
    throw new Error("File storage failed");
  }

  return {
    originalName:file.originalname,
    filePath:`/uploads/documents/${file.filename}`,
    size:file.size,
    status:"EN_COURS"
  };

};


exports.listDocuments=async()=>{

  const directoryPath=path.join(__dirname,"../uploads/documents");

  const files=fs.readdirSync(directoryPath);

  const documents=files.map(file =>({
    name:file,
    url:`/uploads/documents/${file}`
  }));

  return{
    count:documents.length,
    documents:documents
  };

};

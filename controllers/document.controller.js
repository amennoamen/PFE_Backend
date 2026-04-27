const documentService = require('../services/document.service');
const { checkHealth } = require('../services/python.service');
const fs = require('fs');

class DocumentController {

  // async createDocument(req, res) {
  //   try {
      
      
  //     const documentData = {
  //       originalName:req.file.originalname,
  //       fileName: req.file.filename,
  //       filePath: req.file.path,
  //       fileType: req.file.mimetype,
  //       fileSize: req.file.size,
  //       uploadedBy: req.user.id
  //     };
  //     //console.log(req.file)
      
  //     const document = await documentService.createDocument(documentData);
      
  //     res.status(201).json({
  //       message: 'Document uploadé avec succès',
  //       document
  //     });
      
  //   } catch (error) {
  //     console.error(' Erreur upload:', error);
      

      
  //     if (req.file && fs.existsSync(req.file.path)) {
  //       fs.unlinkSync(req.file.path);
  //     }
      
  //     res.status(500).json({ 
  //       error: error.message 
  //     });
  //   }
  // }
async upload(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Aucun fichier envoyé' });
      }
 
      const { document, analyse } = await documentService.uploadAndAnalyze({
        file:   req.file,
        userId: req.user.id,
      });
 
      res.status(201).json({
        message: 'Document traité avec succès',
        document: {
          id:           document.id,
          originalName: document.originalName,
          fileType:     document.fileType,
          fileSize:     document.fileSize,
          statut:       document.statut,
          createdAt:    document.createdAt,
          user:         document.user,
        },
        analyse: {
          typeDocument: analyse.typeDocument,
          bcEntity:     analyse.bcEntity,
          categorie:    analyse.categorie,
          langue:       analyse.langue,
          pays:         analyse.pays,
          resume:       analyse.resume,
          bcFields:     analyse.bcFields,
          bcLines:      analyse.bcLines,
          scores: {
            ocr:            analyse.scoreOcr,
            classification: analyse.scoreClassification,
            extraction:     analyse.scoreExtraction,
            global:         analyse.scoreGlobal,
          },
          validation: {
            statut:            analyse.statutValidation,
            actionRecommandee: analyse.actionRecommandee,
          },
          champsManquants: analyse.champsManquants,
          ocr: {
            methode: analyse.methodeOcr,
            nbMots:  analyse.nbMots,
          },
        },
      });
 
    } catch (error) {
      console.error('Erreur upload-analyse:', error);
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ error: error.message });
    }
  }



    async getAllDocuments(req, res) {
    try {
      const documents = await documentService.getAllDocuments();

    if (documents.length === 0) {

      return res.status(200).json({ message: "Aucun document trouvé" });
    }
      res.json(documents);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
   }
  
   /**  GET /documents/MyDocumentsWithAnalyse  Mes documents avec résumé analyse IA */
  async getMyDocuments(req, res) {
    try {
      const documents = await documentService.getMyDocuments(req.user.id);
      res.json(documents);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  //  document By id 
  async getDocumentById(req, res) {
    try {
      const { id } = req.params;
      const document = await documentService.getDocumentById(id);
      
      if (!document) {
        return res.status(404).json({ error: 'Document introuvable' });
      }
      
      res.json(document);
    } catch (error) {

      res.status(500).json({  error: error.message });
    }
  }



  //  DELETE 
async delete(req, res) {
    try {
      const { id } = req.params;
      
      // Récupérer le document
      const document = await documentService.getDocumentById(id);
      
      if (!document) {
        return res.status(404).json({  error: 'Document introuvable' });
      }

      
      // Supprimer
      await documentService.deleteDocument(id);
      
      res.json({ 
        message: 'Document supprimé avec succès' 
      });
      
    } catch (error) {
      
      res.status(500).json({ error: error.message });
    }
  }

  

 
  async updateAnalyse(req, res) {
    try {
      const { id } = req.params;
      const { bcFields, bcLines } = req.body;
      const existing = await documentService.getDocumentById(id);
       if (!existing) {
              return res.status(404).json({ error: 'Document  introuvable' });
         }
      const analyse = await documentService.updateAnalyse(id, { bcFields, bcLines });
      res.json({ message: 'Modifications enregistrées', analyse });
    } catch (error) {
      console.error('Erreur updateAnalyse:', error);
      res.status(500).json({ error: error.message });
    }
  }


    async validateDocument(req, res) {
    try {
      const { id } = req.params;
      const { bcFields, bcLines } = req.body;
       const existing = await documentService.getDocumentById(id);
       if (!existing) {
              return res.status(404).json({ error: 'Document  introuvable' });
         }

      const document = await documentService.validateDocument(id, { bcFields, bcLines, validatedBy: req.user.id  });
      res.json({ message: 'Document validé avec succès', document });
    } catch (error) {
      console.error('Erreur validateDocument:', error);
      res.status(500).json({ error: error.message });
    }
  }
 
  async rejectDocument(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const existing = await documentService.getDocumentById(id);
      if (!existing) {
              return res.status(404).json({ error: 'Document  introuvable' });
         }
      if (!reason || !reason.trim()) {
        return res.status(400).json({ error: 'La raison du rejet est obligatoire' });
      }
      const document = await documentService.rejectDocument(id, { reason, rejectedBy: req.user.id });
      res.json({ message: 'Document rejeté', document });
    } catch (error) {
      console.error('Erreur rejectDocument:', error);
      res.status(500).json({ error: error.message });
    }
  }
 async serveFile(req, res) {
  try {
    const { id } = req.params;
    const document = await documentService.getDocumentById(id);

    if (!document) {
      return res.status(404).json({ error: 'Document introuvable' });
    }

    // filePath est absolu en base → on l'utilise directement
    if (!fs.existsSync(document.filePath)) {
      return res.status(404).json({ error: 'Fichier physique introuvable' });
    }

    res.setHeader('Content-Type', document.fileType);
    res.setHeader('Content-Disposition', `inline; filename="${document.originalName}"`);
    res.sendFile(document.filePath);

  } catch (error) {
    console.error('Erreur serveFile:', error);
    res.status(500).json({ error: error.message });
  }
}

async getDashboardStats(req, res) {
  try {
    const stats = await documentService.getDashboardStats();
    res.json(stats);
  } catch (error) {
    console.error('Erreur getDashboardStats:', error);
    res.status(500).json({ error: error.message });
  }
}








  /**  GET /documents/python/health  Vérifie que le microservice Python est disponible **/
  async pythonHealth(req, res) {
    try {
      const ok = await checkHealth();
      res.status(ok ? 200 : 503).json({
        service: 'microservice Python (port 5001)',
        status:  ok ? 'disponible' : 'indisponible',
      });
    } catch (error) {
      res.status(503).json({ service: 'microservice Python', status: 'indisponible' });
    }
  }



}
module.exports = new DocumentController();
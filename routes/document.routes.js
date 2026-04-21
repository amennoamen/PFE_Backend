const express = require('express');
const router = express.Router();
const documentController = require('../controllers/document.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const upload = require('../middleware/upload');

// Vérifier que le microservice Python est disponible
router.get('/python/health', documentController.pythonHealth);

router.use(authMiddleware);

router.post( '/upload',roleMiddleware('COMPTABLE', 'MANAGER', 'ADMIN'), (req, res,next) => {
  upload.single("file")(req, res, (err) => {

    if (err) {
      return res.status(400).json({
        error: err.message
      });
    }

    if (!req.file) {
      return res.status(400).json({
        error: "Aucun fichier fourni"
      });
    }

  next();
  }); 
},documentController.createDocument);

router.get('/all',roleMiddleware( 'MANAGER', 'ADMIN'),documentController.getAllDocuments);

router.get('/myDocuments',roleMiddleware( 'COMPTABLE','MANAGER', 'ADMIN'),documentController.getMyDocuments)

router.get('/DocumentById/:id',roleMiddleware('COMPTABLE', 'MANAGER', 'ADMIN'),documentController.getById);


router.delete('/delete/:id',roleMiddleware('COMPTABLE', 'MANAGER', 'ADMIN'),documentController.delete);


 

// Upload + analyse IA complète (OCR + LLM)
router.post('/upload-analyse', roleMiddleware('COMPTABLE', 'MANAGER', 'ADMIN'), (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'Aucun fichier fourni' });
    next();
  });
}, documentController.upload);
 
// Un document avec son analyse IA complète
router.get('/DocumentAnalyserById/:id', roleMiddleware('COMPTABLE', 'MANAGER', 'ADMIN'), documentController.getByIdWithAnalyse);

// Mes documents avec résumé analyse IA
router.get('/MyDocumentsWithAnalyse', roleMiddleware('COMPTABLE', 'MANAGER', 'ADMIN'), documentController.getMyDocumentsWithAnalyse);
 
// update analyse 
router.put('/updateAnalyse/:id',  roleMiddleware('COMPTABLE', 'MANAGER', 'ADMIN'), documentController.updateAnalyse);

// valide Document seulement admin et manager peux faire l'action 
router.post('/validate/:id', roleMiddleware('MANAGER', 'ADMIN'),documentController.validateDocument);

// Rejeter un Document 
router.post('/reject/:id',   roleMiddleware('MANAGER', 'ADMIN'),documentController.rejectDocument);

router.get('/file/:id',      roleMiddleware('COMPTABLE', 'MANAGER', 'ADMIN'), documentController.serveFile);

router.get('/stats', roleMiddleware('MANAGER', 'ADMIN'), documentController.getDashboardStats);

module.exports = router;
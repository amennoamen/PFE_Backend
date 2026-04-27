var express = require('express');
var router = express.Router();
const auditController = require('../controllers/audit.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');

// Toutes les routes nécessitent d'être authentifié
router.use(authMiddleware);

// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
//   Audit Log (ADMIN uniquement)


// GET - Liste tous les logs avec filtres et pagination
router.get('/getAllLogs', roleMiddleware('ADMIN'), auditController.getAllLogs);

// GET - Détail d'un log
router.get('/getLogById/:id', roleMiddleware('ADMIN'), auditController.getLogById);

module.exports = router;
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
//const authMiddleware = require('../middleware/auth.middleware');

// Routes publiques (pas besoin d'être connecté)
router.post('/login', authController.login);
router.post('/logout', authController.logout);



module.exports = router;
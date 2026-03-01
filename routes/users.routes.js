var express = require('express');
var router = express.Router();
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');

// Toutes les routes nécessitent d'être authentifié
router.use(authMiddleware);

// Profil utilisateur connecté
router.get('/me', userController.getMyProfile);

router.patch('/updateMe', userController.updateMyProfile);

router.patch('/updatePassword', userController.updatePassword);

/* GET users  */
//    GET - Récupérer les utilisateurs ( ADMIN  MANAGER )
router.get('/getAllUsers', roleMiddleware('ADMIN', 'MANAGER')  ,userController.getAll) 

router.get('/getUserByEmail',roleMiddleware('ADMIN', 'MANAGER'),userController.getUserByEmail)

router.get('/getUserById/:id', roleMiddleware('ADMIN', 'MANAGER'),userController.getById);


// POST - Créer un utilisateur (ADMIN uniquement)

router.post('/addUser', roleMiddleware('ADMIN'),userController.create);

//Pour COMPTABLE 
router.patch('/updateUser/:id', roleMiddleware('ADMIN', 'MANAGER'),userController.update);

// PATCH - Activer/Désactiver (ADMIN uniquement)

router.patch('/toggle/:id',roleMiddleware('ADMIN'), userController.toggleActive);

// DELETE - Supprimer un utilisateur (ADMIN uniquement)

router.delete('/deleteUserById/:id', roleMiddleware('ADMIN'),userController.delete);


module.exports = router;

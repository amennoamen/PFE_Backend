const userService = require('../services/user.service');



class UserController {

  // POST /api/users - Créer un utilisateur
  async create(req, res) {
    try {
      const { email, password, nom ,prenom ,isActive,  role } = req.body;
     
      // Validation
      if (!email || !password || !nom || !prenom) {
        return res.status(400).json({ 
          error: 'Email, mot de passe, nom et prénom sont obligatoires' 
        });
      }

      // Vérifier longueur mot de passe
      if (password.length < 6) {
        return res.status(400).json({ 
          error: 'Le mot de passe doit contenir au moins 6 caractères' 
        });
      }

      // Vérifier si l'email existe déjà
      const existing = await userService.getUserByEmail(email);
      if (existing) {
        return res.status(400).json({ 
          error: 'Cet email est déjà utilisé' 
        });
      }

      // Créer l'utilisateur (le mot de passe sera hashé automatiquement)
      const user = await userService.createUser({ 
        email, 
        password, 
        nom, 
        prenom, 
        role ,
        isActive
      });
      
      res.status(201).json({
        message: 'Utilisateur créé avec succès',
        user  // Le password n'est PAS dans la réponse
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

















  // GET /api/users - Liste tous les utilisateurs
  async getAll(req, res) {
 try {
    const users = await userService.getAllUsers();
    if (users.length === 0) {
      return res.status(200).json({ message: "Aucun utilisateur trouvé" });
    }
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
  }


  // GET /users/ getUserByEmail -   recherhe par email 


  async getUserByEmail(req, res) {
 try {
    const{ email }=req.body;
    const user= await userService.getUserByEmail(email);
    delete user.password; // hethi najm na7iha ou nbadel fel select t3 user mn service 
    if (user.length === 0) {
      return res.status(200).json({ message: "Aucun utilisateur trouvé" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
  }


  // GET /api/users/:id - Détails d'un utilisateur
  async getById(req, res) {
    try {
      const { id } = req.params;
      const user = await userService.getUserById(id);
      
      if (!user) {
        return res.status(404).json({ error: 'Utilisateur introuvable' });
      }
      
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }


  // DELETE /deleteUserById/:id' - Supprimer un utilisateur
  async delete(req, res) {
    try {
      const { id } = req.params;
            // Empêcher l'admin de se supprimer lui-même

      if (req.user.id === id) {
        return res.status(400).json({ 
          error: 'Vous ne pouvez pas supprimer votre propre compte' 
        });
      }

      // Vérifier si l'utilisateur existe
      const existing = await userService.getUserById(id);
      if (!existing) {
        return res.status(404).json({ error: 'Utilisateur introuvable' });
      }

      await userService.deleteUser(id);
      
      res.json({ message: 'Utilisateur supprimé avec succès' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
}

 // PATCH /api/users/:id - Modifier un utilisateur c'est just pour un utilisateur simple comptable 
  async update(req, res) {
    try {
      const { id } = req.params;
      const data = req.body;

      // Vérifier si l'utilisateur existe
      const existing = await userService.getUserById(id);
      if (!existing) {
        return res.status(404).json({ error: 'Utilisateur introuvable' });
      }

    

      // Mettre à jour 
      const user = await userService.updateUser(id, data);
      
      res.json({
        message: 'Utilisateur modifié avec succès',
        user
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }



  // PATCH /api/users/:id/toggle - Activer/Désactiver

  async toggleActive(req, res) {
    try {
      const { id } = req.params;


      // Empêcher l'admin de se désactiver lui-même
      if (req.user.id === id) {
        return res.status(400).json({ 
          error: 'Vous ne pouvez pas désactiver votre propre compte' 
        });
      }
      const user = await userService.toggleActive(id);
       
      res.json({
        message: user.isActive ? 'Utilisateur activé' : 'Utilisateur désactivé',
        user
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }


  /////////////////////////////////////
  // profile Utilisateur connecté//
  ////////////////////////////////
// GET /api/users/me
  async getMyProfile(req, res) {
    try {
      const userId = req.user.id; // récupéré depuis JWT

      const user = await userService.getUserById(userId);

      if (!user) {
        return res.status(404).json({ error: 'Utilisateur introuvable' });
      }

      const { password, ...userWithoutPassword } = user;

      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }



    // PATCH /api/users/me
  async updateMyProfile(req, res) {
    try {
      const userId = req.user.id;
      const data = req.body;

      // Empêcher modification role et isActive
      if (data.role || data.isActive !== undefined) {
        return res.status(403).json({
          error: 'Vous ne pouvez pas modifier le rôle ou le statut'
        });
      }

      const updatedUser = await userService.updateOwnProfile(userId, data);

      res.json({
        message: 'Profil modifié avec succès',
        user: updatedUser
      });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

 // PATCH /api/users/updatePassword - Changer son mot de passe
  async updatePassword(req, res) {
    try {
      const { oldPassword, newPassword } = req.body;
      const userId = req.user.id;  // ID depuis le token JWT

      // Validation
      if (!oldPassword || !newPassword) {
        return res.status(400).json({ 
          error: 'Ancien et nouveau mot de passe requis' 
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ 
          error: 'Le nouveau mot de passe doit contenir au moins 6 caractères' 
        });
      }

      if (oldPassword === newPassword) {
        return res.status(400).json({ 
          error: 'Le nouveau mot de passe doit être différent de l\'ancien' 
        });
      }

      // Changer le mot de passe
      const user = await userService.updatePassword(userId, oldPassword, newPassword);

      res.json({
        message: 'Mot de passe modifié avec succès',
        user
      });
    } catch (error) {
      if (error.message === 'Ancien mot de passe incorrect') {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  }







  
}


module.exports = new UserController();

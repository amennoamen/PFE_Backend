const authService = require('../services/auth.service');

class AuthController {
  // POST /login - Connexion
  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Validation
      if (!email || !password) {
        return res.status(400).json({
          error: 'Email et mot de passe requis'
        });
      }

      // Appeler le service
      const result = await authService.login(email, password);

      res.json({
        message: 'Connexion réussie',
        ...result
      });
    } catch (error) {
      // Erreurs d'authentification = 401 Unauthorized
      if (error.message.includes('incorrect') || error.message.includes('désactivé')) {
        return res.status(401).json({ error: error.message });
      }
      
      res.status(500).json({ error: error.message });
    }
  }

  // POST /api/auth/logout - Déconnexion
  async logout(req, res) {
    // Avec JWT, le logout se fait côté client (supprimer le token)
    res.json({ 
      message: 'Déconnexion réussie. Supprimez le token côté client.' 
    });
  }

 
}

module.exports = new AuthController();
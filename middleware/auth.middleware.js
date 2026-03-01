const authService = require('../services/auth.service');

async function authMiddleware(req, res, next) {
  try {
    // 1. Récupérer le token depuis l'en-tête Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        error: 'Token manquant. Veuillez vous connecter.'
      });
    }

    // 2. Extraire le token (format : "Bearer TOKEN")
    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        error: 'Format de token invalide. Utilisez: Bearer TOKEN'
      });
    }

    // 3. Vérifier le token et récupérer l'utilisateur
    const user = await authService.verifyToken(token);

    // 4. Ajouter l'utilisateur à la requête
    req.user = user;

    // 5. Passer au middleware/controller suivant
    next();
  } catch (error) {
    return res.status(401).json({
      error: 'Token invalide ou expiré. Veuillez vous reconnecter.'
    });
  }
}

module.exports = authMiddleware;
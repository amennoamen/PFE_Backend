function roleMiddleware(...allowedRoles) {
  return (req, res, next) => {
    // req.user a été ajouté par authMiddleware
    if (!req.user) {
      return res.status(401).json({
        error: 'Non authentifié'
      });
    }

    // Vérifier si le rôle de l'utilisateur est autorisé
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Accès refusé. Permissions insuffisantes.',
        required: allowedRoles,
        current: req.user.role
      });
    }

    // Rôle autorisé, passer au suivant
    next();
  };
}

module.exports = roleMiddleware;
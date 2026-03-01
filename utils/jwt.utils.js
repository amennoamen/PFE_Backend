const jwt = require('jsonwebtoken');

class JwtUtils {
  // Générer un token JWT
  generateToken(user) {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role
    };

    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    });
  }

  // Vérifier un token JWT
  verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      throw new Error('Token invalide ou expiré');
    }
  }

  // Décoder un token sans vérification (pour debug)
  decodeToken(token) {
    return jwt.decode(token);
  }
}

module.exports = new JwtUtils();
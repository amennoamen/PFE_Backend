const {prisma} = require('../config/database');
const bcryptUtils = require('../utils/bcrypt.utils');
const jwtUtils = require('../utils/jwt.utils');





class AuthService {
  // Login
  async login(email, password) {
    // 1. Vérifier si l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      throw new Error('Email ou mot de passe incorrect');
    }

    // 2. Vérifier si le compte est actif
    if (!user.isActive) {
      throw new Error('Compte désactivé. Contactez un administrateur.');
    }

    // 3. Vérifier le mot de passe
    const isPasswordValid = await bcryptUtils.compare(password, user.password);

    if (!isPasswordValid) {
      throw new Error('Email ou mot de passe incorrect');
    }

    // 4. Générer le token JWT
    const token = jwtUtils.generateToken(user);

    // 5. Retourner le token et les infos utilisateur (sans le password)
    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        nom: user.nom,
        prenom: user.prenom,
        role: user.role,
        isActive: user.isActive
      }
    };
  }

  // Vérifier un token et retourner les infos utilisateur
  async verifyToken(token) {
    const decoded = jwtUtils.verifyToken(token);
    
    // Récupérer l'utilisateur depuis la BDD
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        role: true,
        isActive: true
      }
    });

    if (!user) {
      throw new Error('Utilisateur introuvable');
    }

    if (!user.isActive) {
      throw new Error('Compte désactivé');
    }

    return user;
  }
}

module.exports = new AuthService();
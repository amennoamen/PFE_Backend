const { prisma } = require("../config/database.js");
const bcryptUtils = require("../utils/bcrypt.utils");

class UserService {
  // Créer un utilisateur
  async createUser(data) {
    // Hasher le mot de passe avant de sauvegarder
    //await new Promise(resolve => setTimeout(resolve, 5000));
    const hashedPassword = await bcryptUtils.hash(data.password);

    return await prisma.user.create({
      data: {
        email: data.email,
        nom: data.nom,
        prenom: data.prenom,
        password: hashedPassword, //  Mot de passe hashé
        isActive: data.isActive ?? true,
        role: data.role || "COMPTABLE",
      },
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  async getAllUsers() {

   // await new Promise(resolve => setTimeout(resolve, 5000));

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        lastLogin: true,
        // fakeField: true pour tester 
        // password: false (on ne retourne PAS le mot de passe)
      },
      orderBy: { createdAt: "desc" },
    });

    return users;
  }

  // Récupérer un utilisateur par email (AVEC le mot de passe - pour login)
  // Aussi pour la verification lors de l'ajout
  async getUserByEmail(email) {
    const UserByEmail = await prisma.user.findUnique({

      where: { email },
     
    });
    return UserByEmail;
  }

  // Récupérer un utilisateur par ID (sans le mot de passe)
  async getUserById(id) {
   //await new Promise(resolve => setTimeout(resolve, 5000));
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        lastLogin: true,
      },
    });
    return user;
  }

  // Supprimer un utilisateur
  async deleteUser(id) {
    // Empêcher l'admin de se supprimer lui-même

    const user = await prisma.user.delete({
      where: { id },
    });
    return user;
  }

  // Modifier un utilisateur
  async updateUser(id, data) {
    // Si on change le mot de passe, le hasher

    if (data.password) {
      data.password = await bcryptUtils.hash(data.password);
    }

    return await prisma.user.update({
      where: { id },
      data: {
        email: data.email,
        password: data.password,
        nom: data.nom,
        prenom: data.prenom,
        role: data.role,
        isActive: data.isActive,
      },
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        // On ne retourne PAS le password
      },
    });
  }

  // Modifier uniquement son propre profil (sans changer le rôle)
  async updateOwnProfile(id, data) {
    // Ne permet PAS de changer le rôle
    return await prisma.user.update({
      where: { id },
      data: {
        email: data.email,
        nom: data.nom,
        prenom: data.prenom,
      },
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        lastLogin: true,
      },
    });
  }
  // Activer/Désactiver un utilisateur
  async toggleActive(id) {
    const user = await this.getUserById(id);
    if (!user) {
      throw new Error("Utilisateur non trouvé");
    }

    const userUpdate = await prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return userUpdate;
  }

  // Changer le mot de passe (avec vérification de l'ancien)
  async updatePassword(userId, oldPassword, newPassword) {
    // Récupérer l'utilisateur avec son mot de passe
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error("Utilisateur introuvable");
    }

    // Vérifier l'ancien mot de passe
    const isValid = await bcryptUtils.compare(oldPassword, user.password);
    if (!isValid) {
      throw new Error("Ancien mot de passe incorrect");
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcryptUtils.hash(newPassword);

    // Mettre à jour
    return await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        role: true,
        isActive: true,
      },
    });
  }
}

module.exports = new UserService();

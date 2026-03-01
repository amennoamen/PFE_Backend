const { PrismaClient } = require('@prisma/client');
const bcryptUtils = require('../utils/bcrypt.utils');

const prisma = new PrismaClient();

async function main() {
  console.log(' Début du seeding...');

  // Vérifier si un admin existe déjà
  const existingAdmin = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  });

  if (existingAdmin) {
    console.log(' Un admin existe déjà.');
    console.log(`   Email: ${existingAdmin.email}`);
    return;
  }

  // Créer l'admin par défaut
  const hashedPassword = await bcryptUtils.hash(process.env.ADMIN_PASSWORD);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@ged.com',
      password: hashedPassword,
      nom: 'Admin',
      prenom: 'Système',
      role: 'ADMIN',
      isActive: true
    }
  });

  console.log('Compte admin créé avec succès !');
  console.log('═══════════════════════════════════');
  console.log(`   Email    : admin@ged.com`);
  console.log(`   Rôle     : ADMIN`);
}

main()
  .catch((e) => {
    console.error(' Erreur:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
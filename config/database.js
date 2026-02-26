const { PrismaClient }= require('@prisma/client');

// Crée une instance unique de Prisma 

const prisma =new PrismaClient();


async function testPostgresConnection() {
  try {
    await prisma.$connect();  // tente de se connecter à PostgreSQL
    console.log(' Connexion à PostgreSQL réussie !');
  } catch (error) {
    console.error(' Échec de la connexion :', error);
  }
}


// Fermer proprement à la fin
process.on('beforeExit', async () => {
    //ferme toutes les connexions ouvertes à la base de données.
  await prisma.$disconnect();
});

module.exports = {
    prisma,
     testPostgresConnection 
    };




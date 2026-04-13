const {prisma} = require('../config/database');
const fs = require('fs').promises;
const { analyzeDocument } = require('./python.service');

class DocumentService {



async createDocument(documentData) {
    
      const newDocument = await prisma.document.create({
        data: {
          ...documentData,
          statut: 'EN_COURS'
        },
        include: {
          user: {
            select: {
              id: true,
              nom: true,
              prenom: true,
              email: true,
              role: true
            }
          }
        }
      });
      
      return newDocument;
    
  }

  async getAllDocuments() {
    
    // pour tester le chargement 
   // await new Promise(resolve => setTimeout(resolve, 5000));
      const documents = await prisma.document.findMany({
        include: {
          user: {
            select: {
              id: true,
              nom: true,
              prenom: true,
              email: true,
              role: true,
             // fakeField: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      return documents;
   
  }


  // Récupérer que mes documents . apes login 


    async getMyDocuments(userId) {
    
     // pour tester le chargement 
     // await new Promise(resolve => setTimeout(resolve, 5000));
      const documents = await prisma.document.findMany({
        where: {   uploadedBy: userId},
        include: {
          user: {
            select: {
              id: true,
              nom: true,
              prenom: true,
              email: true,
              role: true,
              
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      return documents;
    } 
  
  // document par id 

async getDocumentById(id) {
    
      const document = await prisma.document.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              nom: true,
              prenom: true,
              email: true,
              role: true
            }
          }
        }
      });
      
      return document;
    }

  // DELETE

async deleteDocument(id) {
    try {
      // Récupérer le document
      const document = await prisma.document.findUnique({
        where: { id }
      });
      
      
      
      // Supprimer le fichier physique
      try {
        await fs.unlink(document.filePath);
        console.log('Fichier physique supprimé:', document.filePath);
      } catch (error) {
        console.error('Erreur suppression fichier:', error.message);
      }
      
      // Supprimer de la BDD
      await prisma.document.delete({
        where: { id }
      });
      
      return true;
    } catch (error) {
      throw new Error(`Erreur suppression document: ${error.message}`);
    }
  }




async uploadAndAnalyze({ file, userId }) {
 
    // Étape 1 : créer le document en base
    const document = await prisma.document.create({
      data: {
        originalName: file.originalname,
        fileName:     file.filename,
        filePath:     file.path,
        fileType:     file.mimetype,
        fileSize:     file.size,
        statut:       'TRAITEMENT',
        uploadedBy:   userId,
      }
    });
 
    try {
      // Étape 2 : appel microservice Python
      const pythonResult = await analyzeDocument(file.path, file.originalname);
 
      if (!pythonResult.succes) {
        await prisma.document.update({
          where: { id: document.id },
          data:  { statut: 'EN_COURS' }
        });
        throw new Error(pythonResult.erreur || 'Erreur microservice Python');
      }
 
      const { metadata, business_central, ocr, scores, validation } = pythonResult;
 
      // Étape 3 : créer le DocumentAnalyse
      const analyse = await prisma.documentAnalyse.create({
        data: {
          documentId: document.id,
 
          // Classification
          typeDocument: metadata?.type_document || null,
          bcEntity:     metadata?.bc_entity     || null,
          categorie:    metadata?.categorie      || null,
          langue:       metadata?.langue         || null,
          pays:         metadata?.pays           || null,
          resume:       metadata?.resume         || null,
 
          // Données BC
          bcFields: business_central?.bc_fields || null,
          bcLines:  business_central?.bc_lines  || null,
 
          // Scores
          scoreOcr:            scores?.score_ocr            ?? null,
          scoreClassification: scores?.score_classification ?? null,
          scoreExtraction:     scores?.score_extraction     ?? null,
          scoreGlobal:         scores?.score_global         ?? null,
 
          // Validation
          statutValidation:  validation?.statut             || null,
          actionRecommandee: validation?.action_recommandee || null,
          //champsManquants:   metadata?.champs_manquants     || [],
 
          // OCR
          texteExtrait: ocr?.texte_extrait || null,
          methodeOcr:   ocr?.methode       || null,
          nbMots:       ocr?.nb_mots       || null,
        }
      });
 
      // Étape 4 : mettre à jour le statut
      const nouveauStatut = validation?.statut === 'VALIDE' ? 'VALIDE' : 'EN_COURS';
      const documentFinal = await prisma.document.update({
        where: { id: document.id },
        data:  { statut: nouveauStatut },
        include: {
          user: {
            select: { id: true, nom: true, prenom: true, email: true, role: true }
          }
        }
      });
 
      return { document: documentFinal, analyse };
 
    } catch (error) {
      // Remettre en EN_COURS si erreur
      await prisma.document.update({
        where: { id: document.id },
        data:  { statut: 'EN_COURS' }
      }).catch(() => {});
 
      throw error;
    }
  }
 
  /**
   * Récupère un document avec son analyse IA
   */
  async getDocumentWithAnalyse(id) {
    return prisma.document.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, nom: true, prenom: true, email: true, role: true }
        },
        analyse: true
      }
    });
  }
 
  /**
   * Récupère les documents d'un user avec un résumé de l'analyse
   */
  async getMyDocumentsWithAnalyse(userId) {
    return prisma.document.findMany({
      where: { uploadedBy: userId },
      include: {
        user: {
          select: { id: true, nom: true, prenom: true, email: true, role: true }
        },
        analyse: {
          select: {
            typeDocument:     true,
            bcEntity:         true,
            scoreGlobal:      true,
            statutValidation: true,
            categorie:        true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }







}
module.exports = new DocumentService();
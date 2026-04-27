const { prisma } = require("../config/database");
const fs = require("fs").promises;
const { analyzeDocument } = require("./python.service");
const auditService = require("./audit.service");
class DocumentService {
  // async createDocument(documentData) {
  //   const newDocument = await prisma.document.create({
  //     data: {
  //       ...documentData,
  //       statut: "EN_COURS",
  //     },
  //     include: {
  //       user: {
  //         select: {
  //           id: true,
  //           nom: true,
  //           prenom: true,
  //           email: true,
  //           role: true,
  //         },
  //       },
  //     },
  //   });

  //   return newDocument;
  // }
  async uploadAndAnalyze({ file, userId }) {
    // Étape 1 : créer le document en base
    const document = await prisma.document.create({
      data: {
        originalName: file.originalname,
        fileName: file.filename,
        filePath: file.path,
        fileType: file.mimetype,
        fileSize: file.size,
        statut: "TRAITEMENT",
        uploadedBy: userId,
      },
    });

    try {
      // Étape 2 : appel microservice Python
      const pythonResult = await analyzeDocument(file.path, file.originalname);

      if (!pythonResult.succes) {
        await prisma.document.update({
          where: { id: document.id },
          data: { statut: "EN_COURS" },
        });
        throw new Error(pythonResult.erreur || "Erreur microservice Python");
      }

      const { metadata, business_central, ocr, scores, validation } =
        pythonResult;

      // Étape 3 : créer le DocumentAnalyse
      const analyse = await prisma.documentAnalyse.create({
        data: {
          documentId: document.id,

          // Classification
          typeDocument: metadata?.type_document || null,
          bcEntity: metadata?.bc_entity || null,
          categorie: metadata?.categorie || null,
          langue: metadata?.langue || null,
          pays: metadata?.pays || null,
          resume: metadata?.resume || null,

          // Données BC
          bcFields: business_central?.bc_fields || null,
          bcLines: business_central?.bc_lines || null,

          // Scores
          scoreOcr: scores?.score_ocr ?? null,
          scoreClassification: scores?.score_classification ?? null,
          scoreExtraction: scores?.score_extraction ?? null,
          scoreGlobal: scores?.score_global ?? null,

          // Validation
          statutValidation: validation?.statut || null,
          actionRecommandee: validation?.action || null,
          flags: pythonResult?.flags || [],
          warnings: pythonResult?.warnings || [],

          // OCR
          texteExtrait: ocr?.texte_extrait || null,
          methodeOcr: ocr?.methode || null,
          nbMots: ocr?.nb_mots || null,
        },
      });

      // Étape 4 : mettre à jour le statut
      const mapStatut = (statutPython) => {
        switch (statutPython) {
          case "VALIDE":
            return "VALIDE";
          case "EN_ATTENTE":
            return "TRAITEMENT";
          case "REJETE":
            return "REJETE";
          default:
            return "EN_COURS";
        }
      };

      const nouveauStatut = mapStatut(validation?.statut);
      const documentFinal = await prisma.document.update({
        where: { id: document.id },
        data: { statut: nouveauStatut },
        include: {
          user: {
            select: {
              id: true,
              nom: true,
              prenom: true,
              email: true,
              role: true,
            },
          },
        },
      });
      //  Log UPLOAD
      await auditService.logAction({
        userId,
        action: "UPLOAD",
        entityType: "Document",
        entityId: document.id,
        details: {
          fileName: file.originalname,
          fileSize: file.size,
          typeDocument: metadata?.type_document || null,
          statut: nouveauStatut,
        },
      });

      return { document: documentFinal, analyse };
    } catch (error) {
      console.error("Analyse échouée, suppression du document:", error.message);
      await this.deleteDocument(document.id).catch((e) =>
        console.error("Erreur suppression:", e.message),
      );
      throw new Error(`Analyse impossible : ${error.message}`);
    }
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
          },
        },
        analyse: {
          select: {
            typeDocument: true,
            bcEntity: true,
            scoreGlobal: true,
            statutValidation: true,
            categorie: true,
            bcFields: true,
            bcLines: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return documents;
  }

  // Récupérer que mes documents . apes login

  // async getMyDocuments(userId) {
  //   // pour tester le chargement
  //   // await new Promise(resolve => setTimeout(resolve, 5000));
  //   const documents = await prisma.document.findMany({
  //     where: { uploadedBy: userId },
  //     include: {
  //       user: {
  //         select: {
  //           id: true,
  //           nom: true,
  //           prenom: true,
  //           email: true,
  //           role: true,
  //         },
  //       },
  //     },
  //     orderBy: {
  //       createdAt: "desc",
  //     },
  //   });

  //   return documents;
  // }

  // document par id

  async getDocumentById(id) {
    //await new Promise(resolve => setTimeout(resolve, 5000));
    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
            role: true,
          },
        },
        analyse: true,
      },
    });

    return document;
  }

  // DELETE

  async deleteDocument(id) {
    try {
      // Récupérer le document
      const document = await prisma.document.findUnique({
        where: { id },
      });

      // Supprimer le fichier physique
      try {
        await fs.unlink(document.filePath);
        console.log("Fichier physique supprimé:", document.filePath);
      } catch (error) {
        console.error("Erreur suppression fichier:", error.message);
      }

      // Supprimer de la BDD
      await prisma.document.delete({
        where: { id },
      });

      return true;
    } catch (error) {
      throw new Error(`Erreur suppression document: ${error.message}`);
    }
  }

  /**
   * Récupère les documents d'un user avec un résumé de l'analyse
   */
  async getMyDocuments(userId) {
    return prisma.document.findMany({
      where: { uploadedBy: userId },
      include: {
        user: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
            role: true,
          },
        },
        analyse: {
          select: {
            typeDocument: true,
            bcEntity: true,
            scoreGlobal: true,
            statutValidation: true,
            categorie: true,
            bcFields: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async updateAnalyse(documentId, { bcFields, bcLines }) {
    const analyse = await prisma.documentAnalyse.update({
      where: { documentId },
      data: {
        bcFields: bcFields || undefined,

        bcLines: bcLines || undefined,
      },
    });
    return analyse;
  }

  // SPRINT 2  validation / rejet

  async validateDocument(documentId, { bcFields, bcLines, validatedBy }) {
    // Sauvegarder les corrections éventuelles
    await prisma.documentAnalyse.update({
      where: { documentId },
      data: {
        bcFields: bcFields || undefined,
        bcLines: bcLines || undefined,
        statutValidation: "VALIDE",
        actionRecommandee: null,
      },
    });

    // Mettre à jour le statut du document
    const document = await prisma.document.update({
      where: { id: documentId },
      data: { statut: "VALIDE" },
      include: {
        user: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
            role: true,
          },
        },
        analyse: true,
      },
    });
    // Log VALIDATE
    await auditService.logAction({
      userId: validatedBy,
      action: "VALIDATE",
      entityType: "Document",
      entityId: documentId,
      details: { ancienStatut: "TRAITEMENT", nouveauStatut: "VALIDE" },
    });

    return document;
  }

  async rejectDocument(documentId, { reason, rejectedBy }) {
    // Mettre à jour l'analyse avec le motif
    await prisma.documentAnalyse.update({
      where: { documentId },
      data: { statutValidation: "REJETE", commentaireRejet: reason || null },
    });

    // Mettre à jour le statut du document
    const document = await prisma.document.update({
      where: { id: documentId },
      data: { statut: "REJETE" },
      include: {
        user: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
            role: true,
          },
        },
        analyse: true,
      },
    });
    //  Log REJECT
  await auditService.logAction({
    userId: rejectedBy,
    action: 'REJECT',
    entityType: 'Document',
    entityId: documentId,
    details: { motif: reason },
  });

    return document;
  }

  async getDashboardStats() {
    // Compter par statut
    const parStatutRaw = await prisma.document.groupBy({
      by: ["statut"],
      _count: { statut: true },
    });

    // Compter par type de document
    const parTypeRaw = await prisma.documentAnalyse.groupBy({
      by: ["typeDocument"],
      _count: { typeDocument: true },
    });

    // 5 derniers documents
    const recents = await prisma.document.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { nom: true, prenom: true, email: true } },
        analyse: {
          select: {
            typeDocument: true,
            scoreGlobal: true,
            statutValidation: true,
            bcFields: true,
          },
        },
      },
    });

    // Transformer parStatut en objet simple
    const parStatut = {};
    for (let i = 0; i < parStatutRaw.length; i++) {
      const s = parStatutRaw[i];
      parStatut[s.statut] = s._count.statut;
    }

    // Calcul KPIs
    const total = Object.values(parStatut).reduce((a, b) => a + b, 0);
    const valides = parStatut["VALIDE"] || 0;
    const envoyeBC = parStatut["ENVOYE_BC"] || 0;
    const enCours = parStatut["EN_COURS"] || 0;
    const rejetes = parStatut["REJETE"] || 0;
    const tauxValidation = total > 0 ? Math.round((valides / total) * 100) : 0;

    // Transformer parType en tableau pour les graphiques
    const parType = parTypeRaw
      .filter((t) => t.typeDocument)
      .map((t) => ({
        name: t.typeDocument,
        value: t._count.typeDocument,
      }));

    return {
      kpis: {
        total,
        valides,
        envoyeBC,
        enCours,
        rejetes,
        tauxValidation,
      },
      parStatut,
      parType,
      recents,
    };
  }
}
module.exports = new DocumentService();

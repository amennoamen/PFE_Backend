const { prisma } = require('../config/database');

class AuditService {

  async logAction({ userId, action, entityType = null, entityId = null, details = null }) {
    try {
      await prisma.auditLog.create({
        data: {
          userId,
          action,
          entityType,
          entityId,
          details,
        },
      });
    } catch (error) {
      // Ne jamais bloquer l'action principale si le log échoue
      console.error('Audit log error:', error);
    }
  }

  async getAllLogs({ page = 1, limit = 20, userId, action, entityType, dateDebut, dateFin } = {}) {
    const where = {};

    if (userId) where.userId = userId;
    if (action) where.action = action;
    if (entityType) where.entityType = entityType;
    if (dateDebut || dateFin) {
      where.createdAt = {};
      if (dateDebut) where.createdAt.gte = new Date(dateDebut);
      if (dateFin) where.createdAt.lte = new Date(dateFin);
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: { id: true, nom: true, prenom: true, email: true, role: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      logs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getLogById(id) {
    return await prisma.auditLog.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, nom: true, prenom: true, email: true, role: true }
        }
      },
    });
  }
}

module.exports = new AuditService();
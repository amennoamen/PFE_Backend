const auditService = require('../services/audit.service');

class AuditController {

  // GET /api/audit
  async getAllLogs(req, res) {
    try {
      const { page, limit, userId, action, entityType, dateDebut, dateFin } = req.query;

      const result = await auditService.getAllLogs({
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
        userId,
        action,
        entityType,
        dateDebut,
        dateFin,
      });

      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // GET /api/audit/:id
  async getLogById(req, res) {
    try {
      const { id } = req.params;

      const log = await auditService.getLogById(id);

      if (!log) {
        return res.status(404).json({ error: 'Log introuvable' });
      }

      res.json(log);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new AuditController();
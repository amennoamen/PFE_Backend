const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:5001';

/**
 * Envoie un fichier au microservice Python et retourne le résultat complet
 * @param {string} filePath - chemin absolu du fichier sur le disque
 * @param {string} originalName - nom original du fichier
 * @returns {Promise<object>} résultat du microservice
 */
const analyzeDocument = async (filePath, originalName) => {
  const form = new FormData();
  form.append('file', fs.createReadStream(filePath), {
    filename: originalName,
    contentType: getContentType(originalName),
  });

  const response = await axios.post(`${PYTHON_SERVICE_URL}/upload`, form, {
    headers: {
      ...form.getHeaders(),
    },
    timeout: 120000, // 2 minutes — OCR + LLM peut être long
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
  });

  return response.data;
};

/**
 * Vérifie que le microservice Python est disponible
 * @returns {Promise<boolean>}
 */
const checkHealth = async () => {
  try {
    const response = await axios.get(`${PYTHON_SERVICE_URL}/health`, { timeout: 5000 });
    return response.data?.status === 'ok';
  } catch {
    return false;
  }
};

/**
 * Détermine le content-type selon l'extension
 */
const getContentType = (filename) => {
  const ext = path.extname(filename).toLowerCase();
  const types = {
    '.pdf':  'application/pdf',
    '.jpg':  'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png':  'image/png',
    '.jfif': 'image/jpeg',
  };
  return types[ext] || 'application/octet-stream';
};

module.exports = { analyzeDocument, checkHealth };
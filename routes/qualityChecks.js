const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const {
  getAllQualityChecks,
  getQualityCheckById,
  createQualityCheck,
  updateQualityCheck,
  deleteQualityCheck,
  getQualityChecksByResult,
  getRecentQualityChecks
} = require('../controllers/qualityChecks');

// GET /quality-checks - Get all quality checks with optional filters
router.get('/', isAuthenticated, getAllQualityChecks);

// GET /quality-checks/recent - Get recent quality checks
router.get('/recent', isAuthenticated, getRecentQualityChecks);

// GET /quality-checks/result/:result - Get quality checks by result
router.get('/result/:result', isAuthenticated, getQualityChecksByResult);

// GET /quality-checks/:id - Get quality check by ID
router.get('/:id', isAuthenticated, getQualityCheckById);

// POST /quality-checks - Create new quality check
router.post('/', isAuthenticated, createQualityCheck);

// PUT /quality-checks/:id - Update quality check
router.put('/:id', isAuthenticated, updateQualityCheck);

// DELETE /quality-checks/:id - Delete quality check
router.delete('/:id', isAuthenticated, deleteQualityCheck);

module.exports = router;
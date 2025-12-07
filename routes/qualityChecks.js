const express = require('express');
const router = express.Router();
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
router.get('/', getAllQualityChecks);

// GET /quality-checks/recent - Get recent quality checks
router.get('/recent', getRecentQualityChecks);

// GET /quality-checks/result/:result - Get quality checks by result
router.get('/result/:result', getQualityChecksByResult);

// GET /quality-checks/:id - Get quality check by ID
router.get('/:id', getQualityCheckById);

// POST /quality-checks - Create new quality check
router.post('/', createQualityCheck);

// PUT /quality-checks/:id - Update quality check
router.put('/:id', updateQualityCheck);

// DELETE /quality-checks/:id - Delete quality check
router.delete('/:id', deleteQualityCheck);

module.exports = router;
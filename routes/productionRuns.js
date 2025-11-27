const express = require('express');
const router = express.Router();
const ProductionRun = require('../models/productionRun');

/**
 * @swagger
 * components:
 *   schemas:
 *     ProductionRun:
 *       type: object
 *       required:
 *         - runId
 *         - machineId
 *         - partNumber
 *         - partName
 *         - targetQty
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated MongoDB ID
 *         runId:
 *           type: string
 *           description: Unique production run identifier
 *         machineId:
 *           type: string
 *           description: Reference to machine ID
 *         partNumber:
 *           type: string
 *           description: Part number being produced
 *         partName:
 *           type: string
 *           description: Part name/description
 *         targetQty:
 *           type: number
 *           description: Target production quantity
 *         actualQty:
 *           type: number
 *           description: Actual produced quantity
 *         status:
 *           type: string
 *           enum: [scheduled, running, completed, paused, cancelled]
 *           description: Production run status
 *         operator:
 *           type: string
 *           description: Machine operator name
 *       example:
 *         runId: "RUN-001"
 *         machineId: "507f1f77bcf86cd799439011"
 *         partNumber: "HOUSING-A"
 *         partName: "Main Housing Assembly"
 *         targetQty: 5000
 *         actualQty: 0
 *         status: "scheduled"
 *         operator: "John Smith"
 */

/**
 * @swagger
 * /production-runs:
 *   get:
 *     summary: Get all production runs
 *     tags: [Production Runs]
 *     responses:
 *       200:
 *         description: List of all production runs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ProductionRun'
 *       500:
 *         description: Server error
 */
router.get('/', async (req, res) => {
  try {
    const runs = await ProductionRun.find().populate('machineId');
    res.json(runs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /production-runs/{id}:
 *   get:
 *     summary: Get production run by ID
 *     tags: [Production Runs]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Production run ID
 *     responses:
 *       200:
 *         description: Production run data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProductionRun'
 *       404:
 *         description: Production run not found
 *       500:
 *         description: Server error
 */
router.get('/:id', async (req, res) => {
  try {
    const run = await ProductionRun.findById(req.params.id).populate('machineId');
    if (!run) {
      return res.status(404).json({ error: 'Production run not found' });
    }
    res.json(run);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /production-runs:
 *   post:
 *     summary: Create a new production run
 *     tags: [Production Runs]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductionRun'
 *     responses:
 *       201:
 *         description: Production run created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProductionRun'
 *       400:
 *         description: Bad request - validation error
 *       500:
 *         description: Server error
 */
router.post('/', async (req, res) => {
  try {
    const run = new ProductionRun(req.body);
    await run.save();
    await run.populate('machineId');
    res.status(201).json(run);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Run ID already exists' });
    }
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * /production-runs/{id}:
 *   put:
 *     summary: Update a production run
 *     tags: [Production Runs]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Production run ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductionRun'
 *     responses:
 *       200:
 *         description: Production run updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProductionRun'
 *       404:
 *         description: Production run not found
 *       400:
 *         description: Bad request
 */
router.put('/:id', async (req, res) => {
  try {
    const run = await ProductionRun.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('machineId');
    
    if (!run) {
      return res.status(404).json({ error: 'Production run not found' });
    }
    res.json(run);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * /production-runs/{id}:
 *   delete:
 *     summary: Delete a production run
 *     tags: [Production Runs]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Production run ID
 *     responses:
 *       200:
 *         description: Production run deleted successfully
 *       404:
 *         description: Production run not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', async (req, res) => {
  try {
    const run = await ProductionRun.findByIdAndDelete(req.params.id);
    if (!run) {
      return res.status(404).json({ error: 'Production run not found' });
    }
    res.json({ message: 'Production run deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
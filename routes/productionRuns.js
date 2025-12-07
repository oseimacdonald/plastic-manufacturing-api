const express = require('express');
const router = express.Router();
const ProductionRun = require('../models/productionRun');
const Machine = require('../models/machine');

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
 *         - material
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
 *           description: Reference to machine MongoDB ID
 *         partNumber:
 *           type: string
 *           description: Part number being produced
 *         partName:
 *           type: string
 *           description: Part name/description
 *         material:
 *           type: string
 *           description: Material used for production
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
 *         startTime:
 *           type: string
 *           format: date-time
 *           description: Production start time
 *         endTime:
 *           type: string
 *           format: date-time
 *           description: Production end time
 *         operator:
 *           type: string
 *           description: Machine operator name
 *       example:
 *         runId: "RUN-001"
 *         machineId: "507f1f77bcf86cd799439011"
 *         partNumber: "HOUSING-A"
 *         partName: "Main Housing Assembly"
 *         material: "ABS Plastic"
 *         targetQty: 5000
 *         actualQty: 0
 *         status: "scheduled"
 *         startTime: "2024-01-15T08:00:00Z"
 *         operator: "John Smith"
 */

/**
 * @swagger
 * /production-runs:
 *   get:
 *     summary: Get all production runs
 *     tags: [Production Runs]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [scheduled, running, completed, paused, cancelled]
 *         description: Filter by status
 *       - in: query
 *         name: machineId
 *         schema:
 *           type: string
 *         description: Filter by machine ID
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
    const filter = {};
    
    if (req.query.status) {
      filter.status = req.query.status;
    }
    
    if (req.query.machineId) {
      filter.machineId = req.query.machineId;
    }
    
    const runs = await ProductionRun.find(filter).populate('machineId');
    res.json(runs);
  } catch (error) {
    console.error('Error fetching production runs:', error);
    res.status(500).json({ 
      error: 'Failed to fetch production runs',
      message: error.message 
    });
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
 *         description: Production run MongoDB ID
 *     responses:
 *       200:
 *         description: Production run data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProductionRun'
 *       400:
 *         description: Invalid ID format
 *       404:
 *         description: Production run not found
 *       500:
 *         description: Server error
 */
router.get('/:id', async (req, res) => {
  try {
    // Validate MongoDB ID format
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        error: 'Invalid ID format',
        message: 'Please provide a valid MongoDB ID (24 character hex string)' 
      });
    }
    
    const run = await ProductionRun.findById(req.params.id).populate('machineId');
    if (!run) {
      return res.status(404).json({ 
        error: 'Production run not found',
        message: `No production run found with ID: ${req.params.id}` 
      });
    }
    
    res.json(run);
  } catch (error) {
    console.error('Error fetching production run:', error);
    res.status(500).json({ 
      error: 'Failed to fetch production run',
      message: error.message 
    });
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
 *       404:
 *         description: Referenced machine not found
 *       500:
 *         description: Server error
 */
router.post('/', async (req, res) => {
  try {
    // Validate required fields
    const { runId, machineId, partNumber, partName, material, targetQty } = req.body;
    
    const requiredFields = ['runId', 'machineId', 'partNumber', 'partName', 'material', 'targetQty'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        missing: missingFields,
        required: requiredFields
      });
    }
    
    // Validate runId format
    const runIdRegex = /^[A-Z0-9-]+$/;
    if (!runIdRegex.test(runId)) {
      return res.status(400).json({ 
        error: 'Invalid run ID format',
        message: 'Run ID must contain only uppercase letters, numbers, and hyphens'
      });
    }
    
    // Validate machineId exists
    const machineExists = await Machine.findById(machineId);
    if (!machineExists) {
      return res.status(404).json({ 
        error: 'Machine not found',
        message: `No machine found with ID: ${machineId}`
      });
    }
    
    // Validate partNumber and partName length
    if (partNumber.length < 2) {
      return res.status(400).json({ 
        error: 'Invalid part number',
        message: 'Part number must be at least 2 characters long'
      });
    }
    
    if (partName.length < 2) {
      return res.status(400).json({ 
        error: 'Invalid part name',
        message: 'Part name must be at least 2 characters long'
      });
    }
    
    // Validate material
    if (material.length < 2) {
      return res.status(400).json({ 
        error: 'Invalid material',
        message: 'Material must be at least 2 characters long'
      });
    }
    
    // Validate targetQty
    if (isNaN(targetQty) || targetQty <= 0) {
      return res.status(400).json({ 
        error: 'Invalid target quantity',
        message: 'Target quantity must be a positive number'
      });
    }
    
    // Validate actualQty if provided
    if (req.body.actualQty && (isNaN(req.body.actualQty) || req.body.actualQty < 0)) {
      return res.status(400).json({ 
        error: 'Invalid actual quantity',
        message: 'Actual quantity must be a non-negative number'
      });
    }
    
    // Validate status if provided
    if (req.body.status && !['scheduled', 'running', 'completed', 'paused', 'cancelled'].includes(req.body.status)) {
      return res.status(400).json({ 
        error: 'Invalid status',
        message: 'Status must be one of: scheduled, running, completed, paused, cancelled'
      });
    }
    
    const run = new ProductionRun(req.body);
    await run.save();
    await run.populate('machineId');
    
    res.status(201).json(run);
  } catch (error) {
    console.error('Error creating production run:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        error: 'Duplicate entry',
        message: 'Run ID already exists',
        field: error.keyValue
      });
    }
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: Object.values(error.errors).map(err => ({
          field: err.path,
          message: err.message
        }))
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to create production run',
      message: error.message 
    });
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
 *         description: Production run MongoDB ID
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
 *       400:
 *         description: Bad request - validation error
 *       404:
 *         description: Production run not found
 *       500:
 *         description: Server error
 */
router.put('/:id', async (req, res) => {
  try {
    // Validate MongoDB ID format
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        error: 'Invalid ID format',
        message: 'Please provide a valid MongoDB ID (24 character hex string)' 
      });
    }
    
    // Validate request body is not empty
    if (Object.keys(req.body).length === 0) {
      return res.status(400).json({ 
        error: 'Empty request body',
        message: 'No data provided for update' 
      });
    }
    
    // Validate runId format if being updated
    if (req.body.runId) {
      const runIdRegex = /^[A-Z0-9-]+$/;
      if (!runIdRegex.test(req.body.runId)) {
        return res.status(400).json({ 
          error: 'Invalid run ID format',
          message: 'Run ID must contain only uppercase letters, numbers, and hyphens'
        });
      }
    }
    
    // Validate machineId exists if being updated
    if (req.body.machineId) {
      const machineExists = await Machine.findById(req.body.machineId);
      if (!machineExists) {
        return res.status(404).json({ 
          error: 'Machine not found',
          message: `No machine found with ID: ${req.body.machineId}`
        });
      }
    }
    
    // Validate partNumber if being updated
    if (req.body.partNumber && req.body.partNumber.length < 2) {
      return res.status(400).json({ 
        error: 'Invalid part number',
        message: 'Part number must be at least 2 characters long'
      });
    }
    
    // Validate partName if being updated
    if (req.body.partName && req.body.partName.length < 2) {
      return res.status(400).json({ 
        error: 'Invalid part name',
        message: 'Part name must be at least 2 characters long'
      });
    }
    
    // Validate material if being updated
    if (req.body.material && req.body.material.length < 2) {
      return res.status(400).json({ 
        error: 'Invalid material',
        message: 'Material must be at least 2 characters long'
      });
    }
    
    // Validate targetQty if being updated
    if (req.body.targetQty && (isNaN(req.body.targetQty) || req.body.targetQty <= 0)) {
      return res.status(400).json({ 
        error: 'Invalid target quantity',
        message: 'Target quantity must be a positive number'
      });
    }
    
    // Validate actualQty if being updated
    if (req.body.actualQty && (isNaN(req.body.actualQty) || req.body.actualQty < 0)) {
      return res.status(400).json({ 
        error: 'Invalid actual quantity',
        message: 'Actual quantity must be a non-negative number'
      });
    }
    
    // Validate status if provided
    if (req.body.status && !['scheduled', 'running', 'completed', 'paused', 'cancelled'].includes(req.body.status)) {
      return res.status(400).json({ 
        error: 'Invalid status',
        message: 'Status must be one of: scheduled, running, completed, paused, cancelled'
      });
    }
    
    const run = await ProductionRun.findByIdAndUpdate(
      req.params.id,
      req.body,
      { 
        new: true, 
        runValidators: true,
        context: 'query'
      }
    ).populate('machineId');
    
    if (!run) {
      return res.status(404).json({ 
        error: 'Production run not found',
        message: `No production run found with ID: ${req.params.id}` 
      });
    }
    
    res.json(run);
  } catch (error) {
    console.error('Error updating production run:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        error: 'Duplicate entry',
        message: 'Run ID already exists',
        field: error.keyValue
      });
    }
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: Object.values(error.errors).map(err => ({
          field: err.path,
          message: err.message
        }))
      });
    }
    
    res.status(400).json({ 
      error: 'Failed to update production run',
      message: error.message 
    });
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
 *         description: Production run MongoDB ID
 *     responses:
 *       200:
 *         description: Production run deleted successfully
 *       400:
 *         description: Invalid ID format
 *       404:
 *         description: Production run not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', async (req, res) => {
  try {
    // Validate MongoDB ID format
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        error: 'Invalid ID format',
        message: 'Please provide a valid MongoDB ID (24 character hex string)' 
      });
    }
    
    const run = await ProductionRun.findByIdAndDelete(req.params.id);
    if (!run) {
      return res.status(404).json({ 
        error: 'Production run not found',
        message: `No production run found with ID: ${req.params.id}` 
      });
    }
    
    res.json({ 
      message: 'Production run deleted successfully',
      deletedRun: {
        id: run._id,
        runId: run.runId,
        partName: run.partName,
        partNumber: run.partNumber
      }
    });
  } catch (error) {
    console.error('Error deleting production run:', error);
    res.status(500).json({ 
      error: 'Failed to delete production run',
      message: error.message 
    });
  }
});

module.exports = router;
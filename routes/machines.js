const express = require('express');
const router = express.Router();
const Machine = require('../models/machine');

/**
 * @swagger
 * components:
 *   schemas:
 *     Machine:
 *       type: object
 *       required:
 *         - machineId
 *         - name
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated MongoDB ID
 *         machineId:
 *           type: string
 *           description: Unique machine identifier
 *         name:
 *           type: string
 *           description: Machine name and model
 *         status:
 *           type: string
 *           enum: [operational, maintenance, down, idle]
 *           default: operational
 *           description: Current machine status
 *         location:
 *           type: string
 *           description: Physical location of the machine
 *         manufacturer:
 *           type: string
 *           description: Machine manufacturer
 *         installationDate:
 *           type: string
 *           format: date
 *           description: Date when machine was installed
 *         lastMaintenance:
 *           type: string
 *           format: date
 *           description: Date of last maintenance
 *         nextMaintenance:
 *           type: string
 *           format: date
 *           description: Scheduled next maintenance date
 *         operatorNotes:
 *           type: string
 *           maxLength: 500
 *           description: Additional operator notes
 *       example:
 *         machineId: "IM-001"
 *         name: "Toshiba 350T"
 *         status: "operational"
 *         location: "Production Line A"
 *         manufacturer: "Toshiba"
 *         installationDate: "2023-01-15"
 *         lastMaintenance: "2024-03-01"
 *         nextMaintenance: "2024-06-01"
 *         operatorNotes: "Running smoothly"
 */

/**
 * @swagger
 * /machines:
 *   get:
 *     summary: Get all machines
 *     tags: [Machines]
 *     responses:
 *       200:
 *         description: List of all machines
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Machine'
 *       500:
 *         description: Server error
 */
router.get('/', async (req, res) => {
  try {
    const machines = await Machine.find();
    res.status(200).json(machines);
  } catch (error) {
    console.error('Error fetching machines:', error);
    res.status(500).json({ 
      error: 'Failed to fetch machines',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /machines/{id}:
 *   get:
 *     summary: Get machine by ID
 *     tags: [Machines]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Machine MongoDB ID
 *     responses:
 *       200:
 *         description: Machine data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Machine'
 *       400:
 *         description: Invalid ID format
 *       404:
 *         description: Machine not found
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
    
    const machine = await Machine.findById(req.params.id);
    if (!machine) {
      return res.status(404).json({ 
        error: 'Machine not found',
        message: `No machine found with ID: ${req.params.id}` 
      });
    }
    res.status(200).json(machine);
  } catch (error) {
    console.error('Error fetching machine:', error);
    res.status(500).json({ 
      error: 'Failed to fetch machine',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /machines:
 *   post:
 *     summary: Create a new machine
 *     tags: [Machines]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Machine'
 *     responses:
 *       201:
 *         description: Machine created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Machine'
 *       400:
 *         description: Bad request - validation error
 *       500:
 *         description: Server error
 */
router.post('/', async (req, res) => {
  try {
    const { machineId, name } = req.body;
    
    // Validate required fields
    if (!machineId || !name) {
      const missingFields = [];
      if (!machineId) missingFields.push('machineId');
      if (!name) missingFields.push('name');
      
      return res.status(400).json({ 
        error: 'Missing required fields',
        missing: missingFields,
        required: ['machineId', 'name'],
        received: { machineId, name }
      });
    }
    
    // Validate machineId format (alphanumeric with hyphens)
    const machineIdRegex = /^[A-Z0-9-]+$/;
    if (!machineIdRegex.test(machineId)) {
      return res.status(400).json({ 
        error: 'Invalid machine ID format',
        message: 'Machine ID must contain only uppercase letters, numbers, and hyphens'
      });
    }
    
    // Validate name length
    if (name.length < 2) {
      return res.status(400).json({ 
        error: 'Invalid machine name',
        message: 'Machine name must be at least 2 characters long'
      });
    }
    
    // Validate status if provided
    if (req.body.status && !['operational', 'maintenance', 'down', 'idle'].includes(req.body.status)) {
      return res.status(400).json({ 
        error: 'Invalid status',
        message: 'Status must be one of: operational, maintenance, down, idle'
      });
    }
    
    const machine = new Machine(req.body);
    await machine.save();
    res.status(201).json(machine);
  } catch (error) {
    console.error('Error creating machine:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        error: 'Duplicate entry',
        message: 'Machine ID already exists',
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
      error: 'Failed to create machine',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /machines/{id}:
 *   put:
 *     summary: Update a machine
 *     tags: [Machines]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Machine MongoDB ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Machine'
 *     responses:
 *       200:
 *         description: Machine updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Machine'
 *       400:
 *         description: Bad request - validation error
 *       404:
 *         description: Machine not found
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
    
    // Validate machineId format if being updated
    if (req.body.machineId) {
      const machineIdRegex = /^[A-Z0-9-]+$/;
      if (!machineIdRegex.test(req.body.machineId)) {
        return res.status(400).json({ 
          error: 'Invalid machine ID format',
          message: 'Machine ID must contain only uppercase letters, numbers, and hyphens'
        });
      }
    }
    
    // Validate name if being updated
    if (req.body.name && req.body.name.length < 2) {
      return res.status(400).json({ 
        error: 'Invalid machine name',
        message: 'Machine name must be at least 2 characters long'
      });
    }
    
    // Validate status if provided
    if (req.body.status && !['operational', 'maintenance', 'down', 'idle'].includes(req.body.status)) {
      return res.status(400).json({ 
        error: 'Invalid status',
        message: 'Status must be one of: operational, maintenance, down, idle'
      });
    }
    
    const machine = await Machine.findByIdAndUpdate(
      req.params.id,
      req.body,
      { 
        new: true, 
        runValidators: true,
        context: 'query'
      }
    );
    
    if (!machine) {
      return res.status(404).json({ 
        error: 'Machine not found',
        message: `No machine found with ID: ${req.params.id}` 
      });
    }
    
    res.status(200).json(machine);
  } catch (error) {
    console.error('Error updating machine:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        error: 'Duplicate entry',
        message: 'Machine ID already exists',
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
      error: 'Failed to update machine',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /machines/{id}:
 *   delete:
 *     summary: Delete a machine
 *     tags: [Machines]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Machine MongoDB ID
 *     responses:
 *       200:
 *         description: Machine deleted successfully
 *       400:
 *         description: Invalid ID format
 *       404:
 *         description: Machine not found
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
    
    const machine = await Machine.findByIdAndDelete(req.params.id);
    
    if (!machine) {
      return res.status(404).json({ 
        error: 'Machine not found',
        message: `No machine found with ID: ${req.params.id}` 
      });
    }
    
    res.status(200).json({ 
      message: 'Machine deleted successfully',
      deletedMachine: {
        id: machine._id,
        machineId: machine.machineId,
        name: machine.name
      }
    });
  } catch (error) {
    console.error('Error deleting machine:', error);
    res.status(500).json({ 
      error: 'Failed to delete machine',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
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
 *           description: Current machine status
 *       example:
 *         machineId: "IM-001"
 *         name: "Toshiba 350T"
 *         status: "operational"
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
    res.json(machines);
  } catch (error) {
    res.status(500).json({ error: error.message });
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
 *         description: Machine ID
 *     responses:
 *       200:
 *         description: Machine data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Machine'
 *       404:
 *         description: Machine not found
 *       500:
 *         description: Server error
 */
router.get('/:id', async (req, res) => {
  try {
    const machine = await Machine.findById(req.params.id);
    if (!machine) {
      return res.status(404).json({ error: 'Machine not found' });
    }
    res.json(machine);
  } catch (error) {
    res.status(500).json({ error: error.message });
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
    const machine = new Machine(req.body);
    await machine.save();
    res.status(201).json(machine);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Machine ID already exists' });
    }
    res.status(400).json({ error: error.message });
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
 *         description: Machine ID
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
 *       404:
 *         description: Machine not found
 *       400:
 *         description: Bad request
 */
router.put('/:id', async (req, res) => {
  try {
    const machine = await Machine.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!machine) {
      return res.status(404).json({ error: 'Machine not found' });
    }
    res.json(machine);
  } catch (error) {
    res.status(400).json({ error: error.message });
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
 *         description: Machine ID
 *     responses:
 *       200:
 *         description: Machine deleted successfully
 *       404:
 *         description: Machine not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', async (req, res) => {
  try {
    const machine = await Machine.findByIdAndDelete(req.params.id);
    if (!machine) {
      return res.status(404).json({ error: 'Machine not found' });
    }
    res.json({ message: 'Machine deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 
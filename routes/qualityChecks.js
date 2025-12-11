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

/**
 * @swagger
 * components:
 *   schemas:
 *     QualityCheck:
 *       type: object
 *       required:
 *         - checkId
 *         - productionRunId
 *         - machineId
 *         - employeeId
 *         - checkType
 *         - result
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated MongoDB ID
 *         checkId:
 *           type: string
 *           description: Unique quality check identifier
 *         productionRunId:
 *           type: string
 *           description: Reference to production run
 *         machineId:
 *           type: string
 *           description: Reference to machine
 *         employeeId:
 *           type: string
 *           description: ID of employee performing check
 *         checkDate:
 *           type: string
 *           format: date-time
 *           description: Date and time of check
 *         checkType:
 *           type: string
 *           enum: ['Visual', 'Measurement', 'Weight', 'Dimensional', 'Packaging', 'Material']
 *           description: Type of quality check
 *         result:
 *           type: string
 *           enum: ['Pass', 'Fail', 'Rework', 'Hold']
 *           description: Result of quality check
 *         measurements:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               parameter:
 *                 type: string
 *               value:
 *                 type: number
 *               unit:
 *                 type: string
 *               tolerance:
 *                 type: string
 *               actualValue:
 *                 type: number
 *               status:
 *                 type: string
 *                 enum: ['Within', 'Out of Spec']
 *         notes:
 *           type: string
 *           maxLength: 500
 *         defectsFound:
 *           type: number
 *           minimum: 0
 *         correctiveAction:
 *           type: string
 *           maxLength: 500
 *         nextCheckDate:
 *           type: string
 *           format: date
 *       example:
 *         checkId: "QC-2023-001"
 *         productionRunId: "65a1b2c3d4e5f67890123456"
 *         machineId: "65a1b2c3d4e5f67890123457"
 *         employeeId: "65a1b2c3d4e5f67890123458"
 *         checkDate: "2023-10-15T14:30:00Z"
 *         checkType: "Visual"
 *         result: "Pass"
 *         measurements: []
 *         notes: "All parameters within specification"
 *         defectsFound: 0
 *         correctiveAction: "None required"
 *         nextCheckDate: "2023-11-15"
 */

/**
 * @swagger
 * tags:
 *   name: Quality Checks
 *   description: Quality check management endpoints
 */

/**
 * @swagger
 * /quality-checks:
 *   get:
 *     summary: Get all quality checks with optional filters
 *     tags: [Quality Checks]
 *     security:
 *       - OAuth2: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by start date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by end date
 *       - in: query
 *         name: result
 *         schema:
 *           type: string
 *           enum: [Pass, Fail, Rework, Hold]
 *         description: Filter by result
 *       - in: query
 *         name: checkType
 *         schema:
 *           type: string
 *           enum: [Visual, Measurement, Weight, Dimensional, Packaging, Material]
 *         description: Filter by check type
 *     responses:
 *       200:
 *         description: List of quality checks
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/QualityCheck'
 *       401:
 *         description: Unauthorized - Authentication required
 *       500:
 *         description: Server error
 */
router.get('/', isAuthenticated, getAllQualityChecks);

/**
 * @swagger
 * /quality-checks/recent:
 *   get:
 *     summary: Get recent quality checks
 *     tags: [Quality Checks]
 *     security:
 *       - OAuth2: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of recent checks to return
 *     responses:
 *       200:
 *         description: List of recent quality checks
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/QualityCheck'
 *       401:
 *         description: Unauthorized - Authentication required
 *       500:
 *         description: Server error
 */
router.get('/recent', isAuthenticated, getRecentQualityChecks);

/**
 * @swagger
 * /quality-checks/result/{result}:
 *   get:
 *     summary: Get quality checks by result
 *     tags: [Quality Checks]
 *     security:
 *       - OAuth2: []
 *     parameters:
 *       - in: path
 *         name: result
 *         required: true
 *         schema:
 *           type: string
 *           enum: [Pass, Fail, Rework, Hold]
 *         description: Result to filter by
 *     responses:
 *       200:
 *         description: List of quality checks with specified result
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/QualityCheck'
 *       401:
 *         description: Unauthorized - Authentication required
 *       400:
 *         description: Invalid result parameter
 *       500:
 *         description: Server error
 */
router.get('/result/:result', isAuthenticated, getQualityChecksByResult);

/**
 * @swagger
 * /quality-checks/{id}:
 *   get:
 *     summary: Get quality check by ID
 *     tags: [Quality Checks]
 *     security:
 *       - OAuth2: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Quality check ID
 *     responses:
 *       200:
 *         description: Quality check data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/QualityCheck'
 *       401:
 *         description: Unauthorized - Authentication required
 *       404:
 *         description: Quality check not found
 *       500:
 *         description: Server error
 */
router.get('/:id', isAuthenticated, getQualityCheckById);

/**
 * @swagger
 * /quality-checks:
 *   post:
 *     summary: Create new quality check
 *     tags: [Quality Checks]
 *     security:
 *       - OAuth2: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/QualityCheck'
 *     responses:
 *       201:
 *         description: Quality check created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/QualityCheck'
 *       400:
 *         description: Bad request - validation error
 *       401:
 *         description: Unauthorized - Authentication required
 *       500:
 *         description: Server error
 */
router.post('/', isAuthenticated, createQualityCheck);

/**
 * @swagger
 * /quality-checks/{id}:
 *   put:
 *     summary: Update quality check
 *     tags: [Quality Checks]
 *     security:
 *       - OAuth2: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Quality check ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/QualityCheck'
 *     responses:
 *       200:
 *         description: Quality check updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/QualityCheck'
 *       400:
 *         description: Bad request - validation error
 *       401:
 *         description: Unauthorized - Authentication required
 *       404:
 *         description: Quality check not found
 *       500:
 *         description: Server error
 */
router.put('/:id', isAuthenticated, updateQualityCheck);

/**
 * @swagger
 * /quality-checks/{id}:
 *   delete:
 *     summary: Delete quality check
 *     tags: [Quality Checks]
 *     security:
 *       - OAuth2: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Quality check ID
 *     responses:
 *       200:
 *         description: Quality check deleted successfully
 *       401:
 *         description: Unauthorized - Authentication required
 *       404:
 *         description: Quality check not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', isAuthenticated, deleteQualityCheck);

module.exports = router;
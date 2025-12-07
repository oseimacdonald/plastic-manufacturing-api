const express = require('express');
const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Employee:
 *       type: object
 *       required:
 *         - employeeId
 *         - name
 *         - email
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated MongoDB ID
 *         employeeId:
 *           type: string
 *           description: Unique employee identifier
 *         name:
 *           type: string
 *           description: Employee full name
 *         email:
 *           type: string
 *           description: Employee email
 *         department:
 *           type: string
 *           description: Department name
 *         position:
 *           type: string
 *           description: Job position
 *         hireDate:
 *           type: string
 *           format: date
 *           description: Hire date
 *         status:
 *           type: string
 *           enum: [active, on_leave, terminated]
 *           default: active
 *           description: Employment status
 *       example:
 *         employeeId: "EMP-001"
 *         name: "John Doe"
 *         email: "john.doe@company.com"
 *         department: "Production"
 *         position: "Machine Operator"
 *         hireDate: "2023-01-15"
 *         status: "active"
 */

// In-memory data store for testing (replace with MongoDB model later)
let employees = [
  {
    id: '1',
    employeeId: 'EMP-001',
    name: 'John Doe',
    email: 'john@example.com',
    department: 'Production',
    position: 'Operator',
    hireDate: '2023-01-15',
    status: 'active'
  },
  {
    id: '2',
    employeeId: 'EMP-002',
    name: 'Jane Smith',
    email: 'jane@example.com',
    department: 'Quality',
    position: 'Inspector',
    hireDate: '2023-02-20',
    status: 'active'
  },
  {
    id: '3',
    employeeId: 'EMP-003',
    name: 'Bob Johnson',
    email: 'bob@example.com',
    department: 'Maintenance',
    position: 'Technician',
    hireDate: '2022-11-10',
    status: 'on_leave'
  }
];

/**
 * @swagger
 * /employees:
 *   get:
 *     summary: Get all employees
 *     tags: [Employees]
 *     responses:
 *       200:
 *         description: List of all employees
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Employee'
 *       500:
 *         description: Server error
 */
router.get('/', async (req, res) => {
  try {
    res.json(employees);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ 
      error: 'Failed to fetch employees',
      message: error.message 
    });
  }
});

/**
 * @swagger
 * /employees/active:
 *   get:
 *     summary: Get active employees
 *     tags: [Employees]
 *     responses:
 *       200:
 *         description: List of active employees
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Employee'
 *       500:
 *         description: Server error
 */
router.get('/active', async (req, res) => {
  try {
    const activeEmployees = employees.filter(emp => emp.status === 'active');
    res.json(activeEmployees);
  } catch (error) {
    console.error('Error fetching active employees:', error);
    res.status(500).json({ 
      error: 'Failed to fetch active employees',
      message: error.message 
    });
  }
});

/**
 * @swagger
 * /employees/{id}:
 *   get:
 *     summary: Get employee by ID
 *     tags: [Employees]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Employee ID or employeeId
 *     responses:
 *       200:
 *         description: Employee data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Employee'
 *       400:
 *         description: Invalid ID
 *       404:
 *         description: Employee not found
 *       500:
 *         description: Server error
 */
router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    
    // Check for empty ID
    if (!id || id.trim() === '') {
      return res.status(400).json({ 
        error: 'Invalid ID',
        message: 'Employee ID cannot be empty' 
      });
    }
    
    // Find employee by ID or employeeId
    const employee = employees.find(emp => 
      emp.id === id || emp.employeeId === id
    );
    
    if (!employee) {
      return res.status(404).json({ 
        error: 'Employee not found',
        message: `No employee found with ID: ${id}` 
      });
    }
    
    res.json(employee);
  } catch (error) {
    console.error('Error fetching employee:', error);
    res.status(500).json({ 
      error: 'Failed to fetch employee',
      message: error.message 
    });
  }
});

/**
 * @swagger
 * /employees:
 *   post:
 *     summary: Create a new employee
 *     tags: [Employees]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Employee'
 *     responses:
 *       201:
 *         description: Employee created successfully
 *       400:
 *         description: Bad request - validation error
 *       500:
 *         description: Server error
 */
router.post('/', async (req, res) => {
  try {
    const { employeeId, name, email } = req.body;
    
    // Validate required fields
    if (!employeeId || !name || !email) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['employeeId', 'name', 'email'],
        received: { employeeId, name, email }
      });
    }
    
    // Check if employeeId already exists
    const existingEmployee = employees.find(emp => emp.employeeId === employeeId);
    if (existingEmployee) {
      return res.status(400).json({ 
        error: 'Duplicate employee ID',
        message: `Employee with ID ${employeeId} already exists` 
      });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: 'Invalid email format',
        message: 'Please provide a valid email address' 
      });
    }
    
    // Validate status if provided
    if (req.body.status && !['active', 'on_leave', 'terminated'].includes(req.body.status)) {
      return res.status(400).json({ 
        error: 'Invalid status',
        message: 'Status must be one of: active, on_leave, terminated' 
      });
    }
    
    // Create new employee
    const newEmployee = {
      id: (employees.length + 1).toString(),
      employeeId,
      name,
      email,
      department: req.body.department || '',
      position: req.body.position || '',
      hireDate: req.body.hireDate || new Date().toISOString().split('T')[0],
      status: req.body.status || 'active'
    };
    
    employees.push(newEmployee);
    
    res.status(201).json(newEmployee);
  } catch (error) {
    console.error('Error creating employee:', error);
    res.status(500).json({ 
      error: 'Failed to create employee',
      message: error.message 
    });
  }
});

module.exports = router;
const Employee = require('../models/employee');

// Get all employees
const getAllEmployees = async (req, res) => {
  try {
    const employees = await Employee.find()
      .populate('assignedMachine', 'name machineId status')
      .sort({ lastName: 1, firstName: 1 });
    res.status(200).json(employees);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
};

// Get employee by ID
const getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id)
      .populate('assignedMachine', 'name machineId status');
    
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    res.status(200).json(employee);
  } catch (error) {
    console.error('Error fetching employee:', error);
    res.status(500).json({ error: 'Failed to fetch employee' });
  }
};

// Create new employee
const createEmployee = async (req, res) => {
  try {
    const employee = new Employee(req.body);
    await employee.save();
    res.status(201).json(employee);
  } catch (error) {
    console.error('Error creating employee:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        error: 'Duplicate entry', 
        message: 'Employee ID or email already exists' 
      });
    }
    
    res.status(500).json({ error: 'Failed to create employee' });
  }
};

// Update employee
const updateEmployee = async (req, res) => {
  try {
    const updates = req.body;
    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('assignedMachine', 'name machineId status');
    
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    res.status(200).json(employee);
  } catch (error) {
    console.error('Error updating employee:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        error: 'Duplicate entry', 
        message: 'Employee ID or email already exists' 
      });
    }
    
    res.status(500).json({ error: 'Failed to update employee' });
  }
};

// Delete employee
const deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);
    
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    res.status(200).json({ 
      message: 'Employee deleted successfully',
      deletedEmployee: employee 
    });
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({ error: 'Failed to delete employee' });
  }
};

// Get employees by department
const getEmployeesByDepartment = async (req, res) => {
  try {
    const { department } = req.params;
    const employees = await Employee.find({ department })
      .populate('assignedMachine', 'name machineId status')
      .sort({ lastName: 1 });
    
    res.status(200).json(employees);
  } catch (error) {
    console.error('Error fetching employees by department:', error);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
};

// Get active employees
const getActiveEmployees = async (req, res) => {
  try {
    const employees = await Employee.find({ active: true })
      .populate('assignedMachine', 'name machineId status')
      .sort({ lastName: 1, firstName: 1 });
    
    res.status(200).json(employees);
  } catch (error) {
    console.error('Error fetching active employees:', error);
    res.status(500).json({ error: 'Failed to fetch active employees' });
  }
};

module.exports = {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployeesByDepartment,
  getActiveEmployees
};
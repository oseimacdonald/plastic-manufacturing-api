const QualityCheck = require('../models/qualityCheck');
const ProductionRun = require('../models/productionRun');
const Machine = require('../models/machine');
const Employee = require('../models/employee');

// Get all quality checks
const getAllQualityChecks = async (req, res) => {
  try {
    const { startDate, endDate, result, checkType } = req.query;
    let filter = {};
    
    if (startDate || endDate) {
      filter.checkDate = {};
      if (startDate) filter.checkDate.$gte = new Date(startDate);
      if (endDate) filter.checkDate.$lte = new Date(endDate);
    }
    
    if (result) filter.result = result;
    if (checkType) filter.checkType = checkType;
    
    const qualityChecks = await QualityCheck.find(filter)
      .populate('productionRunId', 'runId partName partNumber')
      .populate('machineId', 'name machineId')
      .populate('employeeId', 'firstName lastName employeeId')
      .sort({ checkDate: -1 });
    
    res.status(200).json(qualityChecks);
  } catch (error) {
    console.error('Error fetching quality checks:', error);
    res.status(500).json({ error: 'Failed to fetch quality checks' });
  }
};

// Get quality check by ID
const getQualityCheckById = async (req, res) => {
  try {
    const qualityCheck = await QualityCheck.findById(req.params.id)
      .populate('productionRunId', 'runId partName partNumber targetQty actualQty')
      .populate('machineId', 'name machineId model status')
      .populate('employeeId', 'firstName lastName employeeId department');
    
    if (!qualityCheck) {
      return res.status(404).json({ error: 'Quality check not found' });
    }
    
    res.status(200).json(qualityCheck);
  } catch (error) {
    console.error('Error fetching quality check:', error);
    res.status(500).json({ error: 'Failed to fetch quality check' });
  }
};

// Create new quality check
const createQualityCheck = async (req, res) => {
  try {
    // Validate referenced documents exist
    const [productionRun, machine, employee] = await Promise.all([
      ProductionRun.findById(req.body.productionRunId),
      Machine.findById(req.body.machineId),
      Employee.findById(req.body.employeeId)
    ]);
    
    if (!productionRun) {
      return res.status(400).json({ error: 'Invalid production run ID' });
    }
    
    if (!machine) {
      return res.status(400).json({ error: 'Invalid machine ID' });
    }
    
    if (!employee) {
      return res.status(400).json({ error: 'Invalid employee ID' });
    }
    
    const qualityCheck = new QualityCheck(req.body);
    await qualityCheck.save();
    
    // Populate references before returning
    const populatedCheck = await QualityCheck.findById(qualityCheck._id)
      .populate('productionRunId', 'runId partName')
      .populate('machineId', 'name machineId')
      .populate('employeeId', 'firstName lastName');
    
    res.status(201).json(populatedCheck);
  } catch (error) {
    console.error('Error creating quality check:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        error: 'Duplicate entry', 
        message: 'Check ID already exists' 
      });
    }
    
    res.status(500).json({ error: 'Failed to create quality check' });
  }
};

// Update quality check
const updateQualityCheck = async (req, res) => {
  try {
    const updates = req.body;
    
    // Validate referenced documents if provided
    if (updates.productionRunId) {
      const productionRun = await ProductionRun.findById(updates.productionRunId);
      if (!productionRun) {
        return res.status(400).json({ error: 'Invalid production run ID' });
      }
    }
    
    if (updates.machineId) {
      const machine = await Machine.findById(updates.machineId);
      if (!machine) {
        return res.status(400).json({ error: 'Invalid machine ID' });
      }
    }
    
    if (updates.employeeId) {
      const employee = await Employee.findById(updates.employeeId);
      if (!employee) {
        return res.status(400).json({ error: 'Invalid employee ID' });
      }
    }
    
    const qualityCheck = await QualityCheck.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    )
      .populate('productionRunId', 'runId partName')
      .populate('machineId', 'name machineId')
      .populate('employeeId', 'firstName lastName');
    
    if (!qualityCheck) {
      return res.status(404).json({ error: 'Quality check not found' });
    }
    
    res.status(200).json(qualityCheck);
  } catch (error) {
    console.error('Error updating quality check:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        error: 'Duplicate entry', 
        message: 'Check ID already exists' 
      });
    }
    
    res.status(500).json({ error: 'Failed to update quality check' });
  }
};

// Delete quality check
const deleteQualityCheck = async (req, res) => {
  try {
    const qualityCheck = await QualityCheck.findByIdAndDelete(req.params.id);
    
    if (!qualityCheck) {
      return res.status(404).json({ error: 'Quality check not found' });
    }
    
    res.status(200).json({ 
      message: 'Quality check deleted successfully',
      deletedCheck: qualityCheck 
    });
  } catch (error) {
    console.error('Error deleting quality check:', error);
    res.status(500).json({ error: 'Failed to delete quality check' });
  }
};

// Get quality checks by result
const getQualityChecksByResult = async (req, res) => {
  try {
    const { result } = req.params;
    const qualityChecks = await QualityCheck.find({ result })
      .populate('productionRunId', 'runId partName')
      .populate('machineId', 'name machineId')
      .populate('employeeId', 'firstName lastName')
      .sort({ checkDate: -1 });
    
    res.status(200).json(qualityChecks);
  } catch (error) {
    console.error('Error fetching quality checks by result:', error);
    res.status(500).json({ error: 'Failed to fetch quality checks' });
  }
};

// Get recent quality checks
const getRecentQualityChecks = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const qualityChecks = await QualityCheck.find()
      .populate('productionRunId', 'runId partName')
      .populate('machineId', 'name machineId')
      .populate('employeeId', 'firstName lastName')
      .sort({ checkDate: -1 })
      .limit(limit);
    
    res.status(200).json(qualityChecks);
  } catch (error) {
    console.error('Error fetching recent quality checks:', error);
    res.status(500).json({ error: 'Failed to fetch recent quality checks' });
  }
};

module.exports = {
  getAllQualityChecks,
  getQualityCheckById,
  createQualityCheck,
  updateQualityCheck,
  deleteQualityCheck,
  getQualityChecksByResult,
  getRecentQualityChecks
};
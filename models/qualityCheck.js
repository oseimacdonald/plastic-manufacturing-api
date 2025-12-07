const mongoose = require('mongoose');

const qualityCheckSchema = new mongoose.Schema({
  checkId: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true
  },
  productionRunId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'ProductionRun', 
    required: true 
  },
  machineId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Machine', 
    required: true 
  },
  employeeId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Employee', 
    required: true 
  },
  checkDate: { 
    type: Date, 
    required: true,
    default: Date.now
  },
  checkType: {
    type: String,
    required: true,
    enum: ['Visual', 'Measurement', 'Weight', 'Dimensional', 'Packaging', 'Material']
  },
  result: {
    type: String,
    required: true,
    enum: ['Pass', 'Fail', 'Rework', 'Hold']
  },
  measurements: [{
    parameter: String,
    value: Number,
    unit: String,
    tolerance: String,
    actualValue: Number,
    status: {
      type: String,
      enum: ['Within', 'Out of Spec']
    }
  }],
  notes: {
    type: String,
    maxlength: 500
  },
  defectsFound: {
    type: Number,
    min: 0,
    default: 0
  },
  correctiveAction: {
    type: String,
    maxlength: 500
  },
  nextCheckDate: {
    type: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('QualityCheck', qualityCheckSchema);
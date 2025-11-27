const mongoose = require('mongoose');

const productionRunSchema = new mongoose.Schema({
  runId: { 
    type: String, 
    required: true, 
    unique: true 
  },
  machineId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Machine', 
    required: true 
  },
  partNumber: { 
    type: String, 
    required: true 
  },
  partName: { 
    type: String, 
    required: true 
  },
  targetQty: { 
    type: Number, 
    required: true,
    min: 1
  },
  actualQty: { 
    type: Number, 
    default: 0,
    min: 0
  },
  status: {
    type: String,
    enum: ['scheduled', 'running', 'completed', 'paused', 'cancelled'],
    default: 'scheduled'
  },
  startTime: { 
    type: Date, 
    default: Date.now 
  },
  endTime: Date,
  operator: String
}, {
  timestamps: true
});

module.exports = mongoose.model('ProductionRun', productionRunSchema);
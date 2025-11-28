const mongoose = require('mongoose');

const machineSchema = new mongoose.Schema({
  machineId: { 
    type: String, 
    required: true, 
    unique: true 
  },
  name: { 
    type: String, 
    required: true 
  },
  model: String,
  manufacturer: String,
  tonnage: Number,
  shotSize: Number,
  status: { 
    type: String, 
    enum: ['operational', 'maintenance', 'down', 'idle'],
    default: 'operational'
  },
  location: String
}, {
  timestamps: true
});

module.exports = mongoose.model('Machine', machineSchema);
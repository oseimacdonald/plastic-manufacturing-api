const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  employeeId: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true
  },
  firstName: { 
    type: String, 
    required: true,
    trim: true,
    minlength: 2
  },
  lastName: { 
    type: String, 
    required: true,
    trim: true,
    minlength: 2
  },
  email: { 
    type: String, 
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    trim: true
  },
  department: {
    type: String,
    required: true,
    enum: ['Production', 'Quality', 'Maintenance', 'Shipping', 'Administration']
  },
  role: {
    type: String,
    required: true,
    enum: ['Operator', 'Supervisor', 'Manager', 'Technician', 'Inspector', 'Administrator']
  },
  hireDate: {
    type: Date,
    default: Date.now
  },
  shift: {
    type: String,
    enum: ['Morning', 'Evening', 'Night', 'Flexible'],
    default: 'Morning'
  },
  active: {
    type: Boolean,
    default: true
  },
  assignedMachine: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Machine',
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Employee', employeeSchema);
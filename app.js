const express = require('express');
const mongoose = require('mongoose');
const swaggerUi = require('swagger-ui-express');
const specs = require('./swagger/swaggerConfig');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/plastic-manufacturing')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Plastic Manufacturing API - Visit /api-docs for documentation' });
});

const machineRoutes = require('./routes/machines');
const productionRunRoutes = require('./routes/productionRuns');

app.use('/machines', machineRoutes);
app.use('/production-runs', productionRunRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API Documentation available at http://localhost:${PORT}/api-docs`);
});
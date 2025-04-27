const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// Set JWT_SECRET explicitly if not set from environment
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'stock2traderapp_secret_key_2024';
  console.log('Using default JWT_SECRET');
}

// Initialize express
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Define port
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/stock-trading-app')
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log('MongoDB Connection Error:', err));

// Import routes
const userRoutes = require('./routes/userRoutes');
const stockRoutes = require('./routes/stockRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const portfolioRoutes = require('./routes/portfolioRoutes');

// Use routes
app.use('/api/users', userRoutes);
app.use('/api/stocks', stockRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/portfolio', portfolioRoutes);

// Basic route for testing
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

// Serve static files and handle client routing
const configureStaticFiles = require('./config/serveStatic');
configureStaticFiles(app);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Frontend: http://localhost:${PORT}`);
  console.log(`API: http://localhost:${PORT}/api/test`);
  console.log(`JWT_SECRET is ${process.env.JWT_SECRET ? 'set' : 'NOT set'}`);
}); 
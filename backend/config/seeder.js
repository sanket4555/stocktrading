const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { stocks } = require('./sampleData');
const Stock = require('../models/Stock');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/stock-trading-app')
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log('MongoDB Connection Error:', err));

// Import sample data
const importData = async () => {
  try {
    // Clear existing data
    await Stock.deleteMany();
    
    // Insert new data
    await Stock.insertMany(stocks);
    
    console.log('Sample data imported successfully!');
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Delete all data
const destroyData = async () => {
  try {
    // Clear existing data
    await Stock.deleteMany();
    
    console.log('All data destroyed!');
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Run command based on arguments
if (process.argv[2] === '-d') {
  destroyData();
} else {
  importData();
} 
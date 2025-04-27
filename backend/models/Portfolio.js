const mongoose = require('mongoose');

const portfolioSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  stocks: [
    {
      stock: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Stock',
        required: true
      },
      symbol: {
        type: String,
        required: true
      },
      quantity: {
        type: Number,
        required: true,
        min: 0
      },
      averageBuyPrice: {
        type: Number,
        required: true
      },
      totalInvestment: {
        type: Number,
        required: true
      }
    }
  ],
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const Portfolio = mongoose.model('Portfolio', portfolioSchema);

module.exports = Portfolio; 
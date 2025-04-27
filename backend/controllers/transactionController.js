const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Stock = require('../models/Stock');
const Portfolio = require('../models/Portfolio');

// @desc    Buy stock
// @route   POST /api/transactions/buy
// @access  Private
const buyStock = async (req, res) => {
  try {
    const { stockId, quantity } = req.body;
    const qtty = Number(quantity);

    // Validate input
    if (!stockId || !qtty || qtty <= 0) {
      return res.status(400).json({ message: 'Please provide valid stockId and quantity' });
    }

    // Get stock
    const stock = await Stock.findById(stockId);
    if (!stock) {
      return res.status(404).json({ message: 'Stock not found' });
    }

    // Calculate total cost
    const totalCost = stock.price * qtty;

    // Get user
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user has enough balance
    if (user.balance < totalCost) {
      return res.status(400).json({ message: 'Insufficient funds' });
    }

    // Create transaction
    const transaction = await Transaction.create({
      user: req.user._id,
      stock: stockId,
      symbol: stock.symbol,
      type: 'buy',
      quantity: qtty,
      price: stock.price,
      total: totalCost,
    });

    // Update user balance
    user.balance -= totalCost;
    await user.save();

    // Update or create portfolio entry
    let portfolio = await Portfolio.findOne({ user: req.user._id });
    
    if (!portfolio) {
      portfolio = await Portfolio.create({
        user: req.user._id,
        stocks: [],
      });
    }

    // Check if stock already exists in portfolio
    const stockIndex = portfolio.stocks.findIndex(
      (s) => s.stock.toString() === stockId
    );

    if (stockIndex >= 0) {
      // Update existing stock in portfolio
      const existingStock = portfolio.stocks[stockIndex];
      const newTotalInvestment = existingStock.totalInvestment + totalCost;
      const newTotalQuantity = existingStock.quantity + qtty;
      const newAverageBuyPrice = newTotalInvestment / newTotalQuantity;

      portfolio.stocks[stockIndex].quantity = newTotalQuantity;
      portfolio.stocks[stockIndex].averageBuyPrice = newAverageBuyPrice;
      portfolio.stocks[stockIndex].totalInvestment = newTotalInvestment;
    } else {
      // Add new stock to portfolio
      portfolio.stocks.push({
        stock: stockId,
        symbol: stock.symbol,
        quantity: qtty,
        averageBuyPrice: stock.price,
        totalInvestment: totalCost,
      });
    }

    portfolio.updatedAt = Date.now();
    await portfolio.save();

    res.status(201).json({
      transaction,
      newBalance: user.balance,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Sell stock
// @route   POST /api/transactions/sell
// @access  Private
const sellStock = async (req, res) => {
  try {
    const { stockId, quantity } = req.body;
    const qtty = Number(quantity);

    // Validate input
    if (!stockId || !qtty || qtty <= 0) {
      return res.status(400).json({ message: 'Please provide valid stockId and quantity' });
    }

    // Get stock
    const stock = await Stock.findById(stockId);
    if (!stock) {
      return res.status(404).json({ message: 'Stock not found' });
    }

    // Calculate total sale amount
    const totalSaleAmount = stock.price * qtty;

    // Check if user has this stock in portfolio
    const portfolio = await Portfolio.findOne({ user: req.user._id });
    if (!portfolio) {
      return res.status(400).json({ message: 'You do not have a portfolio' });
    }

    const stockIndex = portfolio.stocks.findIndex(
      (s) => s.stock.toString() === stockId
    );

    if (stockIndex === -1) {
      return res.status(400).json({ message: 'You do not own this stock' });
    }

    // Check if user has enough quantity to sell
    if (portfolio.stocks[stockIndex].quantity < qtty) {
      return res.status(400).json({ message: 'You do not have enough shares to sell' });
    }

    // Create transaction
    const transaction = await Transaction.create({
      user: req.user._id,
      stock: stockId,
      symbol: stock.symbol,
      type: 'sell',
      quantity: qtty,
      price: stock.price,
      total: totalSaleAmount,
    });

    // Update user balance
    const user = await User.findById(req.user._id);
    user.balance += totalSaleAmount;
    await user.save();

    // Update portfolio
    portfolio.stocks[stockIndex].quantity -= qtty;
    portfolio.stocks[stockIndex].totalInvestment -= 
      portfolio.stocks[stockIndex].averageBuyPrice * qtty;

    // Remove stock from portfolio if quantity is 0
    if (portfolio.stocks[stockIndex].quantity === 0) {
      portfolio.stocks.splice(stockIndex, 1);
    }

    portfolio.updatedAt = Date.now();
    await portfolio.save();

    res.status(201).json({
      transaction,
      newBalance: user.balance,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user transactions
// @route   GET /api/transactions
// @access  Private
const getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user._id })
      .sort({ date: -1 })
      .populate('stock', 'symbol companyName');

    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  buyStock,
  sellStock,
  getTransactions,
}; 
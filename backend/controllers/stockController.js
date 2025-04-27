const Stock = require('../models/Stock');

// @desc    Get all stocks
// @route   GET /api/stocks
// @access  Public
const getStocks = async (req, res) => {
  try {
    const stocks = await Stock.find({});
    res.json(stocks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get a stock by symbol
// @route   GET /api/stocks/:symbol
// @access  Public
const getStockBySymbol = async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const stock = await Stock.findOne({ symbol });

    if (stock) {
      res.json(stock);
    } else {
      res.status(404).json({ message: 'Stock not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Search stocks by symbol or company name
// @route   GET /api/stocks/search/:query
// @access  Public
const searchStocks = async (req, res) => {
  try {
    const query = req.params.query;
    const stocks = await Stock.find({
      $or: [
        { symbol: { $regex: query, $options: 'i' } },
        { companyName: { $regex: query, $options: 'i' } },
      ],
    });

    res.json(stocks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// For development/testing only
// @desc    Add a stock (admin only)
// @route   POST /api/stocks
// @access  Private/Admin
const addStock = async (req, res) => {
  try {
    const { symbol, companyName, price, previousClose } = req.body;

    // Calculate change and change percent
    const change = price - previousClose;
    const changePercent = (change / previousClose) * 100;

    const stock = await Stock.create({
      symbol: symbol.toUpperCase(),
      companyName,
      price,
      previousClose,
      change,
      changePercent,
    });

    res.status(201).json(stock);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update stock price (could be automated in production)
// @route   PUT /api/stocks/:id
// @access  Private/Admin
const updateStockPrice = async (req, res) => {
  try {
    const { price } = req.body;
    const stock = await Stock.findById(req.params.id);

    if (!stock) {
      return res.status(404).json({ message: 'Stock not found' });
    }

    // Update price and calculate changes
    const previousClose = stock.price;
    const change = price - previousClose;
    const changePercent = (change / previousClose) * 100;

    stock.previousClose = previousClose;
    stock.price = price;
    stock.change = change;
    stock.changePercent = changePercent;
    stock.lastUpdated = Date.now();

    await stock.save();

    res.json(stock);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getStocks,
  getStockBySymbol,
  searchStocks,
  addStock,
  updateStockPrice,
}; 
const Portfolio = require('../models/Portfolio');
const Stock = require('../models/Stock');

// @desc    Get user portfolio
// @route   GET /api/portfolio
// @access  Private
const getPortfolio = async (req, res) => {
  try {
    let portfolio = await Portfolio.findOne({ user: req.user._id }).populate({
      path: 'stocks.stock',
      select: 'symbol companyName price change changePercent',
    });

    if (!portfolio) {
      // If no portfolio exists, create an empty one
      portfolio = await Portfolio.create({
        user: req.user._id,
        stocks: [],
      });
    }

    // Calculate current value and profit/loss for each stock
    const portfolioWithValues = {
      ...portfolio._doc,
      stocks: portfolio.stocks.map((item) => {
        const currentValue = item.quantity * item.stock.price;
        const investmentValue = item.totalInvestment;
        const profitLoss = currentValue - investmentValue;
        const profitLossPercent = investmentValue > 0 ? (profitLoss / investmentValue) * 100 : 0;

        return {
          ...item._doc,
          currentValue,
          profitLoss,
          profitLossPercent,
        };
      }),
    };

    // Calculate total portfolio value and total profit/loss
    const totalCurrentValue = portfolioWithValues.stocks.reduce(
      (total, stock) => total + stock.currentValue,
      0
    );
    
    const totalInvestment = portfolioWithValues.stocks.reduce(
      (total, stock) => total + stock.totalInvestment,
      0
    );
    
    const totalProfitLoss = totalCurrentValue - totalInvestment;
    const totalProfitLossPercent = totalInvestment > 0 ? (totalProfitLoss / totalInvestment) * 100 : 0;

    res.json({
      ...portfolioWithValues,
      totalCurrentValue,
      totalInvestment,
      totalProfitLoss,
      totalProfitLossPercent,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getPortfolio,
}; 
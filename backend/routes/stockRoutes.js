const express = require('express');
const router = express.Router();
const {
  getStocks,
  getStockBySymbol,
  searchStocks,
  addStock,
  updateStockPrice,
} = require('../controllers/stockController');
const { protect, admin } = require('../middleware/authMiddleware');

// Public routes
router.get('/', getStocks);
router.get('/search/:query', searchStocks);
router.get('/:symbol', getStockBySymbol);

// Admin routes
router.post('/', protect, admin, addStock);
router.put('/:id', protect, admin, updateStockPrice);

module.exports = router; 
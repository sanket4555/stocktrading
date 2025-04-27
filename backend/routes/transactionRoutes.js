const express = require('express');
const router = express.Router();
const {
  buyStock,
  sellStock,
  getTransactions,
} = require('../controllers/transactionController');
const { protect } = require('../middleware/authMiddleware');

// All routes are protected
router.get('/', protect, getTransactions);
router.post('/buy', protect, buyStock);
router.post('/sell', protect, sellStock);

module.exports = router; 
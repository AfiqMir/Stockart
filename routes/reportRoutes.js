const express = require('express');

const {
    getSummary,
    getRevenue,
    getTopProducts
} = require('../controllers/reportController');

const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Hanya pemilik yang dapat mengakses seluruh laporan analitik
router.get('/summary', protect, authorize('pemilik'), getSummary);
router.get('/revenue', protect, authorize('pemilik'), getRevenue);
router.get('/top-products', protect, authorize('pemilik'), getTopProducts);

module.exports = router;
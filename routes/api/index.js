const express = require('express');
const router = express.Router();


router.use('/', require('./auth'));
router.use('/categories', require('./categories'));
router.use('/products', require('./products'));
router.use('/stock-entries', require('./stockEntries'));

module.exports = router;

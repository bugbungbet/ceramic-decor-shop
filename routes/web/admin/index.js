const express = require('express');
const router = express.Router();

const { setActivePage } = require("../../../utils/index");
const { authAdmin } = require('../../../middlewares/checkAuth');

router.use(setActivePage);
router.use(authAdmin);
router.use('/dashboard', require('./dashboard'));
router.use('/products', require('./products'));
router.use('/categories', require('./categories'));
router.use('/stock-entries', require('./stockEntries'));
router.use('/orders', require('./orders'));

module.exports = router;

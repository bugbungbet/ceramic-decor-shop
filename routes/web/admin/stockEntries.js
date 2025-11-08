var express = require('express');
var router = express.Router();

const { asyncHandler } = require('../../../utils/index');

const StockEntriesController = require('../../../controllers/web/admin/stockEntries.controller');

router.get('/', asyncHandler(StockEntriesController.overview));

module.exports = router;

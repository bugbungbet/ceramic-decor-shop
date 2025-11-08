const express = require('express');
const router = express.Router();

// const { setActivePage } = require("../../../utils/index");

// router.use(setActivePage);

router.use('/', require('./home'));
router.use('/products', require('./products'));

module.exports = router;

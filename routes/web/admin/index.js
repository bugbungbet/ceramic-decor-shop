const express = require('express');
const router = express.Router();

const { setActivePage } = require("../../../utils/index");

router.use(setActivePage);

router.use('/dashboard', require('./dashboard'));

module.exports = router;

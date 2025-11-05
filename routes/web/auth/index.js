const express = require('express');
const router = express.Router();

const { asyncHandler } = require('../../../utils/index');
const { redirectIfAuthenticated, loginLimiter } = require('../../../middlewares/checkAuth');

const AuthController = require('../../../controllers/web/auth/auth.controller');

router.get('/login', redirectIfAuthenticated, asyncHandler(AuthController.loginPage));
router.get('/register', redirectIfAuthenticated, asyncHandler(AuthController.registerPage));

module.exports = router;

const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');

const { createAccessToken, createRefreshToken, verifyAccessToken, verifyRefreshToken } = require('../utils/jwt');

const { success, error } = require('../helpers/response');

const User = require('../models/user.model');
const RefreshToken = require('../models/refreshToken.model');
const { JWT_SECRET, JWT_EXPIRES_IN, COOKIE_MAX_AGE } = process.env;

const { asyncHandler } = require('../utils/index');

// const redirectIfAuthenticated = async (req, res, next) => {
//     const token = req.cookies.accessToken;
//     const refreshToken = req.cookies.refreshToken;

//     let decoded = null;

//     if (token) {
//         try {
//             decoded = verifyAccessToken(token);
//         } catch (_) { }
//     }

//     if (!decoded && refreshToken) {
//         try {
//             const decodedRefresh = verifyRefreshToken(refreshToken);

//             const tokenInDB = await RefreshToken.findOne({
//                 token: refreshToken,
//                 userId: decodedRefresh.user_id,
//                 userAgent: req.get('User-Agent'),
//             });

//             if (!tokenInDB || tokenInDB.expiresAt < new Date()) {
//                 return next();
//             }

//             const user = await User.findById(decodedRefresh.user_id)
//                 .select('_id fullName avatar_url email role status')
//                 .lean();

//             if (!user || user.status == 0) {
//                 return next();
//             }

//             const newToken = createAccessToken({ user_id: user._id, role: user.role, email: user.email });
//             res.cookie('accessToken', newToken, {
//                 httpOnly: true,
//                 secure: process.env.NODE_ENV === 'production',
//                 sameSite: 'Strict',
//                 maxAge: COOKIE_MAX_AGE || 15 * 60 * 1000,
//             });

//             return res.redirect('/');
//         } catch (_) {
//             return next();
//         }
//     }

//     if (!decoded) return next();

//     const user = await User.findById(decoded.user_id)
//         .select('_id fullName avatar_url email role status')
//         .lean();

//     if (!user || user.status == 0) return next();

//     return res.redirect('/');
// };

const redirectIfAuthenticated = (req, res, next) => {
    if (req.user) return res.redirect('/');
    next();
};

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 phút
    max: 10, // Tối đa 10 lần login trong 15 phút
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next, options) => {
        return error(res, 404, 'Quá nhiều lần đăng nhập thất bại, vui lòng thử lại sau 15 phút.');
    }
});

const attachUserIfLoggedIn = asyncHandler(async (req, res, next) => {
    let token = req.cookies.accessToken;
    const refreshToken = req.cookies.refreshToken;
    let decoded;

    if (token) {
        try {
            decoded = verifyAccessToken(token);
        } catch (err) {
            decoded = null;
        }
    }

    if (!decoded && refreshToken) {
        try {
            const decodedRefresh = verifyRefreshToken(refreshToken);
            const tokenInDB = await RefreshToken.findOne({
                token: refreshToken,
                userId: decodedRefresh.user_id,
                userAgent: req.get('User-Agent'),
            });

            if (!tokenInDB || tokenInDB.expiresAt < new Date()) {
                return next(); // không có user
            }

            const user = await User.findById(decodedRefresh.user_id)
                .select('_id fullName avatar_url email role status').lean();

            if (!user || user.status == 0) {
                return next(); // không gán user
            }

            // tạo lại token mới
            token = createAccessToken({ user_id: user._id, role: user.role, email: user.email });

            res.cookie('accessToken', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'Strict',
                maxAge: COOKIE_MAX_AGE || 15 * 60 * 1000,
            });

            req.user = user;
            res.locals.user = user;
            return next();
        } catch (err) {
            return next(); // không gán user
        }
    }

    if (!decoded) {
        return next(); // không có token hoặc token sai
    }

    const user = await User.findById(decoded.user_id)
        .select('_id fullName avatar_url email role status').lean();

    if (!user || user.status == 0) {
        return next();
    }
    req.user = user;
    res.locals.user = user;
    next();
});

const authUser = asyncHandler(async (req, res, next) => {
    let token = req.cookies.accessToken;
    const refreshToken = req.cookies.refreshToken;

    let decoded;

    if (token) {
        try {
            decoded = verifyAccessToken(token);
        } catch (err) {
            // Token hết hạn, tiếp tục thử refresh
        }
    }

    if (!decoded && refreshToken) {
        try {
            const decodedRefresh = verifyRefreshToken(refreshToken);

            const tokenInDB = await RefreshToken.findOne({
                token: refreshToken,
                userId: decodedRefresh.user_id,
                userAgent: req.get('User-Agent'),
            });

            if (!tokenInDB || tokenInDB.expiresAt < new Date()) {
                return res.redirect('/login');
            }
            const user = await User.findById(decodedRefresh.user_id)
                .select('_id fullName avatar_url email role status').lean();

            if (!user || user.status == 0) {
                return res.redirect('/403');
            }

            token = createAccessToken({ user_id: user._id, role: user.role, email: user.email });

            res.cookie('accessToken', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'Strict',
                maxAge: COOKIE_MAX_AGE || 15 * 60 * 1000,
            });

            req.user = user;
            res.locals.user = user;
            return next();
        } catch (err) {
            console.log(err.message);
            return res.redirect('/login');
        }
    }

    if (!decoded) {
        return res.redirect('/login');
    }

    const user = await User.findById(decoded.user_id)
        .select('_id fullName avatar_url email role status').lean();
    if (!user || user.status == 0) {
        return res.redirect('/403');
    }
    req.user = user;
    res.locals.user = user;

    next();
});

const authAdmin = asyncHandler(async (req, res, next) => {
    let token = req.cookies.accessToken;
    const refreshToken = req.cookies.refreshToken;

    let decoded;

    if (token) {
        try {
            decoded = verifyAccessToken(token);
        } catch (err) {
            console.warn('Access token hết hạn hoặc không hợp lệ:', err.message);
        }
    }

    if (!decoded && refreshToken) {
        try {

            const decodedRefresh = verifyRefreshToken(refreshToken);

            const tokenInDB = await RefreshToken.findOne({
                token: refreshToken,
                userId: decodedRefresh.user_id,
                userAgent: req.get('User-Agent'),
            });

            if (!tokenInDB || tokenInDB.expiresAt < new Date()) {
                return res.redirect('/login');
            }

            const user = await User.findById(decodedRefresh.user_id)
                .select('_id fullName avatar_url email role status').lean();

            if (!user || user.status == 0 || user.role !== 0) {
                return res.redirect('/403');
            }

            token = createAccessToken({ user_id: user._id, role: user.role, email: user.email });

            res.cookie('accessToken', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'Strict',
                maxAge: COOKIE_MAX_AGE || 15 * 60 * 1000,
            });
            req.user = user;
            return next();
        } catch (err) {
            console.log(err.message)
            return res.redirect('/login');
        }
    }

    if (!decoded) {
        return res.redirect('/login');
    }

    const user = await User.findById(decoded.user_id)
        .select('_id fullName avatar_url email role status').lean();

    if (!user || user.status == 0 || user.role !== 0) {
        return res.redirect('/403');
    }
    req.user = user;
    next();
});

module.exports = {
    redirectIfAuthenticated,
    loginLimiter,
    attachUserIfLoggedIn,
    authUser,
    authAdmin,
};
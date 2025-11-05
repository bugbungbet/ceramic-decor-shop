const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { success, error } = require('../../../helpers/response');
const nodemailer = require('nodemailer');

const User = require('../../../models/user.model');
const EmailVerification = require('../../../models/emailVerification.model');
const RefreshToken = require('../../../models/refreshToken.model');

const { createAccessToken, createRefreshToken } = require('../../../utils/jwt');

class AuthController {

    // [POST] /api/login
    async login(req, res) {
        try {
            const { email, password } = req.body;
            const userAgent = req.headers['user-agent'] || null;
            const ipAddress = req.ip;

            if (!email || !password) {
                return error(res, 400, 'Vui lòng nhập email và mật khẩu.');
            }

            // Tìm user
            const user = await User.findOne({ email });
            if (!user) return error(res, 401, 'Email hoặc mật khẩu không đúng.');

            // Kiểm tra verify email
            if (user.status !== 1) {
                return error(res, 403, 'Tài khoản chưa được xác nhận. Vui lòng kiểm tra email.');
            }

            // So khớp mật khẩu
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) return error(res, 401, 'Email hoặc mật khẩu không đúng.');

            // === Tạo JWT access token ===
            const accessToken = createAccessToken({ user_id: user._id, role: user.role, email: user.email });
            const refreshToken = createRefreshToken({ user_id: user._id, role: user.role, email: user.email });

            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 ngày

            await RefreshToken.create({
                userId: user._id,
                token: refreshToken,
                userAgent,
                ipAddress,
                expiresAt
            });

            // === Set cookie ===
            res.cookie('accessToken', accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 15 * 60 * 1000 // 15 phút
            });

            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 ngày
            });

            return success(res, 200, 'Đăng nhập thành công!', {
                user: {
                    _id: user._id,
                    fullName: user.fullName,
                    email: user.email,
                    role: user.role
                }
            });

        } catch (err) {
            console.error('Login error:', err);
            return error(res, 500, 'Lỗi máy chủ. Vui lòng thử lại sau.', err.message);
        }
    }

    // [POST] /api/register
    async register(req, res) {
        try {
            const { fullName, email, password } = req.body;

            // === 3. Mã hoá mật khẩu ===
            const hashedPassword = await bcrypt.hash(password, 10);

            // === 4. Tạo user mới (chưa kích hoạt) ===
            const newUser = await User.create({
                _id: uuidv4(),
                fullName,
                email,
                password: hashedPassword,
                status: 0, // chưa kích hoạt
                role: 1
            });

            const token = crypto.randomBytes(16).toString('hex'); // 32 ký tự ngẫu nhiên
            const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 phút

            await EmailVerification.create({
                userId: newUser._id,
                email: newUser.email,
                token,
                expiresAt
            });

            // === 6. Gửi email xác nhận ===
            const verifyLink = `${process.env.APP_URL}api/verify?token=${token}`;
            const transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST || 'smtp.gmail.com',
                port: process.env.SMTP_PORT || 465,
                secure: true,
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                }
            });

            const mailOptions = {
                from: `"App Support" <${process.env.SMTP_USER}>`,
                to: email,
                subject: 'Xác nhận tài khoản của bạn',
                text: `Bạn hoặc ai đó đã sử dụng email này để đăng ký tài khoản trên ứng dụng của chúng tôi.
Vui lòng click vào link để xác nhận tài khoản: ${verifyLink}
Nếu bạn không thực hiện đăng ký, hãy bỏ qua email này.`,
                html: `<p>Xin chào <b>${fullName}</b>,</p>
           <p>Bạn hoặc ai đó đã sử dụng email này để đăng ký tài khoản trên ứng dụng của chúng tôi.</p>
           <p>Để xác nhận tài khoản, vui lòng click vào link sau:</p>
           <a href="${verifyLink}" target="_blank">${verifyLink}</a>
           <p>Link sẽ hết hạn sau 15 phút.</p>
           <p><b>Lưu ý:</b> Nếu bạn không thực hiện đăng ký, vui lòng <u>không click vào link</u> và bỏ qua email này.</p>`
            };


            await transporter.sendMail(mailOptions);

            // === 7. Phản hồi ===
            return success(
                res,
                201,
                'Đăng ký thành công! Vui lòng kiểm tra email để xác nhận tài khoản.'
            );

        } catch (err) {
            console.error('Register error:', err);
            return error(res, 500, 'Lỗi máy chủ. Vui lòng thử lại sau.', err.message);
        }
    }

    // [GET] /api/verify?token=abc123xyz
    async verifyEmail(req, res) {
        try {
            const { token } = req.query;

            // === 1. Kiểm tra token ===
            if (!token) {
                return error(res, 400, 'Liên kết xác nhận không hợp lệ. Vui lòng kiểm tra email của bạn.');
            }

            // === 2. Tìm record theo token ===
            const record = await EmailVerification.findOne({ token });

            if (!record) {
                return error(res, 400, 'Liên kết xác nhận đã hết hạn hoặc không tồn tại. Vui lòng thử gửi lại email.');
            }

            if (record.verified) {
                return error(res, 400, 'Tài khoản này đã được xác nhận trước đó. Bạn có thể đăng nhập ngay.');
            }

            if (record.expiresAt < new Date()) {
                return error(res, 400, 'Liên kết xác nhận đã hết hạn. Vui lòng đăng ký lại để nhận link mới.');
            }

            // === 3. Kích hoạt tài khoản user ===
            const user = await User.findById(record.userId);
            if (!user) {
                return error(res, 404, 'Tài khoản không tồn tại. Vui lòng đăng ký lại.');
            }

            user.status = 1; // kích hoạt
            await user.save();

            // === 4. Đánh dấu token đã dùng ===
            record.verified = true;
            await record.save();

            return success(res, 200, 'Xác nhận email thành công! Bạn có thể đăng nhập.');

        } catch (err) {
            console.error('Verify email error:', err);
            return error(res, 500, 'Lỗi máy chủ. Vui lòng thử lại sau.', err.message);
        }
    }


    // [POST] /api/resend-verification
    async resendVerification(req, res) {
        try {
            const { email } = req.body;
            if (!email) return error(res, 400, 'Email không được để trống.');

            const user = await User.findOne({ email });
            if (!user) return error(res, 404, 'Tài khoản không tồn tại.');

            if (user.status === 1)
                return success(res, 200, 'Tài khoản đã được xác nhận. Bạn có thể đăng nhập.');

            // Lấy token xác nhận mới nhất của user
            const record = await EmailVerification.findOne({ userId: user._id }).sort({ createdAt: -1 });

            const now = new Date();
            if (record && record.expiresAt > now) {
                const remaining = Math.ceil((record.expiresAt - now) / 60000); // phút còn lại
                return success(
                    res,
                    200,
                    `Email xác nhận đã được gửi trước đó. Vui lòng kiểm tra lại hộp thư của bạn hoặc thử gửi lại sau ${remaining} phút.`
                );
            }


            const token = crypto.randomBytes(16).toString('hex');
            const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 phút

            await EmailVerification.create({
                userId: user._id,
                email: user.email,
                token,
                expiresAt
            });

            // Gửi email
            const transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST || 'smtp.gmail.com',
                port: process.env.SMTP_PORT || 465,
                secure: true,
                auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
            });

            const verifyLink = `${process.env.APP_URL}api/verify?token=${token}`;
            await transporter.sendMail({
                from: `"App Support" <${process.env.SMTP_USER}>`,
                to: email,
                subject: 'Xác nhận tài khoản của bạn',
                html: `<p>Xin chào <b>${user.fullName}</b>,</p>
           <p>Bạn hoặc ai đó đã sử dụng email này để đăng ký tài khoản trên ứng dụng của chúng tôi.</p>
           <p>Để xác nhận tài khoản, vui lòng click vào link sau:</p>
           <a href="${verifyLink}" target="_blank">${verifyLink}</a>
           <p>Link này sẽ hết hạn sau 15 phút.</p>
           <p><b>Lưu ý:</b> Nếu bạn không thực hiện đăng ký, vui lòng <u>không click vào link</u> và bỏ qua email này.</p>`
            });


            return success(res, 201, 'Đã gửi lại email xác nhận. Vui lòng kiểm tra email.');
        } catch (err) {
            console.error(err);
            return error(res, 500, 'Lỗi máy chủ. Vui lòng thử lại sau.', err.message);
        }
    }



    // [POST] /api/logout
    async logout(req, res) {
        try {
            const refreshToken = req.cookies?.refreshToken;
            if (refreshToken) {
                await RefreshToken.deleteOne({ token: refreshToken });
            }

            // Xoá cookie
            res.clearCookie('accessToken');
            res.clearCookie('refreshToken');

            return success(res, 200, 'Đăng xuất thành công!');
        } catch (err) {
            console.error('Logout error:', err);
            return error(res, 500, 'Lỗi máy chủ. Vui lòng thử lại sau.', err.message);
        }
    }
}

module.exports = new AuthController();

class AuthController {
    async loginPage(req, res) {

        res.render('auth/login', {
            title: 'Đăng nhập',
        });
    }
    async registerPage(req, res) {

        res.render('auth/register', {
            title: 'Đăng ký',
        });
    }
}

module.exports = new AuthController();

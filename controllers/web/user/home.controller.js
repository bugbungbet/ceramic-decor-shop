class HomeController {
    async overview(req, res) {

        res.render('user/home', {
            title: 'Trang chủ',
        });
    }
}

module.exports = new HomeController();

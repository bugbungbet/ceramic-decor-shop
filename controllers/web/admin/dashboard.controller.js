class DashboardController {
    async overview(req, res) {

        res.render('admin/dashboard', {
            title: 'Thống kê',
        });
    }
}

module.exports = new DashboardController();

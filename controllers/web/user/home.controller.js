const Product = require('../../../models/product.model');
const Category = require('../../../models/category.model');
const { success, error } = require('../../../helpers/response');

class HomeController {
    async overview(req, res) {
        const newProducts = await Product.aggregate([
            { $sort: { createdAt: -1 } },
            { $limit: 20 },
            { $sample: { size: 8 } }
        ]);
        res.render('user/home', {
            title: 'Trang chủ',
            newProducts
        });
    }
}

module.exports = new HomeController();

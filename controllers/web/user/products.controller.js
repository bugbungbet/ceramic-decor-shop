const Product = require('../../../models/product.model');
const Category = require('../../../models/category.model');
const fs = require('fs');
const path = require('path');
const { success, error } = require('../../../helpers/response');


class ProductsController {
    async overview(req, res) {
        try {
            const newProducts = await Product.aggregate([
                { $sort: { createdAt: -1 } },
                { $limit: 20 },
                { $sample: { size: 8 } }
            ]);

            // const allProducts = await Product.find({})
            //     .sort({ createdAt: -1 })
            //     .lean();

            const allCategories = await Category.find({ isActive: true }, { name: 1 })
                .sort({ name: 1 })
                .lean();

            res.render('user/products', {
                title: 'Sản phẩm',
                // allProducts,
                newProducts,
                allCategories
            });
        } catch (err) {
            console.error(err);
            error(res, 500, 'Có lỗi xảy ra khi lấy danh sách sản phẩm');
        }
    }

    async productDetail(req, res) {
        try {
            const { id } = req.params;

            const product = await Product.findById(id)
                .populate('categoryId', 'name')
                .lean();

            if (!product) {
                return res.status(404).render('user/404', { message: 'Sản phẩm không tồn tại' });
            }
            
            res.render('user/productDetail', {
                title: product.name,
                product,
            });
        } catch (err) {
            console.error(err);
            error(res, 500, 'Có lỗi xảy ra khi lấy chi tiết sản phẩm');
        }
    }
}

module.exports = new ProductsController();

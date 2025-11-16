const Product = require('../../../models/product.model');
const Category = require('../../../models/category.model');
const { success, error } = require('../../../helpers/response');

class HomeController {
    // async overview(req, res) {
    //     const newProducts = await Product.aggregate([
    //         { $sort: { createdAt: -1 } },
    //         { $limit: 20 },
    //         { $sample: { size: 8 } }
    //     ]);
    //     res.render('user/home', {
    //         title: 'Trang chủ',
    //         newProducts
    //     });
    // }
    async overview(req, res) {
        try {
            const products = await Product.aggregate([
                // chỉ lấy sản phẩm đang active
                { $match: { isActive: true } },

                // lấy thông tin lô hàng nhập kho
                {
                    $lookup: {
                        from: 'stockEntries',
                        localField: '_id',
                        foreignField: 'productId',
                        as: 'stockEntries'
                    }
                },

                // tính xem có tồn kho hay không
                {
                    $addFields: {
                        hasStock: {
                            $gt: [
                                {
                                    $size: {
                                        $filter: {
                                            input: '$stockEntries',
                                            as: 'se',
                                            cond: {
                                                $and: [
                                                    { $eq: ['$$se.status', 'imported'] },
                                                    { $gt: ['$$se.remainingQuantity', 0] }
                                                ]
                                            }
                                        }
                                    }
                                },
                                0
                            ]
                        }
                    }
                },

                // chỉ giữ sản phẩm có hàng
                { $match: { hasStock: true } },

                // sắp xếp theo ngày tạo mới nhất
                { $sort: { createdAt: -1 } },

                // chỉ lấy 20 sản phẩm gần nhất và ngẫu nhiên 8 cái hiển thị
                { $limit: 20 },
                { $sample: { size: 8 } },

                // loại bỏ các trường phụ
                { $project: { stockEntries: 0, hasStock: 0 } }
            ]);

            res.render('user/home', {
                title: 'Trang chủ',
                newProducts: products
            });
        } catch (err) {
            console.error(err);
            res.status(500).render('user/home', {
                title: 'Trang chủ',
                newProducts: [],
                errorMsg: 'Có lỗi xảy ra khi tải danh sách sản phẩm.'
            });
        }
    }
}

module.exports = new HomeController();

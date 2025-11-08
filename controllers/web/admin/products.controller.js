const Product = require('../../../models/product.model');
const Category = require('../../../models/category.model');
const StockEntry = require('../../../models/stockEntry.model');
const fs = require('fs');
const path = require('path');
const { success, error } = require('../../../helpers/response');


class ProductsController {
    // async overview(req, res) {
    //     try {
    //         const page = parseInt(req.query.page) || 1;
    //         const limit = 5;

    //         const totalItems = await Product.countDocuments();
    //         const totalPages = Math.ceil(totalItems / limit);

    //         let products = await Product.find()
    //             .sort({ createdAt: -1 })
    //             .skip((page - 1) * limit)
    //             .limit(limit)
    //             .lean();

    //         const allCategories = await Category.find({}, { name: 1 })
    //             .sort({ name: 1 })
    //             .lean();

    //         const startIndex = (page - 1) * limit;
    //         const endIndex = Math.min(startIndex + products.length, totalItems);

    //         res.render('admin/products', {
    //             title: 'Quản lý sản phẩm',
    //             products,
    //             allCategories,
    //             pagination: {
    //                 startIndex: startIndex + (totalItems > 0 ? 1 : 0),
    //                 endIndex,
    //                 totalItems,
    //                 currentPage: page,
    //                 totalPages,
    //                 hasPrevPage: page > 1,
    //                 hasNextPage: page < totalPages,
    //                 prevPage: page - 1,
    //                 nextPage: page + 1
    //             },
    //         });
    //     } catch (err) {
    //         console.error(err);
    //         error(res, 500, 'Có lỗi xảy ra khi lấy danh sách sản phẩm');
    //     }
    // }

     async overview(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = 5;

            const totalItems = await Product.countDocuments();
            const totalPages = Math.ceil(totalItems / limit);

            // Query bằng aggregate để lấy thêm isDelete hiệu quả
            const products = await Product.aggregate([
                // Gộp sang StockEntry để kiểm tra lô hàng
                {
                    $lookup: {
                        from: 'stockEntries', // tên collection thật trong MongoDB
                        localField: '_id',
                        foreignField: 'productId',
                        as: 'stockEntries'
                    }
                },
                // Thêm trường isDelete = true nếu không có lô hàng
                {
                    $addFields: {
                        isDelete: { $eq: [{ $size: '$stockEntries' }, 0] }
                    }
                },
                // Chỉ chọn các field cần thiết
                {
                    $project: {
                        name: 1,
                        price: 1,
                        images: 1,
                        isActive: 1,
                        createdAt: 1,
                        isDelete: 1
                    }
                },
                { $sort: { createdAt: -1 } },
                { $skip: (page - 1) * limit },
                { $limit: limit }
            ]);

            const allCategories = await Category.find({}, { name: 1 })
                .sort({ name: 1 })
                .lean();

            const startIndex = (page - 1) * limit;
            const endIndex = Math.min(startIndex + products.length, totalItems);

            res.render('admin/products', {
                title: 'Quản lý sản phẩm',
                products,
                allCategories,
                pagination: {
                    startIndex: startIndex + (totalItems > 0 ? 1 : 0),
                    endIndex,
                    totalItems,
                    currentPage: page,
                    totalPages,
                    hasPrevPage: page > 1,
                    hasNextPage: page < totalPages,
                    prevPage: page - 1,
                    nextPage: page + 1
                },
            });
        } catch (err) {
            console.error(err);
            error(res, 500, 'Có lỗi xảy ra khi lấy danh sách sản phẩm');
        }
    }

    // async detail(req, res) {
    //     try {
    //         const { id } = req.params;

    //         // Lấy thông tin sản phẩm + danh mục
    //         const product = await Product.findById(id)
    //             .populate({ path: 'categoryId', select: 'name' })
    //             .lean();

    //         if (!product) {
    //             return res.status(404).render('admin/404', { title: 'Không tìm thấy sản phẩm' });
    //         }

    //         // Lấy danh sách các lô hàng thuộc sản phẩm này
    //         const stockEntries = await StockEntry.find({ productId: id })
    //             .sort({ importDate: -1 })
    //             .lean();

    //         res.render('admin/productDetail', {
    //             title: `Chi tiết sản phẩm`,
    //             product,
    //             stockEntries
    //         });
    //     } catch (err) {
    //         console.error(err);
    //         error(res, 500, 'Có lỗi xảy ra khi lấy chi tiết sản phẩm');
    //     }
    // }

    async detail(req, res) {
        try {
            const { id } = req.params;
            const page = parseInt(req.query.page) || 1;
            const limit = 5;

            // Lấy thông tin sản phẩm + danh mục
            const product = await Product.findById(id)
                .populate({ path: 'categoryId', select: 'name' })
                .lean();

            if (!product) {
                return res.status(404).render('admin/404', { title: 'Không tìm thấy sản phẩm' });
            }

            // Tổng số lô hàng
            const totalItems = await StockEntry.countDocuments({ productId: id });
            const totalPages = Math.ceil(totalItems / limit);

            // Lấy danh sách các lô hàng với phân trang
            const stockEntries = await StockEntry.find({ productId: id })
                .sort({ importDate: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean();

            const startIndex = (page - 1) * limit;
            const endIndex = Math.min(startIndex + stockEntries.length, totalItems);

            res.render('admin/productDetail', {
                title: `Chi tiết sản phẩm`,
                product,
                stockEntries,
                pagination: {
                    startIndex: startIndex + (totalItems > 0 ? 1 : 0),
                    endIndex,
                    totalItems,
                    currentPage: page,
                    totalPages,
                    hasPrevPage: page > 1,
                    hasNextPage: page < totalPages,
                    prevPage: page - 1,
                    nextPage: page + 1
                }
            });
        } catch (err) {
            console.error(err);
            error(res, 500, 'Có lỗi xảy ra khi lấy chi tiết sản phẩm');
        }
    }


}

module.exports = new ProductsController();

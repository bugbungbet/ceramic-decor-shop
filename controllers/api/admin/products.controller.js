const { success, error } = require('../../../helpers/response');

const Product = require('../../../models/product.model');
const fs = require('fs');
const path = require('path');
class ProductController {
    // [POST] /add
    async add(req, res) {
        try {
            const { name, price, categoryId, introduction, details, displaySuggestion, preservationGuide } = req.body;

            // Xử lý ảnh upload
            let images = [];
            if (req.files && req.files.length > 0) {
                images = req.files.map(f => {
                    const relativePath = path.join('/uploads/products', f.filename).replace(/\\/g, '/');
                    return relativePath;
                });
            }

            const newProduct = new Product({
                name: name.trim(),
                price: parseFloat(price),
                categoryId,
                introduction: introduction?.trim() || null,
                details: details?.trim() || null,
                displaySuggestion: displaySuggestion?.trim() || null,
                preservationGuide: preservationGuide?.trim() || null,

                images
            });

            await newProduct.save();

            success(res, 201, 'Thêm sản phẩm thành công', newProduct);

        } catch (err) {
            console.error(err);
            if (err.status) return error(res, err.status, err.message);
            error(res, 500, 'Có lỗi xảy ra khi thêm sản phẩm');
        }
    }

    // [PUT] /edit/:id
    async edit(req, res) {
        try {
            const { id } = req.params;
            const { name, price, categoryId, introduction, details, displaySuggestion, preservationGuide } = req.body;

            // Kiểm tra tồn tại sản phẩm
            const product = await Product.findById(id);
            if (!product) {
                return error(res, 404, 'Sản phẩm không tồn tại');
            }

            // Validate cơ bản
            if (!name || !price || !categoryId) {
                return error(res, 400, 'Vui lòng nhập đầy đủ tên, giá bán và danh mục');
            }

            // === Nếu có upload ảnh mới thì xóa ảnh cũ ===
            let images = product.images; // giữ ảnh cũ nếu không có file mới
            if (req.files && req.files.length > 0) {
                // Xóa file cũ trong thư mục public/uploads/products
                product.images.forEach(imgPath => {
                    try {
                        const filePath = path.join('public', imgPath);
                        if (fs.existsSync(filePath)) {
                            fs.unlinkSync(filePath);
                        }
                    } catch (err) {
                        console.warn(`Không thể xoá ảnh cũ: ${imgPath}`, err.message);
                    }
                });

                // Gán lại danh sách ảnh mới
                images = req.files.map(f => {
                    const relativePath = path.join('/uploads/products', f.filename).replace(/\\/g, '/');
                    return relativePath;
                });
            }

            // Cập nhật thông tin
            product.name = name.trim();
            product.price = parseFloat(price);
            product.categoryId = categoryId;
            product.introduction = introduction?.trim() || null;
            product.details = details?.trim() || null;
            product.displaySuggestion = displaySuggestion?.trim() || null;
            product.preservationGuide = preservationGuide?.trim() || null;
            product.images = images;

            await product.save();

            success(res, 200, 'Cập nhật sản phẩm thành công', product);
        } catch (err) {
            console.error(err);
            if (err.status) return error(res, err.status, err.message);
            error(res, 500, 'Có lỗi xảy ra khi cập nhật sản phẩm');
        }
    }
    async delete(req, res) {
        try {
            const { id } = req.params;

            const product = await Product.findById(id);
            if (!product) {
                return error(res, 404, 'Sản phẩm không tồn tại');
            }

            // === Xóa ảnh trong thư mục public/uploads/products ===
            if (product.images && product.images.length > 0) {
                for (const imgPath of product.images) {
                    const imagePath = path.join('public', imgPath);
                    if (fs.existsSync(imagePath)) {
                        fs.unlinkSync(imagePath);
                    }
                }

            }

            // === Xóa sản phẩm trong DB ===
            await Product.findByIdAndDelete(id);

            success(res, 200, 'Xóa sản phẩm thành công');
        } catch (err) {
            console.error(err);
            error(res, 500, 'Có lỗi xảy ra khi xóa sản phẩm');
        }
    }

    async toggle(req, res) {
        try {
            const { id } = req.params;

            const product = await Product.findById(id);
            if (!product) {
                return error(res, 404, 'Sản phẩm không tồn tại');
            }

            product.isActive = !product.isActive;
            await product.save();

            success(res, 200, 'Cập nhật trạng thái sản phẩm thành công', {
                id: product._id,
                isActive: product.isActive
            });
        } catch (err) {
            console.error(err);
            error(res, 500, 'Có lỗi xảy ra khi cập nhật trạng thái sản phẩm');
        }
    }

    async getById(req, res) {
        try {
            const { id } = req.params;

            const product = await Product.findById(id)
                .populate('categoryId', 'name') // nếu muốn lấy thêm tên danh mục
                .lean();

            if (!product) {
                return error(res, 404, 'Sản phẩm không tồn tại');
            }

            success(res, 200, 'Lấy thông tin sản phẩm thành công', product);

            // Nếu cần test loading:
            // setTimeout(() => success(res, 200, 'Lấy thông tin sản phẩm thành công', product), 3000);
        } catch (err) {
            console.error(err);
            error(res, 500, 'Có lỗi xảy ra khi lấy sản phẩm');
        }
    }
    // [GET] /products?categoryId=...
    // async getByCategory(req, res) {
    //     try {
    //         const { categoryId } = req.params;
    //         let filter = { isActive: true };

    //         if (categoryId && categoryId !== 'all') {
    //             filter.categoryId = categoryId;
    //         }

    //         const products = await Product.find(filter)
    //             .sort({ createdAt: -1 })
    //             .lean();

    //         success(res, 200, 'Lấy danh sách sản phẩm thành công', products);
    //     } catch (err) {
    //         console.error(err);
    //         error(res, 500, 'Có lỗi xảy ra khi lấy danh sách sản phẩm');
    //     }
    // }
    async getByCategory(req, res) {
        try {
            const { categoryId } = req.params;

            const matchProduct = { isActive: true };
            if (categoryId && categoryId !== 'all') {
                matchProduct.categoryId = categoryId;
            }

            const products = await Product.aggregate([
                { $match: matchProduct },
                {
                    $lookup: {
                        from: 'stockEntries',      // tên collection StockEntry
                        localField: '_id',
                        foreignField: 'productId',
                        as: 'stockEntries'
                    }
                },
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
                { $match: { hasStock: true } },
                { $sort: { createdAt: -1 } },
                { $project: { stockEntries: 0, hasStock: 0 } } // loại bỏ field không cần
            ]);

            success(res, 200, 'Lấy danh sách sản phẩm còn hàng thành công', products);
        } catch (err) {
            console.error(err);
            error(res, 500, 'Có lỗi xảy ra khi lấy danh sách sản phẩm');
        }
    }


}




module.exports = new ProductController();

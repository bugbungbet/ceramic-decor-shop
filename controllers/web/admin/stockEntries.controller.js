const StockEntry = require('../../../models/stockEntry.model');
const Product = require('../../../models/product.model');
const { success, error } = require('../../../helpers/response');


class StockEntriesController {
    async overview(req, res) {

        // res.render('admin/stockEntries', {
        //     title: 'Quản lý kho',
        // });

        try {
            const page = parseInt(req.query.page) || 1;
            const limit = 5;

            // Gom nhóm theo sản phẩm để lấy tổng tồn và số lô hàng
            const aggregation = await StockEntry.aggregate([
                {
                    $group: {
                        _id: '$productId',
                        totalBatches: { $sum: 1 },
                        totalImported: { $sum: '$quantity' },
                        totalStock: { $sum: '$remainingQuantity' },
                    },
                },
                { $sort: { _id: 1 } },
                { $skip: (page - 1) * limit },
                { $limit: limit },
            ]);

            // Đếm tổng số sản phẩm có trong kho
            const totalProducts = await StockEntry.distinct('productId').then(docs => docs.length);
            const totalPages = Math.ceil(totalProducts / limit);

            // Lấy thông tin sản phẩm tương ứng
            const productIds = aggregation.map(item => item._id);
            const products = await Product.find({ _id: { $in: productIds } })
                .select('name price images')
                .lean();

            // Ghép dữ liệu từ StockEntry + Product
            const stockOverview = aggregation.map(item => {
                const product = products.find(p => p._id === item._id);
                return {
                    productId: item._id,
                    name: product?.name || 'Không xác định',
                    price: product?.price || 0,
                    image: product?.images?.[0] || '',
                    totalBatches: item.totalBatches,
                    totalImported: item.totalImported,
                    totalStock: item.totalStock,
                };
            });

            const startIndex = (page - 1) * limit;
            const endIndex = Math.min(startIndex + stockOverview.length, totalProducts);

            res.render('admin/stockEntries', {
                title: 'Quản lý kho',
                stockOverview,
                pagination: {
                    startIndex: startIndex + (totalProducts > 0 ? 1 : 0),
                    endIndex,
                    totalItems: totalProducts,
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
            error(res, 500, 'Có lỗi xảy ra khi lấy danh sách tồn kho');
        }
    }
}

module.exports = new StockEntriesController();

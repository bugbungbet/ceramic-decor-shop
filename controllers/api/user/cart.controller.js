const Cart = require('../../../models/cart.model');
const Product = require('../../../models/product.model');
const StockEntry = require('../../../models/stockEntry.model');
const { success, error } = require('../../../helpers/response');

class CartController {

    // [POST] /api/user/cart/add
    async addToCart(req, res) {
        try {
            const userId = req.user._id;
            const { productId, quantity } = req.body;

            if (!productId || !quantity || quantity < 1) {
                return error(res, 400, 'Vui lòng cung cấp sản phẩm và số lượng hợp lệ');
            }

            const product = await Product.findById(productId);
            if (!product || !product.isActive) {
                return error(res, 404, 'Sản phẩm không tồn tại hoặc đã ngừng bán');
            }


            let cart = await Cart.findOne({ userId });

            if (!cart) {
                cart = new Cart({ userId, products: [] });
            }

            const existingIndex = cart.products.findIndex(p => p.productId === productId);

            if (existingIndex > -1) {
                cart.products[existingIndex].quantity += quantity;
                cart.products[existingIndex].price = product.price;
            } else {
                cart.products.push({
                    productId,
                    quantity,
                    price: product.price
                });
            }

            cart.totalQuantity = cart.products.reduce((sum, p) => sum + p.quantity, 0);

            await cart.save();

            success(res, 200, 'Thêm sản phẩm vào giỏ hàng thành công', cart);

        } catch (err) {
            console.error(err);
            error(res, 500, 'Có lỗi xảy ra khi thêm sản phẩm vào giỏ hàng');
        }
    }

    // [GET] /api/cart
    async getCart(req, res) {
        try {
            const userId = req.user._id;
            // const cart = await Cart.findOne({ userId })
            //     .populate('products.productId', 'name images price isActive');
            const cart = await Cart.findOne({ userId })
                .populate({
                    path: 'products.productId',
                    select: 'name images price isActive categoryId',
                    populate: {
                        path: 'categoryId',
                        select: 'name'
                    }
                });

            if (!cart || !cart.products.length) {
                return success(res, 200, 'Giỏ hàng trống', { products: [] });
            }

            for (const item of cart.products) {
                const product = item.productId;
                if (!product || !product.isActive) continue;

                const totalStock = await StockEntry.aggregate([
                    { $match: { productId: product._id, status: 'imported', remainingQuantity: { $gt: 0 } } },
                    { $group: { _id: null, total: { $sum: '$remainingQuantity' } } }
                ]);
                const availableQty = totalStock[0]?.total || 0;

                if (availableQty <= 0) {
                    product.isActive = false; // tạm thời hết hàng
                }
            }

            success(res, 200, 'Lấy giỏ hàng thành công', cart);
        } catch (err) {
            console.error(err);
            error(res, 500, 'Có lỗi xảy ra khi lấy giỏ hàng');
        }
    }

    // [DELETE] /api/cart/remove/:productId
    async removeFromCart(req, res) {
        try {
            const userId = req.user._id;
            const { productId } = req.params;

            if (!productId) {
                return error(res, 400, "Vui lòng cung cấp productId để xóa");
            }

            const cart = await Cart.findOne({ userId });
            if (!cart) {
                return error(res, 404, "Không tìm thấy giỏ hàng");
            }

            // Lọc bỏ sản phẩm cần xóa
            const initialLength = cart.products.length;
            cart.products = cart.products.filter(p => p.productId.toString() !== productId);

            if (cart.products.length === initialLength) {
                return error(res, 404, "Sản phẩm không tồn tại trong giỏ hàng");
            }

            // Cập nhật totalQuantity
            cart.totalQuantity = cart.products.reduce((sum, p) => sum + p.quantity, 0);

            await cart.save();

            success(res, 200, "Đã xóa sản phẩm khỏi giỏ hàng", cart);
        } catch (err) {
            console.error(err);
            error(res, 500, "Có lỗi xảy ra khi xóa sản phẩm khỏi giỏ hàng");
        }
    }


    // [PATCH] /api/cart/update/:productId
    async updateQuantity(req, res) {
        try {
            const userId = req.user._id;
            const { productId } = req.params;
            let { quantity } = req.body;

            if (!productId || typeof quantity !== "number" || quantity < 1) {
                return error(res, 400, "Vui lòng cung cấp productId và số lượng hợp lệ");
            }

            // Kiểm tra sản phẩm tồn tại và còn bán
            const product = await Product.findById(productId);
            if (!product || !product.isActive) {
                return error(res, 404, "Sản phẩm không tồn tại hoặc đã ngừng bán");
            }

            const cart = await Cart.findOne({ userId });
            if (!cart) {
                return error(res, 404, "Không tìm thấy giỏ hàng");
            }

            const itemIndex = cart.products.findIndex(p => p.productId.toString() === productId);
            if (itemIndex === -1) {
                return error(res, 404, "Sản phẩm không tồn tại trong giỏ hàng");
            }

            cart.products[itemIndex].quantity = quantity;
            cart.products[itemIndex].price = product.price; // cập nhật giá mới nếu cần
            cart.totalQuantity = cart.products.reduce((sum, p) => sum + p.quantity, 0);

            await cart.save();

            success(res, 200, "Cập nhật số lượng thành công", cart);
        } catch (err) {
            console.error(err);
            error(res, 500, "Có lỗi xảy ra khi cập nhật số lượng");
        }
    }

}

module.exports = new CartController();

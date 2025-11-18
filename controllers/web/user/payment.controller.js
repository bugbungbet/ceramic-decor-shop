const Cart = require('../../../models/cart.model');
const Product = require('../../../models/product.model');
const Order = require('../../../models/order.model');
const User = require('../../../models/user.model');
const StockEntry = require('../../../models/stockEntry.model');
const fs = require('fs');
const path = require('path');
const { success, error } = require('../../../helpers/response');

class PaymentController {
    async overview(req, res) {

        // res.render('user/payment', {
        //     title: 'Thanh toán',
        // });
        try {
            // productIds có thể gửi bằng query hoặc body
            let productIds = [];
            if (req.body.productIds) {
                try {
                    productIds = JSON.parse(req.body.productIds);
                } catch (err) {
                    return error(res, 400, 'Dữ liệu sản phẩm không hợp lệ');
                }
            }

            if (!productIds.length) {
                return error(res, 400, 'Bạn chưa chọn sản phẩm nào');
            }

            const userId = req.user._id;

            // Lấy giỏ hàng user
            const cart = await Cart.findOne({ userId }).lean();
            if (!cart) {
                return error(res, 404, 'Không tìm thấy giỏ hàng');
            }

            // Lọc các sản phẩm trong giỏ thuộc productIds
            const selectedCartItems = cart.products.filter(p => productIds.includes(p.productId));

            // Lấy thông tin product chi tiết
            const productDetails = await Product.find({
                _id: { $in: selectedCartItems.map(p => p.productId) },
                // isActive: true
            })
                .populate({ path: 'categoryId', select: 'name' })
                .lean();

            const user = await User.findById(userId)
                .select('-password')
                .lean();


            if (!user) {
                return res.status(404).render('errors/404', { message: 'Người dùng không tồn tại' });
            }
            const locations = JSON.parse(
                fs.readFileSync(path.join(__dirname, '../../../data.json'), 'utf-8')
            );

            // Helper lấy tên địa chỉ
            const getNameById = () => {
                const province = locations.find(p => p.Id === user.provinceId);
                if (!province) return {};

                const district = province.Districts.find(d => d.Id === user.districtId);
                const ward = district?.Wards.find(w => w.Id === user.wardCode);

                return {
                    provinceName: province?.Name || '',
                    districtName: district?.Name || '',
                    wardName: ward?.Name || ''
                };
            };

            const { provinceName, districtName, wardName } = getNameById();

            // Build full address
            const fullAddress = [
                wardName,
                districtName,
                provinceName,
                user.address
            ].filter(Boolean).join(', ');

            // Ghép thông tin cart + product + tính tổng tiền
            // const items = selectedCartItems.map(item => {
            //     const product = productDetails.find(p => p._id === item.productId);
            //     if (!product) return null;

            //     const total = item.price * item.quantity;
            //     return {
            //         productId: item.productId,
            //         name: product.name,
            //         image: product.images[0],
            //         category: product.categoryId.name,
            //         price: item.price,
            //         quantity: item.quantity,
            //         isActive: product.isActive,
            //         total
            //     };
            // }).filter(Boolean);
            // console.log(items);
            const items = await Promise.all(selectedCartItems.map(async (item) => {
                const product = productDetails.find(p => p._id.toString() === item.productId.toString());
                if (!product) return null;

                // Kiểm tra tồn kho
                const totalStock = await StockEntry.aggregate([
                    { $match: { productId: product._id, status: 'imported', remainingQuantity: { $gt: 0 } } },
                    { $group: { _id: null, total: { $sum: '$remainingQuantity' } } }
                ]);
                const availableQty = totalStock[0]?.total || 0;
                
                // Nếu hết hàng, tạm thời set isActive = false
                const isActive = product.isActive && availableQty > 0;

                const total = item.price * item.quantity;

                return {
                    productId: item.productId,
                    name: product.name,
                    image: product.images[0],
                    category: product.categoryId.name,
                    price: item.price,
                    quantity: item.quantity,
                    isActive,
                    total
                };
            }));


            const totalAmount = items.reduce((sum, i) => sum + i.total, 0);

            res.render('user/payment', {
                title: 'Thanh toán',
                items,
                totalAmount,
                user,
                fullAddress,
                productIds: JSON.stringify(selectedCartItems.map(i => i.productId))
            });

        } catch (err) {
            console.error(err);
            error(res, 500, 'Có lỗi xảy ra khi lấy thông tin thanh toán');
        }
    }


    // async result(req, res) {
    //     try {
    //         let vnp_Params = req.query;

    //         // Lấy chữ ký VNPay gửi về
    //         let secureHash = vnp_Params['vnp_SecureHash'];

    //         // Xóa các trường không cần thiết để xác thực chữ ký
    //         delete vnp_Params['vnp_SecureHash'];
    //         delete vnp_Params['vnp_SecureHashType'];

    //         // Sắp xếp params theo ASCII như demo
    //         vnp_Params = sortObject(vnp_Params);

    //         // const config = require('config');
    //         const secretKey = process.env.VNP_HASH_SECRET;
    //         const querystring = require('qs');
    //         const crypto = require('crypto');

    //         // Tạo chuỗi ký
    //         const signData = querystring.stringify(vnp_Params, { encode: false });
    //         const hmac = crypto.createHmac('sha512', secretKey);
    //         const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    //         // Kiểm tra chữ ký
    //         if (secureHash !== signed) {
    //             // console.log('Chữ ký không hợp lệ!');
    //             return res.render('user/payment-result', {
    //                 success: false,
    //                 message: 'Chữ ký không hợp lệ!',
    //                 // vnpParams
    //             });
    //         }

    //         const responseCode = vnp_Params.vnp_ResponseCode;
    //         const orderCode = vnp_Params.vnp_TxnRef; // Đây là orderCode bạn gửi lên khi tạo URL
    //         // console.log('responseCode:', responseCode, 'orderCode:', orderCode);

    //         // Tìm đơn hàng theo orderCode, không phải _id nếu vnp_TxnRef là orderCode
    //         const order = await Order.findOne({ orderCode });
    //         if (!order) {
    //             // console.log('Không tìm thấy đơn hàng với orderCode:', orderCode);
    //             return res.render('user/payment-result', {
    //                 success: false,
    //                 message: 'Không tìm thấy đơn hàng!',
    //                 // vnpParams
    //             });
    //         }

    //         if (order.paymentStatus === 'paid') {
    //             return res.render('user/payment-result', {
    //                 success: true,
    //                 message: 'Thanh toán thành công!',
    //                 order
    //             });
    //         }

    //         // Cập nhật trạng thái đơn hàng
    //         if (responseCode === '00') {
    //             order.paymentStatus = 'paid';
    //             // order.status = 'confirmed';
    //             // console.log('Thanh toán thành công, cập nhật order:', order._id);
    //         } else {
    //             order.paymentStatus = 'unpaid';
    //             order.status = 'pending';
    //             // console.log('Thanh toán thất bại, cập nhật order:', order._id);
    //         }

    //         await order.save();

    //         res.render('user/payment-result', {
    //             success: responseCode === '00',
    //             message: responseCode === '00' ? 'Thanh toán thành công!' : 'Thanh toán thất bại!',
    //             order,
    //             // vnpParams
    //         });

    //     } catch (err) {
    //         // console.error('Lỗi khi xử lý thanh toán:', err);
    //         console.error(err);
    //         res.render('user/payment-result', {
    //             title: 'Thanh toán',
    //             success: false,
    //             message: 'Có lỗi xảy ra khi xử lý thanh toán!',
    //             vnpParams: {}
    //         });
    //     }
    // }
    async result(req, res) {
        try {
            const { orderCode, paymentMethod } = req.query;

            let order;

            if (paymentMethod === 'cod') {
                order = await Order.findOne({ orderCode });
                if (!order) {
                    return res.render('user/payment-result', {
                        success: false,
                        message: 'Không tìm thấy đơn hàng!',
                    });
                }
                return res.render('user/payment-result', {
                    success: true,
                    message: 'Đặt hàng thành công!.',
                    order,
                });

            } else {
                // Trường hợp VNPay vẫn xử lý như cũ
                let vnp_Params = req.query;

                const secureHash = vnp_Params['vnp_SecureHash'];
                delete vnp_Params['vnp_SecureHash'];
                delete vnp_Params['vnp_SecureHashType'];

                vnp_Params = sortObject(vnp_Params);

                const secretKey = process.env.VNP_HASH_SECRET;
                const querystring = require('qs');
                const crypto = require('crypto');

                const signData = querystring.stringify(vnp_Params, { encode: false });
                const hmac = crypto.createHmac('sha512', secretKey);
                const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

                if (secureHash !== signed) {
                    return res.render('user/payment-result', {
                        success: false,
                        message: 'Chữ ký không hợp lệ!',
                    });
                }

                const responseCode = vnp_Params.vnp_ResponseCode;
                const orderCodeVN = vnp_Params.vnp_TxnRef;

                order = await Order.findOne({ orderCode: orderCodeVN });
                if (!order) {
                    return res.render('user/payment-result', {
                        success: false,
                        message: 'Không tìm thấy đơn hàng!',
                    });
                }

                if (order.paymentStatus === 'paid') {
                    return res.render('user/payment-result', {
                        success: true,
                        message: 'Thanh toán thành công!',
                        order,
                    });
                }

                // Cập nhật trạng thái
                if (responseCode === '00') {
                    order.paymentStatus = 'paid';
                    order.status = 'confirmed';
                } else {
                    order.paymentStatus = 'unpaid';
                    order.status = 'pending';
                }

                await order.save();

                res.render('user/payment-result', {
                    success: responseCode === '00',
                    message: responseCode === '00' ? 'Thanh toán thành công!' : 'Thanh toán thất bại!',
                    order,
                });
            }

        } catch (err) {
            console.error(err);
            res.render('user/payment-result', {
                title: 'Thanh toán',
                success: false,
                message: 'Có lỗi xảy ra khi xử lý thanh toán!',
            });
        }
    }

}

function sortObject(obj) {
    let sorted = {};
    let str = [];
    let key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) {
            str.push(encodeURIComponent(key));
        }
    }
    str.sort();
    for (key = 0; key < str.length; key++) {
        sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
    }
    return sorted;
}
module.exports = new PaymentController();

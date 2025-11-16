const { success, error } = require('../../../helpers/response');

const Order = require('../../../models/order.model');
const OrderItem = require('../../../models/orderItem.model');
const User = require('../../../models/user.model');
const fs = require('fs');
const path = require('path');


class OrdersController {
    async overview(req, res) {
        try {
            const userId = req.user._id;

            // Lấy status từ query
            const statusFilter = req.query.status || "";

            const query = { userId };
            if (statusFilter && statusFilter !== "") {
                query.status = statusFilter;
            }

            // Lấy danh sách đơn theo filter
            const orders = await Order.find(query)
                .sort({ createdAt: -1 })
                .lean();

            // Gắn items + thông tin chi tiết product
            for (let order of orders) {

                const rawItems = await OrderItem.find({ orderId: order._id })
                    .populate({
                        path: "productId",
                        select: "_id name images categoryId",
                        populate: {
                            path: "categoryId",
                            select: "name"
                        }
                    })
                    .lean();

                order.items = rawItems.map(i => {
                    const p = i.productId;
                    return {
                        _id: i._id,
                        productId: p._id,
                        image: p?.images?.[0] || "",
                        name: p?.name || "",
                        categoryName: p?.categoryId?.name || "",
                        price: i.price,
                        qty: i.quantity,
                        total: i.price * i.quantity,
                        reviewed: i.reviewed
                    };
                });

                order.canCancel = order.status === "pending";
                
            }
            res.render("user/orders", {
                title: "Quản lý đơn hàng",
                orders,
                activeStatus: statusFilter
            });

        } catch (err) {
            console.error(err);
            return error(res, 500, 'Có lỗi xảy ra khi lấy danh sách đơn hàng');
        }
    }
    // ========== CHI TIẾT ĐƠN HÀNG ==========
    async detail(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user._id;

            // Lấy thông tin đơn hàng (đảm bảo đúng user)
            const order = await Order.findOne({ _id: id, userId }).lean();
            if (!order) {
                return error(res, 404, "Không tìm thấy đơn hàng hoặc bạn không có quyền truy cập");
            }

            // Lấy thông tin user
            const user = await User.findById(userId)
                .select("-password")
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



            // Lấy chi tiết sản phẩm trong đơn
            const orderItems = await OrderItem.find({ orderId: id })
                .populate({
                    path: "productId",
                    select: "name images categoryId",
                    populate: [
                        { path: "categoryId", select: "name" }
                    ]
                })
                .lean();

            const items = orderItems.map(i => ({
                image: i.productId?.images?.[0] || "",
                name: i.productId?.name || "",
                categoryName: i.productId?.categoryId?.name || "",
                price: i.price,
                quantity: i.quantity,
                total: i.price * i.quantity
            }));

            // Tính tổng tiền
            const totalAmount = items.reduce((sum, i) => sum + i.total, 0);

            // Render ra view chi tiết
            res.render("user/ordersDetail", {
                title: `Chi tiết đơn hàng #${order.code || order._id}`,
                order,
                items,
                user,
                totalAmount,
                fullAddress
            });

        } catch (err) {
            console.error(err);
            return error(res, 500, "Có lỗi xảy ra khi lấy chi tiết đơn hàng");
        }
    }
}

module.exports = new OrdersController();

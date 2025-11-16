// const Order = require('../../../models/order.model');


// class DashboardController {
//     async overview(req, res) {
//         try {
//             // Lấy số lượng theo từng trạng thái
//             const [
//                 pending,
//                 confirmed,
//                 preparing,
//                 shipping,
//                 delivered,
//                 cancelled
//             ] = await Promise.all([
//                 Order.countDocuments({ status: 'pending' }),
//                 Order.countDocuments({ status: 'confirmed' }),
//                 Order.countDocuments({ status: 'preparing' }),
//                 Order.countDocuments({ status: 'shipping' }),
//                 Order.countDocuments({ status: 'delivered' }),
//                 Order.countDocuments({ status: 'cancelled' })
//             ]);

//             res.render('admin/dashboard', {
//                 title: 'Thống kê',
//                 stats: {
//                     pending,
//                     confirmed,
//                     preparing,
//                     shipping,
//                     delivered,
//                     cancelled
//                 }
//             });

//         } catch (err) {
//             console.error('Dashboard Error:', err);
//             res.render('admin/dashboard', {
//                 title: 'Thống kê',
//                 stats: {}
//             });
//         }
//     }
// }

// module.exports = new DashboardController();

const Order = require('../../../models/order.model');

class DashboardController {
    async overview(req, res) {
        try {
            // ===== THỐNG KÊ TRẠNG THÁI =====
            const [
                pending,
                confirmed,
                preparing,
                shipping,
                delivered,
                cancelled
            ] = await Promise.all([
                Order.countDocuments({ status: 'pending' }),
                Order.countDocuments({ status: 'confirmed' }),
                Order.countDocuments({ status: 'preparing' }),
                Order.countDocuments({ status: 'shipping' }),
                Order.countDocuments({ status: 'delivered' }),
                Order.countDocuments({ status: 'cancelled' })
            ]);

            // ===== THỐNG KÊ THANH TOÁN =====
            const [totalOrders, codCount, vnpayCount] = await Promise.all([
                Order.countDocuments(),
                Order.countDocuments({ paymentMethod: 'cod' }),
                Order.countDocuments({ paymentMethod: 'vnpay' })
            ]);

            const paymentStats = {
                cod: {
                    count: codCount,
                    percent: totalOrders ? ((codCount / totalOrders) * 100).toFixed(2) : 0
                },
                vnpay: {
                    count: vnpayCount,
                    percent: totalOrders ? ((vnpayCount / totalOrders) * 100).toFixed(2) : 0
                }
            };

            res.render('admin/dashboard', {
                title: 'Thống kê',
                stats: {
                    pending,
                    confirmed,
                    preparing,
                    shipping,
                    delivered,
                    cancelled
                },
                paymentStats
            });

        } catch (err) {
            console.error('Dashboard Error:', err);
            res.render('admin/dashboard', {
                title: 'Thống kê',
                stats: {},
                paymentStats: {}
            });
        }
    }
}

module.exports = new DashboardController();

// config/vnpay.js
module.exports = {
    vnp_TmnCode: "YOUR_TMN_CODE",       // Mã website do VNPay cung cấp
    vnp_HashSecret: "YOUR_HASH_SECRET", // Hash secret do VNPay cung cấp
    vnp_Url: "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
    vnp_ReturnUrl: "http://localhost:3000/vnpay_return", // callback
};

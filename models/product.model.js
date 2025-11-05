const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

// Định nghĩa schema cho bảng "products"
const ProductSchema = new mongoose.Schema({
    // ID sản phẩm (UUID)
    _id: {
        type: String,
        default: uuidv4,
        required: true
    },

    // ==== Thông tin cơ bản ====
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    details: {        // thông tin chi tiết sản phẩm
        type: String,
        trim: true
    },
    introduction: {   // giới thiệu sản phẩm
        type: String,
        trim: true
    },
    // ==== Tham chiếu tới danh mục/nhãn hiệu/chất liệu ====
    category_id: {
        type: String,
        ref: 'Category',
        required: true
    },
    // ==== Trạng thái sản phẩm ====
    status: {
        type: Number,
        enum: [0, 1], // 0: Vô hiệu hóa | 1: Kích hoạt
        default: 1
    }

}, {
    versionKey: false,   // tắt trường __v của mongoose
    timestamps: true     // tự động thêm createdAt & updatedAt
});

// Export model
module.exports = mongoose.model('Product', ProductSchema, 'products');

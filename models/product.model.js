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
    details: {        // thông tin chi tiết sản phẩm
        type: String,
        trim: true
    },
    introduction: {   // giới thiệu sản phẩm
        type: String,
        trim: true
    },
    displaySuggestion: { // gợi ý trưng bày
        type: String,
        trim: true
    },
    preservationGuide: { // hướng dẫn bảo quản
        type: String,
        trim: true
    },
    images: [{
        type: String,   // URL ảnh (có thể là Cloudinary, local, S3...)
        trim: true
    }],
    categoryId: {
        type: String,
        ref: 'Category',
        required: true
    },
    // ==== Giá bán ====
    price: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    // ==== Trạng thái sản phẩm ====
    isActive: { type: Boolean, default: true },

}, {
    versionKey: false,
    timestamps: true     // tự động thêm createdAt & updatedAt
});

// Export model
module.exports = mongoose.model('Product', ProductSchema, 'products');

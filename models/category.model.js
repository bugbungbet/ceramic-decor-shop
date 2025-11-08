const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

// Định nghĩa schema cho bảng "categories"
const CategorySchema = new mongoose.Schema({
    // ID danh mục (UUID)
    _id: {
        type: String,
        default: uuidv4,
        required: true
    },

    // ==== Thông tin danh mục ====
    name: {
        type: String,
        required: true,
        trim: true
    },
    // ==== Trạng thái danh mục ====
    isActive: {
        type: Boolean,
        default: true,
        index: true
    }

}, {
    versionKey: false,   // tắt trường __v của mongoose
    timestamps: false
});
// Export model
module.exports = mongoose.model('Category', CategorySchema, 'categories');

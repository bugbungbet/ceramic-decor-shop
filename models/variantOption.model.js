const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const VariantOptionSchema = new mongoose.Schema({
    _id: {
        type: String,
        default: uuidv4,
        required: true
    },
    variant_type_id: {
        type: String,
        ref: 'VariantType',
        required: true
    },
    value: { type: String, required: true, trim: true }, // ví dụ: Red, Blue, L, M
    image_url: { type: String } // ảnh đại diện cho tùy chọn, nếu có
}, {
    versionKey: false,
    timestamps: true
});

module.exports.VariantOption = mongoose.model('VariantOption', VariantOptionSchema, 'variantoptions');

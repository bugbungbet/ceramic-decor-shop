const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const VariantTypeSchema = new mongoose.Schema({
    _id: {
        type: String,
        default: uuidv4,
        required: true
    },
    product_id: {
        type: String,
        ref: 'Product',
        required: true
    },
    name: { type: String, required: true, trim: true }, // ví dụ: Color, Size
    // is_required: { type: Boolean, default: true } // bắt buộc chọn hay không
}, {
    versionKey: false,
    timestamps: true
});

module.exports.VariantType = mongoose.model('VariantType', VariantTypeSchema, 'variantTypes');

const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const ProductVariantSchema = new mongoose.Schema({
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
    sku: { type: String, trim: true }, // mã riêng cho từng variant
    price: { type: Number, required: true, min: 0 },
    variant_options: [{ type: String, ref: 'VariantOption' }], // mảng id của các VariantOption
    // image_urls: { type: [String], default: [] } // ảnh riêng của variant
}, {
    versionKey: false,
    timestamps: true
});

module.exports.ProductVariant = mongoose.model('ProductVariant', ProductVariantSchema, 'productVariants');
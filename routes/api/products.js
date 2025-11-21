var express = require('express');
var router = express.Router();

const { asyncHandler } = require('../../utils/index');
const { createUploader } = require('../../middlewares/upload');
const { authAdmin } = require('../../middlewares/checkAuth');

const uploadProduct = createUploader('products');

const ProductsController = require('../../controllers/api/admin/products.controller');

const { validateAddProduct, validateEditProduct, validateDeleteProduct } = require('../../validators/product.validator');

// router.post('/add', authAdmin, uploadProduct.array('images'), validateAddProduct, asyncHandler(ProductsController.add));
router.post('/add',
    authAdmin,
    uploadProduct.array('images'),
    (req, res, next) => {
        console.log(">>> After Multer - BODY:", req.body);
        console.log(">>> After Multer - FILES:", req.files);
        next();
    },
    validateAddProduct,
    asyncHandler(ProductsController.add)
);

router.put('/edit/:id', authAdmin, uploadProduct.array('images'), validateEditProduct, asyncHandler(ProductsController.edit));
router.delete('/delete/:id', authAdmin, validateDeleteProduct, asyncHandler(ProductsController.delete));
router.patch('/:id/toggle', authAdmin, ProductsController.toggle);

router.get('/category/:categoryId', asyncHandler(ProductsController.getByCategory));
router.get('/:id', asyncHandler(ProductsController.getById));


module.exports = router;

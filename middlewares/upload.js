// const multer = require('multer');
// const path = require('path');
// const fs = require('fs');

// // Thư mục lưu file
// const UPLOAD_FOLDER = 'public/uploads/brands';

// // Tạo folder nếu chưa tồn tại
// if (!fs.existsSync(UPLOAD_FOLDER)) {
//     fs.mkdirSync(UPLOAD_FOLDER, { recursive: true });
// }

// // Cấu hình storage Multer
// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         cb(null, UPLOAD_FOLDER);
//     },
//     filename: function (req, file, cb) {
//         const ext = path.extname(file.originalname);
//         const fileName = Date.now() + '-' + file.fieldname + ext;
//         cb(null, fileName);
//     }
// });

// // Lọc file chỉ chấp nhận hình ảnh
// const fileFilter = (req, file, cb) => {
//     const allowed = /jpeg|jpg|png|gif/;
//     const isValidExt = allowed.test(path.extname(file.originalname).toLowerCase());
//     const isValidMime = allowed.test(file.mimetype);
//     if (isValidExt && isValidMime) {
//         cb(null, true);
//     } else {
//         cb(new Error('Chỉ hỗ trợ file hình ảnh'));
//     }
// };

// // Export Multer
// const upload = multer({
//     storage: storage,
//     limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
//     fileFilter: fileFilter
// });

// module.exports = upload;


const multer = require('multer');
const path = require('path');
const fs = require('fs');

function createUploader(folderName = 'common') {
    const UPLOAD_FOLDER = path.join('public/uploads', folderName);

    // Tạo folder nếu chưa tồn tại
    if (!fs.existsSync(UPLOAD_FOLDER)) {
        fs.mkdirSync(UPLOAD_FOLDER, { recursive: true });
    }

    // Cấu hình storage
    const storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, UPLOAD_FOLDER);
        },
        filename: function (req, file, cb) {
            const ext = path.extname(file.originalname);
            const fileName = Date.now() + '-' + file.fieldname + ext;
            cb(null, fileName);
        }
    });

    // Filter ảnh
    const fileFilter = (req, file, cb) => {
        const allowed = /jpeg|jpg|png|gif/;
        const isValidExt = allowed.test(path.extname(file.originalname).toLowerCase());
        const isValidMime = allowed.test(file.mimetype);
        if (isValidExt && isValidMime) {
            cb(null, true);
        } else {
            cb(new Error('Chỉ hỗ trợ file hình ảnh'));
        }
    };

    const upload = multer({
        storage,
        limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
        fileFilter
    });

    return upload;
}

module.exports = { createUploader };

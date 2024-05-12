const multer = require('multer')
const path = require('path')

/* const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
    },
}) */

/* const storage = multer.memoryStorage({
    destination: function(req, file, callback) {
        callback(null, "");
    },
}) */
const storage = multer.memoryStorage()
const upload = multer({ storage: storage });

module.exports = upload
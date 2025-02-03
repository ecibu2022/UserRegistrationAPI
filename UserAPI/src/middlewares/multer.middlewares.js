// Call multer as your middleware to handle files
import multer from "multer";

// Enable Disk Storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Store files in public folder
        cb(null, './public/tmp')
    },
    filename: function (req, file, cb) {
        // const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        // cb(null, file.fieldname + '-' + uniqueSuffix)
        cb(null, file.originalname)
    }
})

// Export it
export const upload = multer({
    storage
})
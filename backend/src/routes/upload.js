const express =require("express")
const { uploadImage }=  require ( "../controllers/uploadController.js");
const { authenticateToken, requireRole } = require('../middleware/auth');
const router = express.Router();
const { upload } = require("../middleware/cloudinaryUpload");
router.post("/",authenticateToken, requireRole(['admin', 'manager']), upload.single("image"), uploadImage);

module.exports =router;

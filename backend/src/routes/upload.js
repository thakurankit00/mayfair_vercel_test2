const express =require("express")
const { uploadImage }=  require ( "../controllers/uploadController.js");
const { authenticateToken, requireRole } = require('../middleware/auth');
const router = express.Router();

router.post("/upload",authenticateToken, requireRole(['admin', 'manager']), uploadImage);

module.exports =router;

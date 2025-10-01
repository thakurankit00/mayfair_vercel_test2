const cloudinary = require('../config/cloudinary');

const uploadImage = async (req, res) => {
  try {
   

    if ( !req.file) {
      return res.status(400).json({ success: false, message: 'No image provided' });
    }

   
    return res.status(200).json({
      success: true,
      url: req.file.path,
      public_id:req.file.filename,
    });
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return res.status(500).json({ success: false, message: 'Upload failed', error: error.message || String(error) });
  }
};

module.exports = { uploadImage };

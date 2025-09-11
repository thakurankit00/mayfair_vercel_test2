const cloudinary = require('../config/cloudinary');

const uploadImage = async (req, res) => {
  try {
    // Accept either base64 via req.body.image or a file via req.file from multer
    const base64Image = req.body?.image;
    const filePath = req.file?.path; // when using multer-storage-cloudinary

    if (!base64Image && !filePath) {
      return res.status(400).json({ success: false, message: 'No image provided' });
    }

    const uploadSource = filePath || base64Image;

    const result = await cloudinary.uploader.upload(uploadSource, {
      folder: 'hotel_management',
      resource_type: 'auto',
    });

    return res.status(200).json({
      success: true,
      url: result.secure_url,
      public_id: result.public_id,
    });
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return res.status(500).json({ success: false, message: 'Upload failed', error: error.message || String(error) });
  }
};

module.exports = { uploadImage };

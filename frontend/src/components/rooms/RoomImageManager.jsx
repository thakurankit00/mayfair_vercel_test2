import React, { useState, useEffect } from 'react';
import ImageUpload from '../common/ImageUpload';
import ImageGallery from '../common/ImageGallery';
import apiServices from '../../services/api';
import { uploadApi } from '../../services/restaurantApi';
import LoadingSpinner from '../common/LoadingSpinner';

const RoomImageManager = ({ roomType, onClose, onImagesUpdated }) => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (roomType?.id) {
      loadImages();
    }
  }, [roomType?.id]);

  const loadImages = async () => {
    try {
      setLoading(true);
      const response = await apiServices.rooms.getRoomImages(roomType.id);
      setImages(response.images || []);
      setError('');
    } catch (err) {
      console.error('Failed to load room images:', err);
      setError('Failed to load room images');
    } finally {
      setLoading(false);
    }
  };

  const handleImagesSelected = (files) => {
    // Just store the selected files, don't upload yet
    setSelectedFiles(files);
    setError('');
    setSuccess('');
  };

  const handleSaveImages = async (filesToUpload) => {
    if (!filesToUpload || filesToUpload.length === 0) return;

    try {
      setUploading(true);
      setError('');
      setSuccess('');

      console.log('🖼️ [Frontend] Preparing to upload files:', filesToUpload);

      // Upload each file to Cloudinary (same as menu items)
      const uploadedImages = [];

      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        console.log(`🖼️ [Frontend] Uploading file ${i + 1}/${filesToUpload.length}:`, file.name);

        try {
          // Convert file to base64 (same as menu item upload)
          const toBase64 = (f) => new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(f);
          });

          const base64 = await toBase64(file);
          console.log('🖼️ [Frontend] Converting to base64 and uploading to Cloudinary...');

          // Upload to Cloudinary using the same API as menu items
          const cloudinaryResponse = await uploadApi.uploadImage(base64);
          console.log('🖼️ [Frontend] Cloudinary response:', cloudinaryResponse);

          if (cloudinaryResponse?.success && cloudinaryResponse?.url) {
            uploadedImages.push({
              url: cloudinaryResponse.url,
              public_id: cloudinaryResponse.public_id,
              alt_text: `${roomType.name} room image`,
              is_primary: images.length === 0 && i === 0 // First image is primary if no existing images
            });
            console.log('🖼️ [Frontend] Image uploaded successfully:', cloudinaryResponse.url);
          } else {
            throw new Error(cloudinaryResponse?.message || 'Cloudinary upload failed');
          }
        } catch (fileError) {
          console.error(`🖼️ [Frontend] Failed to upload file ${file.name}:`, fileError);
          throw new Error(`Failed to upload ${file.name}: ${fileError.message}`);
        }
      }

      // Now save the uploaded image URLs to the database
      console.log('🖼️ [Frontend] Saving image URLs to database:', uploadedImages);

      // Create FormData with the Cloudinary URLs
      const formData = new FormData();
      formData.append('room_type_id', roomType.id);

      // Create arrays for multiple images
      const imageUrls = uploadedImages.map(img => img.url);
      const altTexts = uploadedImages.map(img => img.alt_text);
      const isPrimaryFlags = uploadedImages.map(img => img.is_primary);

      console.log('🖼️ [Frontend] Preparing FormData with arrays:');
      console.log('  - imageUrls:', imageUrls);
      console.log('  - altTexts:', altTexts);
      console.log('  - isPrimaryFlags:', isPrimaryFlags);

      // Append arrays to FormData - Express will parse these as arrays
      imageUrls.forEach(url => formData.append('image_urls[]', url));
      altTexts.forEach(text => formData.append('alt_texts[]', text));
      isPrimaryFlags.forEach(flag => formData.append('is_primary[]', flag));

      const response = await apiServices.rooms.uploadRoomImages(formData);
      console.log('🖼️ [Frontend] Database save response:', response);

      // Clear selected files and show success
      setSelectedFiles([]);
      setSuccess(`Successfully uploaded ${filesToUpload.length} image${filesToUpload.length !== 1 ? 's' : ''}!`);

      // Reload images to get updated list
      await loadImages();

      if (onImagesUpdated) {
        onImagesUpdated();
      }

    } catch (err) {
      console.error('❌ [Frontend] Failed to upload images:', err);
      setError(err.message || 'Failed to upload images');
    } finally {
      setUploading(false);
    }
  };

  const handleSetPrimary = async (imageId) => {
    try {
      await apiServices.rooms.updateRoomImage(imageId, { is_primary: true });
      await loadImages();
      
      if (onImagesUpdated) {
        onImagesUpdated();
      }
    } catch (err) {
      console.error('Failed to set primary image:', err);
      setError('Failed to set primary image');
    }
  };

  const handleDeleteImage = async (imageId) => {
    try {
      await apiServices.rooms.deleteRoomImage(imageId);
      await loadImages();
      
      if (onImagesUpdated) {
        onImagesUpdated();
      }
    } catch (err) {
      console.error('Failed to delete image:', err);
      setError('Failed to delete image');
    }
  };

  if (!roomType) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Manage Images - {roomType.name}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Upload and manage images for this room type
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <div className="text-sm text-green-800">{success}</div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="text-sm text-red-800">{error}</div>
            </div>
          )}

          {/* Upload Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Upload New Images</h3>

            <ImageUpload
              onImagesSelected={handleImagesSelected}
              onSaveImages={handleSaveImages}
              maxFiles={10}
              existingImages={images}
              disabled={uploading}
              uploading={uploading}
              className="border rounded-lg p-4"
            />
          </div>

          {/* Current Images */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">
              Current Images ({images.length})
            </h3>
            
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : images.length > 0 ? (
              <ImageGallery
                images={images}
                onImageDelete={handleDeleteImage}
                onSetPrimary={handleSetPrimary}
                showControls={true}
                maxHeight="300px"
              />
            ) : (
              <div className="text-center py-12 text-gray-500">
                <div className="text-4xl mb-2">🖼️</div>
                <div className="text-lg font-medium">No images uploaded yet</div>
                <div className="text-sm">Upload some images to get started</div>
              </div>
            )}
          </div>

          {/* Room Type Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Room Type Details</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Name:</span> {roomType.name}
              </div>
              <div>
                <span className="text-gray-600">Base Price:</span> ₹{roomType.base_price}
              </div>
              <div>
                <span className="text-gray-600">Max Occupancy:</span> {roomType.max_occupancy}
              </div>
              <div>
                <span className="text-gray-600">Total Rooms:</span> {roomType.totalRooms || 0}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoomImageManager;

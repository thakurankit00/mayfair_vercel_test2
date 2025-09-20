import React, { useState } from 'react';

const ImageGallery = ({ 
  images = [], 
  onImageDelete, 
  onImageUpdate,
  onSetPrimary,
  showControls = false,
  className = '',
  maxHeight = '400px'
}) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [showLightbox, setShowLightbox] = useState(false);

  if (!images || images.length === 0) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`} style={{ height: maxHeight }}>
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-2">🖼️</div>
          <div className="text-sm">No images available</div>
        </div>
      </div>
    );
  }

  const primaryImage = images.find(img => img.is_primary) || images[0];
  const thumbnailImages = images.filter(img => img.id !== primaryImage.id);

  const openLightbox = (image) => {
    setSelectedImage(image);
    setShowLightbox(true);
  };

  const closeLightbox = () => {
    setShowLightbox(false);
    setSelectedImage(null);
  };

  const handleSetPrimary = (imageId) => {
    if (onSetPrimary) {
      onSetPrimary(imageId);
    }
  };

  const handleDelete = (imageId) => {
    if (onImageDelete && window.confirm('Are you sure you want to delete this image?')) {
      onImageDelete(imageId);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Image */}
      <div className="relative group">
        <div 
          className="w-full bg-gray-100 rounded-lg overflow-hidden cursor-pointer"
          style={{ height: maxHeight }}
          onClick={() => openLightbox(primaryImage)}
        >
          <img
            src={primaryImage.image_url}
            alt={primaryImage.alt_text || 'Room image'}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        </div>
        
        {/* Primary Image Badge */}
        {primaryImage.is_primary && (
          <div className="absolute top-3 left-3 bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium">
            Primary
          </div>
        )}

        {/* Image Controls */}
        {showControls && (
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex space-x-2">
              {!primaryImage.is_primary && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSetPrimary(primaryImage.id);
                  }}
                  className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-xs"
                  title="Set as primary"
                >
                  ⭐
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(primaryImage.id);
                }}
                className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs"
                title="Delete image"
              >
                🗑️
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Thumbnail Images */}
      {thumbnailImages.length > 0 && (
        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
          {thumbnailImages.map((image) => (
            <div key={image.id} className="relative group">
              <div 
                className="aspect-square bg-gray-100 rounded overflow-hidden cursor-pointer"
                onClick={() => openLightbox(image)}
              >
                <img
                  src={image.thumbnail_url || image.image_url}
                  alt={image.alt_text || 'Room image'}
                  className="w-full h-full object-cover hover:scale-110 transition-transform duration-200"
                />
              </div>
              
              {/* Thumbnail Controls */}
              {showControls && (
                <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSetPrimary(image.id);
                    }}
                    className="bg-green-500 hover:bg-green-600 text-white p-1 rounded text-xs"
                    title="Set as primary"
                  >
                    ⭐
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(image.id);
                    }}
                    className="bg-red-500 hover:bg-red-600 text-white p-1 rounded text-xs"
                    title="Delete image"
                  >
                    🗑️
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Image Counter */}
      <div className="text-sm text-gray-500 text-center">
        {images.length} image{images.length !== 1 ? 's' : ''}
      </div>

      {/* Lightbox Modal */}
      {showLightbox && selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-full">
            {/* Close Button */}
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 text-white text-2xl hover:text-gray-300 z-10"
            >
              ×
            </button>
            
            {/* Image */}
            <img
              src={selectedImage.image_url}
              alt={selectedImage.alt_text || 'Room image'}
              className="max-w-full max-h-full object-contain"
            />
            
            {/* Image Info */}
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <div className="bg-black bg-opacity-50 rounded p-3">
                <div className="font-medium">
                  {selectedImage.alt_text || 'Room Image'}
                  {selectedImage.is_primary && (
                    <span className="ml-2 bg-blue-500 px-2 py-1 rounded text-xs">Primary</span>
                  )}
                </div>
                <div className="text-sm text-gray-300 mt-1">
                  {selectedImage.width} × {selectedImage.height} • 
                  {(selectedImage.file_size / 1024 / 1024).toFixed(1)} MB
                </div>
              </div>
            </div>

            {/* Navigation */}
            {images.length > 1 && (
              <>
                <button
                  onClick={() => {
                    const currentIndex = images.findIndex(img => img.id === selectedImage.id);
                    const prevIndex = currentIndex > 0 ? currentIndex - 1 : images.length - 1;
                    setSelectedImage(images[prevIndex]);
                  }}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white text-3xl hover:text-gray-300"
                >
                  ‹
                </button>
                <button
                  onClick={() => {
                    const currentIndex = images.findIndex(img => img.id === selectedImage.id);
                    const nextIndex = currentIndex < images.length - 1 ? currentIndex + 1 : 0;
                    setSelectedImage(images[nextIndex]);
                  }}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white text-3xl hover:text-gray-300"
                >
                  ›
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageGallery;

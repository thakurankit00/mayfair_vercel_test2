import React, { useState, useRef, useCallback } from 'react';

const ImageUpload = ({
  onImagesSelected,
  onSaveImages,
  maxFiles = 10,
  maxFileSize = 10 * 1024 * 1024, // 10MB
  acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  existingImages = [],
  disabled = false,
  uploading = false,
  className = ''
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [errors, setErrors] = useState([]);
  const fileInputRef = useRef(null);

  // Validate file
  const validateFile = (file) => {
    const errors = [];
    
    if (!acceptedTypes.includes(file.type)) {
      errors.push(`${file.name}: Invalid file type. Only JPEG, PNG, and WebP images are allowed.`);
    }
    
    if (file.size > maxFileSize) {
      errors.push(`${file.name}: File size exceeds ${Math.round(maxFileSize / (1024 * 1024))}MB limit.`);
    }
    
    return errors;
  };

  // Create preview for file
  const createPreview = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve({
          id: `preview-${Date.now()}-${Math.random()}`,
          file,
          url: e.target.result,
          name: file.name,
          size: file.size,
          type: file.type
        });
      };
      reader.readAsDataURL(file);
    });
  };

  // Process selected files
  const processFiles = useCallback(async (files) => {
    const fileArray = Array.from(files);
    const totalFiles = selectedFiles.length + existingImages.length + fileArray.length;
    
    if (totalFiles > maxFiles) {
      setErrors([`Maximum ${maxFiles} images allowed. You can upload ${maxFiles - selectedFiles.length - existingImages.length} more images.`]);
      return;
    }

    const validationErrors = [];
    const validFiles = [];

    // Validate each file
    fileArray.forEach(file => {
      const fileErrors = validateFile(file);
      if (fileErrors.length > 0) {
        validationErrors.push(...fileErrors);
      } else {
        validFiles.push(file);
      }
    });

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Create previews for valid files
    const newPreviews = await Promise.all(validFiles.map(createPreview));
    const updatedFiles = [...selectedFiles, ...validFiles];
    const updatedPreviews = [...previews, ...newPreviews];

    setSelectedFiles(updatedFiles);
    setPreviews(updatedPreviews);
    setErrors([]);

    // Notify parent component (but don't auto-upload)
    if (onImagesSelected) {
      onImagesSelected(updatedFiles);
    }
  }, [selectedFiles, previews, existingImages.length, maxFiles, onImagesSelected]);

  // Handle drag events
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (disabled) return;
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFiles(e.dataTransfer.files);
    }
  }, [disabled, processFiles]);

  // Handle file input change
  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFiles(e.target.files);
    }
  };

  // Remove preview
  const removePreview = (previewId) => {
    const updatedPreviews = previews.filter(preview => preview.id !== previewId);
    const updatedFiles = selectedFiles.filter((_, index) => previews[index]?.id !== previewId);
    
    setPreviews(updatedPreviews);
    setSelectedFiles(updatedFiles);
    
    if (onImagesSelected) {
      onImagesSelected(updatedFiles);
    }
  };

  // Clear all selections
  const clearAll = () => {
    setSelectedFiles([]);
    setPreviews([]);
    setErrors([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (onImagesSelected) {
      onImagesSelected([]);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center transition-colors
          ${dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-gray-400'}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled}
        />
        
        <div className="space-y-2">
          <div className="text-4xl text-gray-400">📷</div>
          <div className="text-lg font-medium text-gray-700">
            {dragActive ? 'Drop images here' : 'Upload Room Images'}
          </div>
          <div className="text-sm text-gray-500">
            Drag and drop images here, or click to select files
          </div>
          <div className="text-xs text-gray-400">
            Supports JPEG, PNG, WebP • Max {Math.round(maxFileSize / (1024 * 1024))}MB per file • Up to {maxFiles} images
          </div>
        </div>
      </div>

      {/* Error Messages */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <div className="text-sm text-red-800">
            <div className="font-medium mb-1">Upload Errors:</div>
            <ul className="list-disc list-inside space-y-1">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* File Previews */}
      {previews.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-700">
              Selected Images ({previews.length})
            </h4>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={clearAll}
                className="text-sm text-red-600 hover:text-red-800"
                disabled={uploading}
              >
                Clear All
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {previews.map((preview) => (
              <div key={preview.id} className="relative group">
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={preview.url}
                    alt={preview.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => removePreview(preview.id)}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ×
                </button>
                
                {/* File info */}
                <div className="mt-2 text-xs text-gray-500 truncate">
                  {preview.name}
                </div>
                <div className="text-xs text-gray-400">
                  {(preview.size / 1024 / 1024).toFixed(1)} MB
                </div>
              </div>
            ))}
          </div>

          {/* Save Button */}
          <div className="flex justify-center pt-4">
            <button
              type="button"
              onClick={() => onSaveImages && onSaveImages(selectedFiles)}
              disabled={uploading || selectedFiles.length === 0}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                uploading || selectedFiles.length === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {uploading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Uploading...</span>
                </div>
              ) : (
                `Save ${selectedFiles.length} Image${selectedFiles.length !== 1 ? 's' : ''}`
              )}
            </button>
          </div>
        </div>
      )}

      {/* Existing Images Info */}
      {existingImages.length > 0 && (
        <div className="text-sm text-gray-600">
          {existingImages.length} existing image{existingImages.length !== 1 ? 's' : ''} •
          {maxFiles - existingImages.length - selectedFiles.length} more can be added
        </div>
      )}
    </div>
  );
};

export default ImageUpload;

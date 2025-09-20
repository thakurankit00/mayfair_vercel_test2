const db = require('../config/database');
const { processAndStoreImage, deleteImageFile } = require('../middleware/upload');
const path = require('path');

const roomController = {
  // Get occupied rooms for room service
  getOccupiedRooms: async (req, res) => {
    try {
      const occupiedRooms = await db('room_bookings as rb')
        .select(
          'rb.id',
          'r.room_number',
          'r.floor',
          'rb.guest_info',
          'rb.check_in_date',
          'rb.check_out_date',
          'rb.status as booking_status'
        )
        .join('rooms as r', 'rb.room_id', 'r.id')
        .where('rb.status', 'checked_in')
        .orderBy('r.room_number', 'asc');

      // Parse guest_info JSON and format the response
      const formattedRooms = occupiedRooms.map(room => {
        let guestInfo = {};
        if (room.guest_info) {
          try {
            guestInfo = typeof room.guest_info === 'string'
              ? JSON.parse(room.guest_info)
              : room.guest_info;
          } catch (e) {
            console.error('Error parsing guest_info:', e);
            guestInfo = {};
          }
        }

        return {
          id: room.id,
          room_number: room.room_number,
          floor: room.floor,
          guest_first_name: guestInfo.first_name || 'Guest',
          guest_last_name: guestInfo.last_name || 'User',
          guest_phone: guestInfo.phone || '',
          guest_email: guestInfo.email || '',
          check_in_date: room.check_in_date,
          check_out_date: room.check_out_date,
          booking_status: room.booking_status
        };
      });

      res.json({
        success: true,
        rooms: formattedRooms
      });
    } catch (error) {
      console.error('Error fetching occupied rooms: - roomController.js:33', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch occupied rooms'
      });
    }
  },

  // Get room by ID
  getRoomById: async (req, res) => {
    try {
      const { id } = req.params;

      // Use Knex.js syntax instead of raw SQL
      const result = await db('rooms as r')
        .select(
          'r.*',
          'b.guest_first_name',
          'b.guest_last_name',
          'b.guest_phone',
          'b.guest_email',
          'b.check_in_date',
          'b.check_out_date',
          'b.status as booking_status'
        )
        .leftJoin('bookings as b', function() {
          this.on('r.id', '=', 'b.room_id')
              .andOn('b.status', '=', db.raw('?', ['checked_in']))
              .andOn('b.check_in_date', '<=', db.raw('CURRENT_DATE'))
              .andOn('b.check_out_date', '>', db.raw('CURRENT_DATE'));
        })
        .where('r.id', id)
        .first();

      if (!result) {
        return res.status(404).json({
          success: false,
          message: 'Room not found'
        });
      }

      res.json({
        success: true,
        room: result
      });
    } catch (error) {
      console.error('Error fetching room:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch room details'
      });
    }
  },

  // Check room availability
  checkAvailability: async (req, res) => {
    try {
      // Handle both parameter naming conventions
      const checkIn = req.query.checkIn || req.query.checkInDate;
      const checkOut = req.query.checkOut || req.query.checkOutDate;
      const adults = parseInt(req.query.adults) || 1;
      const children = parseInt(req.query.children) || 0;
      const roomType = req.query.roomType;

      if (!checkIn || !checkOut) {
        return res.status(400).json({
          success: false,
          message: 'Check-in and check-out dates are required'
        });
      }

      // Calculate nights and pricing
      const checkInDate = new Date(checkIn);
      const checkOutDate = new Date(checkOut);
      const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));

      if (nights <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Check-out date must be after check-in date'
        });
      }

      // Get available room types with pricing
      const roomTypes = await db('room_types as rt')
        .select(
          'rt.id',
          'rt.name',
          'rt.description',
          'rt.base_price',
          'rt.max_occupancy',
          'rt.amenities',
          'rt.images',
          db.raw('COUNT(r.id) as total_rooms'),
          db.raw(`COUNT(CASE WHEN r.status = 'available' AND r.id NOT IN (
            SELECT rb.room_id FROM room_bookings rb
            WHERE rb.status IN ('confirmed', 'checked_in', 'pending')
            AND (
              (rb.check_in_date <= ? AND rb.check_out_date > ?) OR
              (rb.check_in_date < ? AND rb.check_out_date >= ?) OR
              (rb.check_in_date >= ? AND rb.check_out_date <= ?)
            )
          ) THEN 1 END) as available_count`, [checkIn, checkIn, checkOut, checkOut, checkIn, checkOut])
        )
        .leftJoin('rooms as r', 'rt.id', 'r.room_type_id')
        .where('rt.is_active', true)
        .where('rt.max_occupancy', '>=', adults + children)
        .groupBy('rt.id', 'rt.name', 'rt.description', 'rt.base_price', 'rt.max_occupancy', 'rt.amenities', 'rt.images', 'rt.is_active', 'rt.created_at', 'rt.updated_at')
        .having(db.raw('COUNT(CASE WHEN r.status = \'available\' THEN 1 END)'), '>', 0)
        .orderBy('rt.base_price');

      if (roomType) {
        roomTypes.where('rt.id', roomType);
      }

      const availableRoomTypes = await roomTypes;

      // Add pricing information to each room type
      const roomsWithPricing = availableRoomTypes.map(roomType => {
        const basePrice = parseFloat(roomType.base_price);
        const totalPrice = basePrice * nights;
        const taxes = Math.round(totalPrice * 0.12 * 100) / 100; // 12% tax

        return {
          id: roomType.id,
          name: roomType.name,
          description: roomType.description,
          capacity: roomType.max_occupancy,
          max_occupancy: roomType.max_occupancy,
          amenities: roomType.amenities,
          images: roomType.images,
          totalRooms: parseInt(roomType.total_rooms) || 0,
          availableCount: parseInt(roomType.available_count) || 0,
          pricing: {
            basePrice: basePrice,
            pricePerNight: basePrice,
            totalPrice: totalPrice,
            nights: nights,
            taxes: taxes,
            totalWithTax: Math.round((totalPrice + taxes) * 100) / 100
          }
        };
      });

      res.json({
        success: true,
        availableRooms: roomsWithPricing,
        totalRooms: roomsWithPricing.length
      });
    } catch (error) {
      console.error('❌ [AVAILABILITY] Error checking availability:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check room availability',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Search rooms (alias for checkAvailability)
  searchRooms: async (req, res) => {
    return roomController.checkAvailability(req, res);
  },

  // Get room types
  getRoomTypes: async (req, res) => {
    try {
      const roomTypes = await db('room_types as rt')
        .select(
          'rt.*',
          db.raw('COUNT(r.id) as total_rooms'),
          db.raw("COUNT(CASE WHEN r.status = 'available' THEN 1 END) as available_rooms")
        )
        .leftJoin('rooms as r', 'rt.id', 'r.room_type_id')
        .where('rt.is_active', true)
        .groupBy('rt.id', 'rt.name', 'rt.description', 'rt.base_price', 'rt.max_occupancy', 'rt.amenities', 'rt.images', 'rt.is_active', 'rt.created_at', 'rt.updated_at')
        .orderBy('rt.name');

      res.json(roomTypes);
    } catch (error) {
      console.error('Error fetching room types: - roomController.js:149', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch room types'
      });
    }
  },

  // Get room type by ID
  getRoomTypeById: async (req, res) => {
    try {
      const { id } = req.params;

      const roomType = await db('room_types as rt')
        .select(
          'rt.*',
          db.raw('COUNT(r.id) as total_rooms'),
          db.raw("COUNT(CASE WHEN r.status = 'available' THEN 1 END) as available_rooms")
        )
        .leftJoin('rooms as r', 'rt.id', 'r.room_type_id')
        .where('rt.id', id)
        .where('rt.is_active', true)
        .groupBy('rt.id', 'rt.name', 'rt.description', 'rt.base_price', 'rt.max_occupancy', 'rt.amenities', 'rt.images', 'rt.is_active', 'rt.created_at', 'rt.updated_at')
        .first();

      if (!roomType) {
        return res.status(404).json({
          success: false,
          message: 'Room type not found'
        });
      }

      res.json(roomType);
    } catch (error) {
      console.error('Error fetching room type: - roomController.js:186', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch room type'
      });
    }
  },

  // Create room type
  createRoomType: async (req, res) => {
    try {
      const { name, description, base_price, max_occupancy, amenities } = req.body;
      
      const query = `
        INSERT INTO room_types (name, description, base_price, max_occupancy, amenities)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;
      
      const result = await db.query(query, [name, description, base_price, max_occupancy, amenities]);
      
      res.status(201).json({
        success: true,
        roomType: result.rows[0]
      });
    } catch (error) {
      console.error('Error creating room type: - roomController.js:212', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create room type'
      });
    }
  },

  // Update room type
  updateRoomType: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description, base_price, max_occupancy, amenities } = req.body;
      
      const query = `
        UPDATE room_types 
        SET name = $1, description = $2, base_price = $3, max_occupancy = $4, amenities = $5, updated_at = CURRENT_TIMESTAMP
        WHERE id = $6
        RETURNING *
      `;
      
      const result = await db.query(query, [name, description, base_price, max_occupancy, amenities, id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Room type not found'
        });
      }
      
      res.json({
        success: true,
        roomType: result.rows[0]
      });
    } catch (error) {
      console.error('Error updating room type: - roomController.js:247', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update room type'
      });
    }
  },

  // Delete room type
  deleteRoomType: async (req, res) => {
    try {
      const { id } = req.params;
      
      const query = `DELETE FROM room_types WHERE id = $1 RETURNING *`;
      const result = await db.query(query, [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Room type not found'
        });
      }
      
      res.json({
        success: true,
        message: 'Room type deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting room type: - roomController.js:275', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete room type'
      });
    }
  },

  // Bulk update prices
  bulkUpdatePrices: async (req, res) => {
    try {
      const { updates } = req.body; // Array of {id, base_price}
      
      const client = await db.getClient();
      await client.query('BEGIN');
      
      try {
        for (const update of updates) {
          await client.query(
            'UPDATE room_types SET base_price = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [update.base_price, update.id]
          );
        }
        
        await client.query('COMMIT');
        
        res.json({
          success: true,
          message: 'Prices updated successfully'
        });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error bulk updating prices: - roomController.js:312', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update prices'
      });
    }
  },

  // Upload room images
  uploadRoomImages: async (req, res) => {
    try {
      console.log('🖼️ [Backend] Upload request received');
      console.log('🖼️ [Backend] Request body:', req.body);
      console.log('🖼️ [Backend] Request files:', req.files);
      console.log('🖼️ [Backend] Request file:', req.file);

      const { room_type_id, room_id } = req.body;

      // Check if we're receiving Cloudinary URLs (new approach) or files (old approach)
      // Handle both array formats: image_urls[] and image_urls
      const imageUrls = req.body['image_urls[]'] || req.body.image_urls;
      const altTexts = req.body['alt_texts[]'] || req.body.alt_texts;
      const isPrimaryFlags = req.body['is_primary[]'] || req.body.is_primary;
      const files = req.files || (req.file ? [req.file] : []);

      console.log('🖼️ [Backend] Parsed data:');
      console.log('  - room_type_id:', room_type_id);
      console.log('  - imageUrls:', imageUrls);
      console.log('  - altTexts:', altTexts);
      console.log('  - isPrimaryFlags:', isPrimaryFlags);
      console.log('  - files:', files?.length || 0);

      // Handle Cloudinary URLs (new approach - same as menu items)
      if (imageUrls && Array.isArray(imageUrls) && imageUrls.length > 0) {
        console.log('🖼️ [Backend] Processing Cloudinary URLs:', imageUrls);

        const uploadedImages = [];

        for (let i = 0; i < imageUrls.length; i++) {
          const imageUrl = imageUrls[i];
          const altText = Array.isArray(altTexts) ? altTexts[i] : altTexts;
          const isPrimary = Array.isArray(isPrimaryFlags) ? isPrimaryFlags[i] === 'true' : isPrimaryFlags === 'true';

          try {
            // Generate UUID for the image
            const { v4: uuidv4 } = require('uuid');
            const imageId = uuidv4();

            // Save image info to database
            const imageData = {
              id: imageId,
              room_type_id: room_type_id || null,
              room_id: room_id || null,
              image_url: imageUrl,
              image_path: null, // Cloudinary URLs don't have local paths
              original_filename: `cloudinary_image_${i + 1}.jpg`,
              file_size: null, // We don't know the file size from Cloudinary URL
              mime_type: 'image/jpeg',
              width: null, // We could fetch this from Cloudinary if needed
              height: null,
              is_primary: isPrimary,
              display_order: i,
              alt_text: altText || `${room_type_id ? 'Room type' : 'Room'} image ${i + 1}`,
              created_at: new Date(),
              updated_at: new Date()
            };

            await db('room_images').insert(imageData);
            uploadedImages.push(imageData);

            console.log(`🖼️ [Backend] Saved image ${i + 1} to database:`, imageUrl);

          } catch (error) {
            console.error(`🖼️ [Backend] Error saving image ${i + 1}:`, error);
            // Continue with other images, but log the error
          }
        }

        if (uploadedImages.length === 0) {
          return res.status(500).json({
            success: false,
            error: {
              code: 'UPLOAD_FAILED',
              message: 'Failed to save any images to database'
            }
          });
        }

        return res.status(201).json({
          success: true,
          data: {
            images: uploadedImages,
            uploaded_count: uploadedImages.length,
            total_urls: imageUrls.length
          }
        });
      }

      // Handle file uploads (old approach - fallback)
      if (!files || files.length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'NO_FILES_OR_URLS',
            message: 'No image files or URLs were provided'
          }
        });
      }

      console.log('🖼️ [Backend] Processing file uploads (fallback):', files.length);

      const uploadedImages = [];

      // Process each uploaded file (old approach)
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        try {
          // Process and store the image
          const processedImage = await processAndStoreImage(file, {
            width: 1200,
            height: 800,
            quality: 85,
            format: 'jpeg',
            folder: 'rooms'
          });

          // Save image info to database
          const imageData = {
            id: processedImage.id,
            room_type_id: room_type_id || null,
            room_id: room_id || null,
            image_url: processedImage.url,
            image_path: processedImage.relativePath,
            original_filename: processedImage.originalName,
            file_size: processedImage.size,
            mime_type: processedImage.mimeType,
            width: processedImage.width,
            height: processedImage.height,
            is_primary: i === 0 && req.body.is_primary === 'true',
            display_order: i,
            alt_text: req.body.alt_text || `${room_type_id ? 'Room type' : 'Room'} image ${i + 1}`
          };

          await db('room_images').insert(imageData);
          uploadedImages.push({
            ...imageData,
            thumbnail_url: processedImage.thumbnailUrl
          });

        } catch (error) {
          console.error(`Error processing file ${file.originalname}:`, error);
          // Continue with other files, but log the error
        }
      }

      if (uploadedImages.length === 0) {
        return res.status(500).json({
          success: false,
          error: {
            code: 'UPLOAD_FAILED',
            message: 'Failed to upload any images'
          }
        });
      }

      res.status(201).json({
        success: true,
        data: {
          images: uploadedImages,
          uploaded_count: uploadedImages.length,
          total_files: files.length
        }
      });

    } catch (error) {
      console.error('Upload room images error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'UPLOAD_ERROR',
          message: error.message || 'Failed to upload room images'
        }
      });
    }
  },

  // Get room images
  getRoomImages: async (req, res) => {
    try {
      const { room_type_id, room_id } = req.query;

      if (!room_type_id && !room_id) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_REFERENCE',
            message: 'Either room_type_id or room_id must be provided'
          }
        });
      }

      let query = db('room_images').select('*');

      if (room_type_id) {
        query = query.where('room_type_id', room_type_id);
      } else {
        query = query.where('room_id', room_id);
      }

      const images = await query.orderBy('display_order', 'asc').orderBy('created_at', 'asc');

      // Add thumbnail URLs
      const imagesWithThumbnails = images.map(image => ({
        ...image,
        thumbnail_url: image.image_url.replace('/uploads/rooms/', '/uploads/rooms/thumbnails/thumb_')
      }));

      res.json({
        success: true,
        data: {
          images: imagesWithThumbnails,
          total_count: images.length
        }
      });

    } catch (error) {
      console.error('Get room images error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: error.message || 'Failed to fetch room images'
        }
      });
    }
  },

  // Delete room image
  deleteRoomImage: async (req, res) => {
    try {
      const { imageId } = req.params;

      // Get image info before deletion
      const image = await db('room_images').where('id', imageId).first();

      if (!image) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'IMAGE_NOT_FOUND',
            message: 'Image not found'
          }
        });
      }

      // Delete from database first
      await db('room_images').where('id', imageId).del();

      // Delete physical file
      try {
        const fullPath = path.join(__dirname, '../../', image.image_path);
        await deleteImageFile(fullPath);
      } catch (fileError) {
        console.error('Error deleting physical file:', fileError);
        // Continue even if file deletion fails
      }

      res.json({
        success: true,
        data: {
          message: 'Image deleted successfully',
          deleted_image: image
        }
      });

    } catch (error) {
      console.error('Delete room image error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'DELETE_ERROR',
          message: error.message || 'Failed to delete room image'
        }
      });
    }
  },

  // Update room image (set as primary, update alt text, etc.)
  updateRoomImage: async (req, res) => {
    try {
      const { imageId } = req.params;
      const { is_primary, alt_text, display_order } = req.body;

      // Check if image exists
      const existingImage = await db('room_images').where('id', imageId).first();

      if (!existingImage) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'IMAGE_NOT_FOUND',
            message: 'Image not found'
          }
        });
      }

      const updateData = {};

      if (is_primary !== undefined) {
        updateData.is_primary = is_primary;

        // If setting as primary, unset other primary images for the same room/room_type
        if (is_primary) {
          if (existingImage.room_type_id) {
            await db('room_images')
              .where('room_type_id', existingImage.room_type_id)
              .where('id', '!=', imageId)
              .update({ is_primary: false });
          } else if (existingImage.room_id) {
            await db('room_images')
              .where('room_id', existingImage.room_id)
              .where('id', '!=', imageId)
              .update({ is_primary: false });
          }
        }
      }

      if (alt_text !== undefined) {
        updateData.alt_text = alt_text;
      }

      if (display_order !== undefined) {
        updateData.display_order = display_order;
      }

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'NO_UPDATE_DATA',
            message: 'No valid update data provided'
          }
        });
      }

      updateData.updated_at = new Date();

      await db('room_images').where('id', imageId).update(updateData);

      // Get updated image
      const updatedImage = await db('room_images').where('id', imageId).first();

      res.json({
        success: true,
        data: {
          image: {
            ...updatedImage,
            thumbnail_url: updatedImage.image_url.replace('/uploads/rooms/', '/uploads/rooms/thumbnails/thumb_')
          }
        }
      });

    } catch (error) {
      console.error('Update room image error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'UPDATE_ERROR',
          message: error.message || 'Failed to update room image'
        }
      });
    }
  }

};

module.exports = roomController;
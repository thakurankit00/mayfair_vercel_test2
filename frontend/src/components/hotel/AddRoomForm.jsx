import React, { useState, useEffect } from 'react';
import { roomApi, roomTypeApi } from '../../services/hotelApi';

const AddRoomForm = ({ 
  room = null, 
  onClose, 
  onSave 
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [roomTypes, setRoomTypes] = useState([]);
  const [formData, setFormData] = useState({
    room_number: '',
    room_type_id: '',
    floor: '',
    status: 'available',
    description: '',
    max_occupancy: '',
    base_price: '',
    amenities: []
  });

  // Load room types on mount
  useEffect(() => {
    const loadRoomTypes = async () => {
      try {
        const data = await roomTypeApi.getRoomTypes();
        setRoomTypes(data.roomTypes || []);
      } catch (err) {
        console.error('Failed to load room types:', err);
      }
    };
    loadRoomTypes();
  }, []);

  // Set form data if editing existing room
  useEffect(() => {
    if (room) {
      setFormData({
        room_number: room.room_number || '',
        room_type_id: room.room_type_id || '',
        floor: room.floor || '',
        status: room.status || 'available',
        description: room.description || '',
        max_occupancy: room.max_occupancy || '',
        base_price: room.base_price || '',
        amenities: room.amenities || []
      });
    }
  }, [room]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'amenities') {
      if (checked) {
        setFormData(prev => ({
          ...prev,
          amenities: [...prev.amenities, value]
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          amenities: prev.amenities.filter(amenity => amenity !== value)
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate required fields
      if (!formData.room_number || !formData.room_type_id || !formData.floor) {
        throw new Error('Please fill in all required fields');
      }

      if (parseInt(formData.max_occupancy) < 1) {
        throw new Error('Max occupancy must be at least 1');
      }

      if (parseFloat(formData.base_price) < 0) {
        throw new Error('Base price cannot be negative');
      }

      // Prepare data for API
      const roomData = {
        ...formData,
        floor: parseInt(formData.floor),
        max_occupancy: parseInt(formData.max_occupancy),
        base_price: parseFloat(formData.base_price)
      };

      if (room && room.id) {
        // Update existing room
        await roomApi.updateRoom(room.id, roomData);
      } else {
        // Create new room
        await roomApi.createRoom(roomData);
      }

      // Call onSave callback to refresh data
      if (onSave) {
        await onSave();
      }

      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save room');
    } finally {
      setLoading(false);
    }
  };

  const statusOptions = [
    { value: 'available', label: 'Available' },
    { value: 'occupied', label: 'Occupied' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'cleaning', label: 'Cleaning' },
    { value: 'out_of_order', label: 'Out of Order' }
  ];

  const amenityOptions = [
    { value: 'wifi', label: 'WiFi' },
    { value: 'tv', label: 'TV' },
    { value: 'ac', label: 'Air Conditioning' },
    { value: 'minibar', label: 'Mini Bar' },
    { value: 'balcony', label: 'Balcony' },
    { value: 'room_service', label: 'Room Service' },
    { value: 'safe', label: 'Safe' },
    { value: 'bathtub', label: 'Bathtub' },
    { value: 'coffee_maker', label: 'Coffee Maker' },
    { value: 'mountain_view', label: 'Mountain View' }
  ];

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 m-4 max-h-screen overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {room ? 'Edit Room' : 'Add New Room'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 focus:outline-none"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Room Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Room Number *
            </label>
            <input
              type="text"
              name="room_number"
              value={formData.room_number}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              placeholder="e.g., 101, A-205"
            />
          </div>

          {/* Room Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Room Type *
            </label>
            <select
              name="room_type_id"
              value={formData.room_type_id}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select Room Type</option>
              {roomTypes.map(type => (
                <option key={type.id} value={type.id}>
                  {type.name} - ₹{type.base_price}/night
                </option>
              ))}
            </select>
          </div>

          {/* Floor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Floor *
            </label>
            <input
              type="number"
              name="floor"
              value={formData.floor}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              min="0"
              max="50"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status *
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              {statusOptions.map(status => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          {/* Max Occupancy */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Occupancy *
            </label>
            <input
              type="number"
              name="max_occupancy"
              value={formData.max_occupancy}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              min="1"
              max="10"
              placeholder="Number of guests"
            />
          </div>

          {/* Base Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Base Price (₹) *
            </label>
            <input
              type="number"
              name="base_price"
              value={formData.base_price}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              min="0"
              step="0.01"
              placeholder="Price per night"
            />
          </div>

          {/* Amenities */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amenities
            </label>
            <div className="grid grid-cols-2 gap-2">
              {amenityOptions.map(amenity => (
                <label key={amenity.value} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="amenities"
                    value={amenity.value}
                    checked={formData.amenities.includes(amenity.value)}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">{amenity.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Optional description or special notes"
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Saving...' : (room ? 'Update Room' : 'Add Room')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddRoomForm;

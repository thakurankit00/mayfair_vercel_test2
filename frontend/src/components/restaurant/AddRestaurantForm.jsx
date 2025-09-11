import React, { useState, useEffect } from 'react';
import { restaurantApi } from '../../services/restaurantApi';

const AddRestaurantForm = ({ 
  restaurant = null, 
  onClose, 
  onSave 
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    restaurant_type: 'restaurant',
    location: 'ground_floor',
    max_capacity: '',
    operating_hours: {
      open: '09:00',
      close: '22:00'
    },
    phone: '',
    email: '',
    description: '',
    is_active: true,
    amenities: []
  });

  // Set form data if editing existing restaurant
  useEffect(() => {
    if (restaurant) {
      setFormData({
        name: restaurant.name || '',
        restaurant_type: restaurant.restaurant_type || 'restaurant',
        location: restaurant.location || 'ground_floor',
        max_capacity: restaurant.max_capacity || '',
        operating_hours: restaurant.operating_hours || { open: '09:00', close: '22:00' },
        phone: restaurant.phone || '',
        email: restaurant.email || '',
        description: restaurant.description || '',
        is_active: restaurant.is_active !== undefined ? restaurant.is_active : true,
        amenities: restaurant.amenities || []
      });
    }
  }, [restaurant]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith('operating_hours.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        operating_hours: {
          ...prev.operating_hours,
          [field]: value
        }
      }));
    } else if (name === 'amenities') {
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
      if (!formData.name || !formData.max_capacity) {
        throw new Error('Please fill in all required fields');
      }

      if (parseInt(formData.max_capacity) < 1) {
        throw new Error('Max capacity must be at least 1');
      }

      // Validate email format if provided
      if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        throw new Error('Please enter a valid email address');
      }

      // Validate operating hours
      if (formData.operating_hours.open >= formData.operating_hours.close) {
        throw new Error('Opening time must be before closing time');
      }

      // Prepare data for API
      const restaurantData = {
        ...formData,
        max_capacity: parseInt(formData.max_capacity)
      };

      if (restaurant && restaurant.id) {
        // Update existing restaurant
        await restaurantApi.updateRestaurant(restaurant.id, restaurantData);
      } else {
        // Create new restaurant
        await restaurantApi.createRestaurant(restaurantData);
      }

      // Call onSave callback to refresh data
      if (onSave) {
        await onSave();
      }

      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save restaurant');
    } finally {
      setLoading(false);
    }
  };

  const restaurantTypes = [
    { value: 'restaurant', label: 'Restaurant' },
    { value: 'bar', label: 'Bar' },
    { value: 'cafe', label: 'Cafe' },
    { value: 'rooftop', label: 'Rooftop' },
    { value: 'fine_dining', label: 'Fine Dining' },
    { value: 'fast_casual', label: 'Fast Casual' }
  ];

  const locations = [
    { value: 'ground_floor', label: 'Ground Floor' },
    { value: 'first_floor', label: 'First Floor' },
    { value: 'second_floor', label: 'Second Floor' },
    { value: 'rooftop', label: 'Rooftop' },
    { value: 'garden', label: 'Garden' },
    { value: 'poolside', label: 'Poolside' }
  ];

  const amenityOptions = [
    { value: 'outdoor_seating', label: 'Outdoor Seating' },
    { value: 'live_music', label: 'Live Music' },
    { value: 'wifi', label: 'WiFi' },
    { value: 'valet_parking', label: 'Valet Parking' },
    { value: 'private_dining', label: 'Private Dining' },
    { value: 'bar_service', label: 'Bar Service' },
    { value: 'buffet', label: 'Buffet' },
    { value: 'delivery', label: 'Delivery' },
    { value: 'takeaway', label: 'Takeaway' },
    { value: 'wheelchair_accessible', label: 'Wheelchair Accessible' }
  ];

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 m-4 max-h-screen overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {restaurant ? 'Edit Restaurant' : 'Add New Restaurant'}
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
          {/* Restaurant Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Restaurant Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              placeholder="Enter restaurant name"
            />
          </div>

          {/* Restaurant Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Restaurant Type *
            </label>
            <select
              name="restaurant_type"
              value={formData.restaurant_type}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              {restaurantTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location *
            </label>
            <select
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              {locations.map(location => (
                <option key={location.value} value={location.value}>
                  {location.label}
                </option>
              ))}
            </select>
          </div>

          {/* Max Capacity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Capacity *
            </label>
            <input
              type="number"
              name="max_capacity"
              value={formData.max_capacity}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              min="1"
              max="500"
              placeholder="Maximum number of guests"
            />
          </div>

          {/* Operating Hours */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Operating Hours *
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Opening Time</label>
                <input
                  type="time"
                  name="operating_hours.open"
                  value={formData.operating_hours.open}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Closing Time</label>
                <input
                  type="time"
                  name="operating_hours.close"
                  value={formData.operating_hours.close}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="+91 XXXXXXXXXX"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="restaurant@example.com"
            />
          </div>

          {/* Amenities */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amenities & Features
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
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
              placeholder="Brief description of the restaurant"
            />
          </div>

          {/* Active Status */}
          <div className="flex items-center">
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-700">
              Active (open for service)
            </label>
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
              {loading ? 'Saving...' : (restaurant ? 'Update Restaurant' : 'Add Restaurant')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddRestaurantForm;

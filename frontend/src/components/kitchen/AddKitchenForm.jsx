import React, { useState, useEffect } from 'react';
import { kitchenApi, restaurantApi } from '../../services/restaurantApi';

const AddKitchenForm = ({ 
  kitchen = null, 
  onClose, 
  onSave 
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [restaurants, setRestaurants] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    kitchen_type: 'main',
    location: 'ground_floor',
    restaurant_id: '',
    capacity: '',
    operating_hours: {
      open: '06:00',
      close: '23:00'
    },
    equipment: [],
    specialties: [],
    staff_count: '',
    is_active: true,
    description: ''
  });

  // Load restaurants on mount
  useEffect(() => {
    const loadRestaurants = async () => {
      try {
        const data = await restaurantApi.getRestaurants();
        setRestaurants(data.restaurants || []);
      } catch (err) {
        console.error('Failed to load restaurants:', err);
      }
    };
    loadRestaurants();
  }, []);

  // Set form data if editing existing kitchen
  useEffect(() => {
    if (kitchen) {
      setFormData({
        name: kitchen.name || '',
        kitchen_type: kitchen.kitchen_type || 'main',
        location: kitchen.location || 'ground_floor',
        restaurant_id: kitchen.restaurant_id || '',
        capacity: kitchen.capacity || '',
        operating_hours: kitchen.operating_hours || { open: '06:00', close: '23:00' },
        equipment: kitchen.equipment || [],
        specialties: kitchen.specialties || [],
        staff_count: kitchen.staff_count || '',
        is_active: kitchen.is_active !== undefined ? kitchen.is_active : true,
        description: kitchen.description || ''
      });
    }
  }, [kitchen]);

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
    } else if (name === 'equipment' || name === 'specialties') {
      if (checked) {
        setFormData(prev => ({
          ...prev,
          [name]: [...prev[name], value]
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [name]: prev[name].filter(item => item !== value)
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
      if (!formData.name || !formData.capacity || !formData.staff_count) {
        throw new Error('Please fill in all required fields');
      }

      if (parseInt(formData.capacity) < 1) {
        throw new Error('Capacity must be at least 1');
      }

      if (parseInt(formData.staff_count) < 1) {
        throw new Error('Staff count must be at least 1');
      }

      // Validate operating hours
      if (formData.operating_hours.open >= formData.operating_hours.close) {
        throw new Error('Opening time must be before closing time');
      }

      // Prepare data for API
      const kitchenData = {
        ...formData,
        capacity: parseInt(formData.capacity),
        staff_count: parseInt(formData.staff_count)
      };

      if (kitchen && kitchen.id) {
        // Update existing kitchen
        await kitchenApi.updateKitchen(kitchen.id, kitchenData);
      } else {
        // Create new kitchen
        await kitchenApi.createKitchen(kitchenData);
      }

      // Call onSave callback to refresh data
      if (onSave) {
        await onSave();
      }

      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save kitchen');
    } finally {
      setLoading(false);
    }
  };

  const kitchenTypes = [
    { value: 'main', label: 'Main Kitchen' },
    { value: 'preparation', label: 'Preparation Kitchen' },
    { value: 'bakery', label: 'Bakery' },
    { value: 'bar', label: 'Bar Kitchen' },
    { value: 'room_service', label: 'Room Service Kitchen' },
    { value: 'banquet', label: 'Banquet Kitchen' }
  ];

  const locations = [
    { value: 'ground_floor', label: 'Ground Floor' },
    { value: 'first_floor', label: 'First Floor' },
    { value: 'second_floor', label: 'Second Floor' },
    { value: 'basement', label: 'Basement' },
    { value: 'rooftop', label: 'Rooftop' },
    { value: 'separate_building', label: 'Separate Building' }
  ];

  const equipmentOptions = [
    { value: 'commercial_stove', label: 'Commercial Stove' },
    { value: 'industrial_oven', label: 'Industrial Oven' },
    { value: 'deep_fryer', label: 'Deep Fryer' },
    { value: 'grill', label: 'Grill' },
    { value: 'dishwasher', label: 'Commercial Dishwasher' },
    { value: 'refrigerator', label: 'Walk-in Refrigerator' },
    { value: 'freezer', label: 'Walk-in Freezer' },
    { value: 'mixer', label: 'Commercial Mixer' },
    { value: 'food_processor', label: 'Food Processor' },
    { value: 'espresso_machine', label: 'Espresso Machine' },
    { value: 'salamander', label: 'Salamander' },
    { value: 'convection_oven', label: 'Convection Oven' }
  ];

  const specialtyOptions = [
    { value: 'indian', label: 'Indian Cuisine' },
    { value: 'chinese', label: 'Chinese Cuisine' },
    { value: 'continental', label: 'Continental' },
    { value: 'italian', label: 'Italian' },
    { value: 'baking', label: 'Baking & Pastry' },
    { value: 'grilling', label: 'Grilling & BBQ' },
    { value: 'seafood', label: 'Seafood' },
    { value: 'vegetarian', label: 'Vegetarian' },
    { value: 'fast_food', label: 'Fast Food' },
    { value: 'beverages', label: 'Beverages & Cocktails' }
  ];

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6 m-4 max-h-screen overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {kitchen ? 'Edit Kitchen' : 'Add New Kitchen'}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Kitchen Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kitchen Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                placeholder="Enter kitchen name"
              />
            </div>

            {/* Kitchen Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kitchen Type *
              </label>
              <select
                name="kitchen_type"
                value={formData.kitchen_type}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {kitchenTypes.map(type => (
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

            {/* Associated Restaurant */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Associated Restaurant
              </label>
              <select
                name="restaurant_id"
                value={formData.restaurant_id}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">No specific restaurant</option>
                {restaurants.map(restaurant => (
                  <option key={restaurant.id} value={restaurant.id}>
                    {restaurant.name} ({restaurant.restaurant_type})
                  </option>
                ))}
              </select>
            </div>

            {/* Capacity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Capacity (orders/hour) *
              </label>
              <input
                type="number"
                name="capacity"
                value={formData.capacity}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                min="1"
                max="500"
                placeholder="Orders per hour"
              />
            </div>

            {/* Staff Count */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Staff Count *
              </label>
              <input
                type="number"
                name="staff_count"
                value={formData.staff_count}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                min="1"
                max="50"
                placeholder="Number of staff members"
              />
            </div>
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

          {/* Equipment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Equipment & Appliances
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-md p-3">
              {equipmentOptions.map(equipment => (
                <label key={equipment.value} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="equipment"
                    value={equipment.value}
                    checked={formData.equipment.includes(equipment.value)}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">{equipment.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Specialties */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cuisine Specialties
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded-md p-3">
              {specialtyOptions.map(specialty => (
                <label key={specialty.value} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="specialties"
                    value={specialty.value}
                    checked={formData.specialties.includes(specialty.value)}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">{specialty.label}</span>
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
              placeholder="Additional details about the kitchen"
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
              Active (operational)
            </label>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
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
              {loading ? 'Saving...' : (kitchen ? 'Update Kitchen' : 'Add Kitchen')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddKitchenForm;

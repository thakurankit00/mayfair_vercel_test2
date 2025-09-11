<<<<<<< HEAD
import React, { useState, useEffect } from "react";
import { restaurantTableApi } from "../../services/restaurantApi";

const AddTableForm = ({ isOpen, onClose, onTableAdded, restaurantId }) => {
  const initialForm = {
    table_number: "",
    capacity: "",
    location: "indoor",
    is_active: true,
    restaurant_id: restaurantId || ""
  };

  const [formData, setFormData] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setFormData(prev => ({ ...prev, restaurant_id: restaurantId || "" }));
  }, [restaurantId]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : 
              name === "is_active" ? value === "true" : 
              name === "capacity" ? parseInt(value) || "" : value
=======
import React, { useState, useEffect } from 'react';
import { restaurantTableApi, restaurantApi } from '../../services/restaurantApi';

const AddTableForm = ({ 
  table = null, 
  onClose, 
  onSave, 
  selectedRestaurant = null 
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [restaurants, setRestaurants] = useState([]);
  const [formData, setFormData] = useState({
    restaurant_id: selectedRestaurant || '',
    table_number: '',
    capacity: '',
    location: 'indoor',
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

  // Set form data if editing existing table
  useEffect(() => {
    if (table) {
      setFormData({
        restaurant_id: table.restaurant_id || '',
        table_number: table.table_number || '',
        capacity: table.capacity || '',
        location: table.location || 'indoor',
        is_active: table.is_active !== undefined ? table.is_active : true,
        description: table.description || ''
      });
    }
  }, [table]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
>>>>>>> origin/feature/order-management
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
<<<<<<< HEAD
    setError("");
    setIsSubmitting(true);

    try {
      console.log("Submitting form data:", formData);
      
      // Validate required fields
      if (!formData.table_number || !formData.capacity) {
        throw new Error("Table number and capacity are required");
      }

      if (!restaurantId) {
        throw new Error("Please select a restaurant first");
      }

      // Prepare data for API
      const submitData = {
        ...formData,
        capacity: parseInt(formData.capacity),
        is_active: Boolean(formData.is_active),
        restaurant_id: restaurantId
      };

      const response = await restaurantTableApi.createTable(restaurantId, submitData);
      console.log("API response:", response);

      // Handle successful creation
      if (response?.data?.table || response?.table || response) {
        const newTable = response?.data?.table || response?.table || response;
        if (onTableAdded) {
          onTableAdded(newTable);
        }
        
        // Reset form
        setFormData(initialForm);
        onClose();
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err) {
      console.error("Error adding table:", err);
      setError(err.response?.data?.message || err.message || "Failed to add table");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData(initialForm);
    setError("");
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
      <div className="bg-white rounded-xl shadow-lg w-[400px] p-6 relative">
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 text-gray-600 hover:text-red-500"
          disabled={isSubmitting}
        >
          ✕
        </button>

        <h2 className="text-xl font-semibold mb-4 text-light-orange outline-4 p-2 rounded ">
          Add New Table 
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
=======
    setLoading(true);
    setError('');

    try {
      // Validate required fields
      if (!formData.restaurant_id || !formData.table_number || !formData.capacity) {
        throw new Error('Please fill in all required fields');
      }

      if (parseInt(formData.capacity) < 1) {
        throw new Error('Capacity must be at least 1');
      }

      // Prepare data for API
      const tableData = {
        ...formData,
        capacity: parseInt(formData.capacity),
        table_number: parseInt(formData.table_number)
      };

      if (table && table.id) {
        // Update existing table
        await restaurantTableApi.updateTable(table.id, tableData);
      } else {
        // Create new table
        await restaurantTableApi.createTable(tableData);
      }

      // Call onSave callback to refresh data
      if (onSave) {
        await onSave();
      }

      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save table');
    } finally {
      setLoading(false);
    }
  };

  const locations = [
    { value: 'indoor', label: 'Indoor' },
    { value: 'outdoor', label: 'Outdoor' },
    { value: 'sky_bar', label: 'Sky Bar' },
    { value: 'terrace', label: 'Terrace' },
    { value: 'garden', label: 'Garden' }
  ];

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 m-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {table ? 'Edit Table' : 'Add New Table'}
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
>>>>>>> origin/feature/order-management
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
<<<<<<< HEAD
          <div>
            <label className="block text-sm font-medium">Table Number *</label>
            <input
              type="text"
              name="table_number"
              value={formData.table_number}
              onChange={handleChange}
              className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Capacity *</label>
=======
          {/* Restaurant Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Restaurant *
            </label>
            <select
              name="restaurant_id"
              value={formData.restaurant_id}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={selectedRestaurant} // Disable if restaurant is pre-selected
            >
              <option value="">Select Restaurant</option>
              {restaurants.map(restaurant => (
                <option key={restaurant.id} value={restaurant.id}>
                  {restaurant.name} ({restaurant.restaurant_type})
                </option>
              ))}
            </select>
          </div>

          {/* Table Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Table Number *
            </label>
            <input
              type="number"
              name="table_number"
              value={formData.table_number}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              min="1"
              placeholder="Enter table number"
            />
          </div>

          {/* Capacity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Capacity *
            </label>
>>>>>>> origin/feature/order-management
            <input
              type="number"
              name="capacity"
              value={formData.capacity}
<<<<<<< HEAD
              onChange={handleChange}
              min="1"
              max="20"
              className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Location</label>
            <select
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isSubmitting}
            >
              <option value="indoor">Indoor</option>
              <option value="outdoor">Outdoor</option>
              <option value="sky_bar">Sky Bar</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium">Status</label>
            <select
              name="is_active"
              value={String(formData.is_active)}
              onChange={handleChange}
              className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isSubmitting}
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
              disabled={isSubmitting}
=======
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              min="1"
              max="20"
              placeholder="Number of guests"
            />
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
              Active (available for reservations)
            </label>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
              disabled={loading}
>>>>>>> origin/feature/order-management
            >
              Cancel
            </button>
            <button
              type="submit"
<<<<<<< HEAD
              className="px-4 py-2 text-sm font-medium text-white bg-light-orange rounded-md hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Adding..." : "Add Table"}
=======
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Saving...' : (table ? 'Update Table' : 'Add Table')}
>>>>>>> origin/feature/order-management
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
<<<<<<< HEAD
export default AddTableForm;
=======

export default AddTableForm;
>>>>>>> origin/feature/order-management

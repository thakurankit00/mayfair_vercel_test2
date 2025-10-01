import React, { useState } from 'react';
import { restaurantMenuApi } from '../../services/restaurantApi';

const AddCategoryModal = ({ onClose, onSave, selectedRestaurant }) => {
  const [form, setForm] = useState({
    name: '',
    description: '',
    type: 'restaurant',
    restaurant_id: selectedRestaurant || ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      // Validate required fields
      if (!form.name.trim() || !form.description.trim()) {
        throw new Error('Name and description are required');
      }

      if (!form.restaurant_id) {
        throw new Error('Please select a restaurant');
      }

      // Create category
      await restaurantMenuApi.createCategory(form);

      // Call onSave callback to refresh data
      if (onSave) {
        await onSave();
      }

      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create category');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
          onClick={onClose}
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <h2 className="text-lg font-semibold mb-4 bg-green-600 text-white p-2 rounded">
          Add New Category
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name *</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              required
              placeholder="Category name (e.g., Appetizers, Main Course)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description *</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              rows={3}
              required
              placeholder="Brief description of this category"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Type *</label>
            <select
              name="type"
              value={form.type}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            >
              <option value="restaurant">Restaurant</option>
              <option value="bar">Bar</option>
              <option value="rooftop">Rooftop</option>
            </select>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
              disabled={saving}
            >
              {saving ? 'Creating...' : 'Create Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCategoryModal;

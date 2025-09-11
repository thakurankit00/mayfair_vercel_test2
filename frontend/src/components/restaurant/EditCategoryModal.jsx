import React, { useState } from 'react';

const EditCategoryModal = ({ category, onClose, onSave }) => {
  const [form, setForm] = useState({
    name: category.name || '',
    description: category.description || '',
    type: category.type || 'restaurant',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Import API inline to avoid circular dependency
  const { restaurantMenuApi } = require('../../services/restaurantApi');

  const handleDelete = async () => {
    setError('');
    setDeleting(true);
    try {
      await restaurantMenuApi.deleteCategory(category.id);
      setDeleting(false);
      onClose();
      if (onSave) onSave(); // Refresh parent list
    } catch (err) {
      setError(err.message || 'Failed to delete category');
      setDeleting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSave(form);
    } catch (err) {
      setError(err.message || 'Failed to save changes');
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
          onClick={onClose}
        >
          &times;
        </button>
        <h2 className="text-lg font-semibold mb-4 text-light-orange outline-4  p-2 rounded">
          Edit Category
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              rows={2}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Type</label>
            <select
              name="type"
              value={form.type}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              required
            >
              <option value="restaurant">Restaurant</option>
              <option value="bar">Bar</option>
              <option value="rooftop">RoofTop</option>
            </select>
          </div>

          {error && <div className="text-red-600 text-sm">{error}</div>}

          <div className="flex flex-col gap-2 mt-6">
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                onClick={onClose}
                disabled={saving || deleting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-light-orange text-white rounded hover:bg-blue-700"
                disabled={saving || deleting}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>

            {/* Delete flow */}
            {!showDeleteConfirm ? (
              <button
                type="button"
                className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded mt-4"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={saving}
              >
                Delete Category
              </button>
            ) : (
              <div className="mt-4 bg-red-50 border border-red-200 p-3 rounded text-sm">
                <p className="text-red-700 mb-2">
                  Are you sure you want to delete this category?
                </p>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    {deleting ? 'Deleting...' : 'Confirm Delete'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditCategoryModal;

import React, { useState, useEffect } from "react";
import { restaurantTableApi } from "../../services/restaurantApi";

const EditTableModal = ({ item, onEdit, onDelete, restaurants = [] }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    table_number: "",
    capacity: "",
    location: "indoor",
    is_active: true,
  });

  // Load item into formData when opening modal
  useEffect(() => {
    if (item && showEditModal) {
      setFormData({
        table_number: item.table_number || "",
        capacity: item.capacity || "",
        location: item.location || "indoor",
        is_active: item.is_active !== undefined ? item.is_active : true,
      });
      setError("");
    }
  }, [item, showEditModal]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked :
              name === "is_active" ? value === "true" :
              name === "capacity" ? parseInt(value) || "" : value
    }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      console.log("Updating table:", item.id, formData);

      // Validate required fields
      if (!formData.table_number || !formData.capacity) {
        throw new Error("Table number and capacity are required");
      }

      // Prepare data for API
      const updateData = {
        ...formData,
        capacity: parseInt(formData.capacity),
        is_active: Boolean(formData.is_active)
      };

      const response = await restaurantTableApi.updateTable(item.id, updateData);
      console.log("Update response:", response);

      // Handle successful update
      const updatedTable = response?.data?.table || response?.table || { ...item, ...updateData };
      
      if (onEdit) {
        onEdit(updatedTable);
      }
      
      setShowEditModal(false);
      setShowMenu(false);
    } catch (err) {
      console.error("Error updating table:", err);
      setError(err.response?.data?.message || err.message || "Failed to update table");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      console.log("Deleting table:", item.id);
      
      await restaurantTableApi.deleteTable(item.id);
      
      if (onDelete) {
        onDelete(item.id);
      }
      
      setShowDeleteModal(false);
      setShowMenu(false);
    } catch (err) {
      console.error("Error deleting table:", err);
      // You might want to show an error message here
      alert(err.response?.data?.message || err.message || "Failed to delete table");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCloseEdit = () => {
    setShowEditModal(false);
    setError("");
    setFormData({
      table_number: "",
      capacity: "",
      location: "indoor",
      is_active: true,
    });
  };

  return (
    <div className="relative inline-block text-left">
      {/* Admin/Manager 3-dot menu */}
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="text-gray-400 hover:text-gray-600 focus:outline-none"
      >
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>

      {showMenu && (
        <div className="absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded-md shadow-lg z-10">
          <button
            onClick={() => {
              setShowEditModal(true);
              setShowMenu(false);
            }}
            className="w-full text-left px-4 py-2 text-sm text-light-orange hover:bg-blue-100 hover:text-blue-800 rounded-t-md"
          >
            Edit
          </button>
          <button
            onClick={() => {
              setShowDeleteModal(true);
              setShowMenu(false);
            }}
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-100 hover:text-red-800 rounded-b-md"
          >
            Delete
          </button>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-xl shadow-lg w-[400px] p-6 relative">
            <button
              onClick={handleCloseEdit}
              className="absolute top-3 right-3 text-gray-600 hover:text-red-500"
              disabled={isSubmitting}
            >
              ✕
            </button>

            <h2 className="text-xl font-semibold mb-4 text-light-orange outline-4 p-2 rounded ">
              Edit Table
            </h2>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4">
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
                <input
                  type="number"
                  name="capacity"
                  value={formData.capacity}
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
                  onClick={handleCloseEdit}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-light-orange rounded-md hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-xl shadow-lg w-[300px] p-6">
            <h2 className="text-lg font-semibold mb-4">Confirm Delete</h2>
            <p>Are you sure you want to delete Table {item?.table_number}?</p>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-md hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default EditTableModal;
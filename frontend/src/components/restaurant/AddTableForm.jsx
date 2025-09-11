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
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-light-orange text-white rounded hover:bg-blue-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Adding..." : "Add Table"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default AddTableForm;
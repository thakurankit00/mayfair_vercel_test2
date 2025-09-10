import React, { useState, useEffect } from "react";
import { restaurantTableApi } from "../../services/restaurantApi";

const EditTableModal = ({ isOpen, onClose, table, onTableUpdated }) => {
  const [formData, setFormData] = useState({
    table_number: "",
    capacity: "",
    location: "indoor",
    is_active: true,
  });

  // Prefill table details
  useEffect(() => {
    if (table) {
      setFormData({
        table_number: table.table_number || "",
        capacity: table.capacity || "",
        location: table.location || "indoor",
        is_active: table.is_active ?? true,
      });
    }
  }, [table]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "is_active") {
      setFormData({ ...formData, [name]: value === "true" });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await restaurantTableApi.update(table.id, formData);
      if (onTableUpdated) onTableUpdated(res.data?.table);
      onClose();
    } catch (err) {
      console.error("❌ Error updating table:", err);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
      <div className="bg-white rounded-xl shadow-lg w-[400px] p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-600 hover:text-red-500"
        >
          ✕
        </button>

        <h2 className="text-xl font-semibold mb-4 bg-yellow-500 p-2 rounded text-white">
          Edit Table
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Table Number */}
          <div>
            <label className="block text-sm font-medium">Table Number</label>
            <input
              type="text"
              name="table_number"
              value={formData.table_number}
              onChange={handleChange}
              className="w-full border rounded-lg p-2"
              required
            />
          </div>

          {/* Capacity */}
          <div>
            <label className="block text-sm font-medium">Capacity</label>
            <input
              type="number"
              name="capacity"
              value={formData.capacity}
              onChange={handleChange}
              className="w-full border rounded-lg p-2"
              required
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium">Location</label>
            <select
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="w-full border rounded-lg p-2"
            >
              <option value="indoor">Indoor</option>
              <option value="outdoor">Outdoor</option>
              <option value="sky_bar">Sky Bar</option>
            </select>
          </div>

          {/* Active */}
          <div>
            <label className="block text-sm font-medium">Active</label>
            <select
              name="is_active"
              value={formData.is_active}
              onChange={handleChange}
              className="w-full border rounded-lg p-2"
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-yellow-600 rounded-md hover:bg-yellow-700"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTableModal;

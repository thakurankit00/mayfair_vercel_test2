import React, { useState, useEffect } from "react";
import { restaurantTableApi } from "../../services/restaurantApi";

const EditTableForm = ({ table, onClose, onEdit, onDelete, existingTables = [] }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState({
    table_number: "",
    capacity: "",
    location: "indoor",
    is_active: true,
  });


  // Load table data when component mounts
  useEffect(() => {
    if (table) {
      setFormData({
        table_number: table.table_number || "",
        capacity: table.capacity || "",
        location: table.location || "indoor",
        is_active: table.is_active !== undefined ? table.is_active : true,
      });

      setError("");
      setValidationErrors({});
    }
  }, [table]);

  // Validation function
  const validateTableNumber = (tableNumber) => {
    if (!tableNumber || !tableNumber.trim()) {
      return "Table number is required";
    }

    const trimmedNumber = tableNumber.trim();
    // Filter tables by current restaurant ID first
    const restaurantTables = existingTables.filter(t =>
      t.restaurant_id === table?.restaurant_id ||
      t.restaurant_id === parseInt(table?.restaurant_id)
    );

    // Check for duplicates within the same restaurant, but exclude the current table being edited
    const isDuplicate = restaurantTables.some(t =>
      t.id !== table?.id &&
      t.table_number.toString().toLowerCase() === trimmedNumber.toLowerCase()
    );

    if (isDuplicate) {
      return `Table ${trimmedNumber} already exists in this restaurant. Please choose a different table number.`;
    }

    return null;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked :
                    name === "is_active" ? value === "true" :
                    name === "capacity" ? parseInt(value) || "" : value;

    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));

    // Real-time validation for table number
    if (name === "table_number") {
      const validationError = validateTableNumber(newValue);
      setValidationErrors(prev => ({
        ...prev,
        table_number: validationError
      }));

      // Clear general error when user starts typing
      if (error && error.includes("already exists")) {
        setError("");
      }
    }
  };



  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setValidationErrors({});
    setIsSubmitting(true);

    try {
      // Validate required fields
      if (!formData.table_number || !formData.capacity) {
        throw new Error("Table number and capacity are required");
      }

      // Client-side duplicate validation
      const tableNumberError = validateTableNumber(formData.table_number);
      if (tableNumberError) {
        setValidationErrors({ table_number: tableNumberError });
        throw new Error(tableNumberError);
      }

      // Prepare data for API
      const updateData = {
        ...formData,
        capacity: parseInt(formData.capacity),
        is_active: Boolean(formData.is_active)
      };

      const response = await restaurantTableApi.updateTable(table.id, updateData);

      // Handle successful update
      const updatedTable = response?.data?.table || response?.table || { ...table, ...updateData };
      
      if (onEdit) {
        onEdit(updatedTable);
      }
      
      onClose();
    } catch (err) {
      console.error("Error updating table:", err);

      // Handle duplicate table error specifically
      if (err.response?.status === 409 || err.response?.data?.error?.code === 'DUPLICATE_TABLE') {
        const errorData = err.response.data?.error;
        const existingTableDetails = errorData?.details?.existing_table;

        // Use the server's error message if available, otherwise fallback to default
        let errorMessage = errorData?.message || `Table ${formData.table_number} already exists in this restaurant. Please choose a different table number.`;

        // Create detailed validation error message
        let detailedMessage = errorMessage;
        if (existingTableDetails) {
          detailedMessage += ` (Existing table: ${existingTableDetails.capacity} seats, ${existingTableDetails.location} location, created ${new Date(existingTableDetails.created_at).toLocaleDateString()})`;
        }

        setValidationErrors({ table_number: detailedMessage });
        setError(errorMessage);
      } else {
        setError(err.response?.data?.message || err.message || "Failed to update table");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      await restaurantTableApi.deleteTable(table.id);
      
      if (onDelete) {
        onDelete(table.id);
      }
      
      onClose();
    } catch (err) {
      console.error("Error deleting table:", err);
      setError(err.response?.data?.message || err.message || "Failed to delete table");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  if (showDeleteConfirm) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Confirm Delete</h3>
        <p className="text-gray-600">
          Are you sure you want to delete Table {table.table_number}? This action cannot be undone.
        </p>
        
        <div className="flex justify-end gap-3">
          <button
            onClick={cancelDelete}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            onClick={confirmDelete}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Table Number *</label>
          <input
            type="text"
            name="table_number"
            value={formData.table_number}
            onChange={handleChange}
            className={`w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              validationErrors.table_number ? 'border-red-500 bg-red-50' : ''
            }`}
            required
            disabled={isSubmitting}
          />
          {validationErrors.table_number && (
            <p className="text-red-500 text-sm mt-1 flex items-center">
              <span className="mr-1">⚠️</span>
              {validationErrors.table_number}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Capacity *</label>
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
          <label className="block text-sm font-medium mb-1">Location</label>
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
          <label className="block text-sm font-medium mb-1">Status</label>
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



        <div className="flex justify-between pt-4">
          <button
            type="button"
            onClick={handleDeleteClick}
            className="px-4 py-2 text-sm font-medium text-red-600 border border-red-300 rounded-md hover:bg-red-50"
            disabled={isSubmitting}
          >
            Delete Table
          </button>
          
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EditTableForm;

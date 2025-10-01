import React, { useState, useEffect } from "react";
import { restaurantTableApi } from "../../services/restaurantApi";

const AddTableForm = ({ isOpen, onClose, onTableAdded, restaurantId, existingTables = [] }) => {
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
  const [validationErrors, setValidationErrors] = useState({});
  const [suggestedTableNumber, setSuggestedTableNumber] = useState("");


  useEffect(() => {
    setFormData(prev => ({ ...prev, restaurant_id: restaurantId || "" }));
  }, [restaurantId]);

  // Generate suggested table number
  useEffect(() => {
    if (existingTables.length > 0 && restaurantId) {
      // Filter tables by current restaurant ID
      const restaurantTables = existingTables.filter(table =>
        table.restaurant_id === restaurantId || table.restaurant_id === parseInt(restaurantId)
      );

      const existingNumbers = restaurantTables
        .map(table => {
          const num = parseInt(table.table_number.toString().replace(/\D/g, ''));
          return isNaN(num) ? 0 : num;
        })
        .filter(num => num > 0)
        .sort((a, b) => a - b);

      let suggested = 1;
      for (let i = 0; i < existingNumbers.length; i++) {
        if (existingNumbers[i] === suggested) {
          suggested++;
        } else {
          break;
        }
      }
      setSuggestedTableNumber(suggested.toString());
    } else {
      setSuggestedTableNumber("1");
    }
  }, [existingTables, restaurantId]);

  if (!isOpen) return null;

  // Validation functions
  const validateTableNumber = (tableNumber) => {
    if (!tableNumber || !tableNumber.trim()) {
      return "Table number is required";
    }

    const trimmedNumber = tableNumber.trim();
    // Filter tables by current restaurant ID and check for duplicates
    const restaurantTables = existingTables.filter(table =>
      table.restaurant_id === restaurantId || table.restaurant_id === parseInt(restaurantId)
    );

    const isDuplicate = restaurantTables.some(table =>
      table.table_number.toString().toLowerCase() === trimmedNumber.toLowerCase()
    );

    if (isDuplicate) {
      return `Table ${trimmedNumber} already exists in this restaurant. Please choose a different table number.`;
    }

    return null;
  };

  const getConflictingTable = (tableNumber) => {
    // Filter tables by current restaurant ID first
    const restaurantTables = existingTables.filter(table =>
      table.restaurant_id === restaurantId || table.restaurant_id === parseInt(restaurantId)
    );

    return restaurantTables.find(table =>
      table.table_number.toString().toLowerCase() === tableNumber.trim().toLowerCase()
    );
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
      console.log("Submitting form data:", formData);

      // Validate required fields
      if (!formData.table_number || !formData.capacity) {
        throw new Error("Table number and capacity are required");
      }

      if (!restaurantId) {
        throw new Error("Please select a restaurant first");
      }

      // Client-side duplicate validation
      const tableNumberError = validateTableNumber(formData.table_number);
      if (tableNumberError) {
        setValidationErrors({ table_number: tableNumberError });
        throw new Error(tableNumberError);
      }

      // Prepare data for API - only send necessary fields
      const submitData = {
        table_number: formData.table_number.toString().trim(),
        capacity: parseInt(formData.capacity),
        location: formData.location
        // Remove is_active and restaurant_id from body as they're handled differently
      };

      console.log("Prepared submit data:", submitData);

      // Call API
      const response = await restaurantTableApi.createTable(restaurantId, submitData);
      console.log("Raw API response:", response);

      // Handle response more carefully
      let newTable = null;
      
      if (response && typeof response === 'object') {
        // Try different possible response structures
        if (response.data && response.data.table) {
          newTable = response.data.table;
        } else if (response.table) {
          newTable = response.table;
        } else if (response.success && response.data) {
          newTable = response.data;
        } else {
          newTable = response;
        }
      }
      
      // Ensure booking_status is set for new tables
      if (newTable && !newTable.booking_status) {
        newTable.booking_status = 'available';
      }

      if (newTable && newTable.id) {
        console.log("Table created successfully:", newTable);
        
        // Notify parent component
        if (onTableAdded && typeof onTableAdded === 'function') {
          onTableAdded(newTable);
        }
        
        // Reset form and close modal
        setFormData(initialForm);
        setError("");
        onClose();
      } else {
        console.error("Invalid response structure:", response);
        throw new Error("Invalid response from server - table not created properly");
      }

    } catch (err) {
      console.error("Error adding table:", err);

      // Handle different types of errors
      let errorMessage = "Failed to add table";

      if (err.response) {
        // Handle duplicate table error specifically
        if (err.response.status === 409 || err.response.data?.error?.code === 'DUPLICATE_TABLE') {
          const errorData = err.response.data?.error;
          const existingTableDetails = errorData?.details?.existing_table;

          // Use the server's error message if available, otherwise fallback to default
          errorMessage = errorData?.message || `Table ${formData.table_number} already exists in this restaurant. Please choose a different table number.`;

          // Create detailed validation error message
          let detailedMessage = errorMessage;
          if (existingTableDetails) {
            detailedMessage += ` (Existing table: ${existingTableDetails.capacity} seats, ${existingTableDetails.location} location, created ${new Date(existingTableDetails.created_at).toLocaleDateString()})`;
          } else {
            // Fallback to local lookup if server doesn't provide details
            const conflictingTable = getConflictingTable(formData.table_number);
            if (conflictingTable) {
              detailedMessage += ` (Existing table has ${conflictingTable.capacity} seats)`;
            }
          }

          setValidationErrors({
            table_number: detailedMessage
          });
        } else if (err.response.data) {
          if (typeof err.response.data === 'string') {
            errorMessage = err.response.data;
          } else if (err.response.data.message) {
            errorMessage = err.response.data.message;
          } else if (err.response.data.error) {
            errorMessage = err.response.data.error.message || err.response.data.error;
          }
        }
        console.error("Server error response:", err.response.data);
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
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
            <div className="relative">
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
                placeholder="e.g., T01, 1, A-1"
              />
              {suggestedTableNumber && !formData.table_number && (
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, table_number: suggestedTableNumber }));
                    setValidationErrors(prev => ({ ...prev, table_number: null }));
                  }}
                  className="absolute right-2 top-2 text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded hover:bg-blue-200"
                  disabled={isSubmitting}
                >
                  Use {suggestedTableNumber}
                </button>
              )}
            </div>
            {validationErrors.table_number && (
              <p className="text-red-500 text-sm mt-1 flex items-center">
                <span className="mr-1">⚠️</span>
                {validationErrors.table_number}
              </p>
            )}
            {suggestedTableNumber && formData.table_number && validationErrors.table_number && (
              <p className="text-blue-600 text-sm mt-1">
                💡 Suggestion: Try table number <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, table_number: suggestedTableNumber }));
                    setValidationErrors(prev => ({ ...prev, table_number: null }));
                  }}
                  className="underline hover:text-blue-800 font-medium"
                  disabled={isSubmitting}
                >
                  {suggestedTableNumber}
                </button>
              </p>
            )}
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
              placeholder="Number of guests"
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
              value={String(formData.is_active || true)}
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
              className="px-4 py-2 bg-light-orange text-white rounded hover:bg-blue-700 disabled:opacity-50"
              disabled={isSubmitting || validationErrors.table_number}
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
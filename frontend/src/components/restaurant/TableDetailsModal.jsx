import React, { useState } from 'react';

const TableDetailsModal = ({ table, onClose, onReserve, onEdit, onDelete, userRole }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!table) return null;

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'text-green-600 bg-green-100';
      case 'booked': return 'text-orange-600 bg-orange-100';
      case 'occupied': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'available': return '🟩 Available';
      case 'booked': return '🟧 Booked';
      case 'occupied': return '🟥 On Dine';
      default: return '⚪ Unknown';
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(table);
    }
    onClose();
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (onDelete) {
      onDelete(table);
    }
    setShowDeleteConfirm(false);
    onClose();
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  if (showDeleteConfirm) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-6 w-96 max-w-md mx-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Confirm Delete</h2>
            <button
              onClick={cancelDelete}
              className="text-gray-400 hover:text-gray-600 text-xl"
            >
              ×
            </button>
          </div>

          <div className="space-y-4">
            <p className="text-gray-600">
              Are you sure you want to delete Table {table.table_number}? This action cannot be undone.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-96 max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Table Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">


          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 mb-2">
              Table {table.table_number}
            </div>
            <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(table.booking_status || 'available')}`}>
              {getStatusText(table.booking_status || 'available')}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-gray-600">Capacity</div>
              <div className="font-semibold text-lg">{table.capacity} guests</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-gray-600">Location</div>
              <div className="font-semibold capitalize">{table.location?.replace('_', ' ') || 'Indoor'}</div>
            </div>
          </div>

          {/* Action Buttons for Admin/Manager */}
          {['admin', 'manager'].includes(userRole) && (
            <div className="pt-4 border-t">
              <div className="flex gap-3">
                <button
                  onClick={handleEdit}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  ✏️ Edit Table
                </button>
                <button
                  onClick={handleDeleteClick}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          )}

          {/* Reservation Actions */}
          {table.booking_status === 'available' && (
            <div className={`pt-4 ${['admin', 'manager'].includes(userRole) ? '' : 'border-t'}`}>
              <button
                onClick={() => onReserve && onReserve(table)}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
              >
                Make Reservation
              </button>
            </div>
          )}

          {table.booking_status === 'booked' && (
            <div className={`pt-4 ${['admin', 'manager'].includes(userRole) ? '' : 'border-t'}`}>
              <div className="text-sm text-gray-600 text-center">
                This table is currently reserved
              </div>
            </div>
          )}

          {table.booking_status === 'occupied' && (
            <div className={`pt-4 ${['admin', 'manager'].includes(userRole) ? '' : 'border-t'}`}>
              <div className="text-sm text-gray-600 text-center">
                Guests are currently dining at this table
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TableDetailsModal;
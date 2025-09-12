import React, { useState, useEffect } from 'react';
import { restaurantTableApi, restaurantReservationApi } from '../../services/restaurantApi';

const ReservationModal = ({ reservation, prefilledTableId, onClose, onSave }) => {
  // Get current user info from localStorage or context
  const getCurrentUser = () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return user;
    } catch {
      return {};
    }
  };

  const currentUser = getCurrentUser();

  const [form, setForm] = useState({
    first_name: reservation?.first_name || reservation?.user_first_name || currentUser.first_name || '',
    last_name: reservation?.last_name || reservation?.user_last_name || currentUser.last_name || '',
    email: reservation?.email || reservation?.user_email || currentUser.email || '',
    phone: reservation?.phone || reservation?.user_phone || currentUser.phone || '',
    table_id: reservation?.table_id || prefilledTableId || '',
    reservation_date: reservation?.reservation_date ? reservation.reservation_date.split('T')[0] : '',
    reservation_time: reservation?.reservation_time ? reservation.reservation_time.slice(0, 5) : '',
    party_size: reservation?.party_size || 1,
    status: reservation?.status || 'pending',
    special_requests: reservation?.special_requests || '',
  });
  const [tables, setTables] = useState([]);
  const [loadingTables, setLoadingTables] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadTables = async () => {
      try {
        const data = await restaurantTableApi.getTables();
        setTables(data.tables || []);
      } catch (err) {
        setError(err.message || 'Failed to load tables');
      }
      setLoadingTables(false);
    };
    loadTables();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    
    // Validate required fields
    const requiredFields = ['table_id', 'reservation_date', 'reservation_time', 'party_size'];
    for (let field of requiredFields) {
      if (!form[field] || (typeof form[field] === 'string' && form[field].trim() === '')) {
        setError(`Please fill in: ${field.replace('_', ' ')}`);
        setSaving(false);
        return;
      }
    }
    
    // Validate party size
    const partySize = parseInt(form.party_size);
    if (isNaN(partySize) || partySize <= 0) {
      setError('Party size must be a positive number');
      setSaving(false);
      return;
    }
    
    // Validate date is not in past
    const selectedDate = new Date(form.reservation_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      setError('Reservation date cannot be in the past');
      setSaving(false);
      return;
    }
    
    try {
      // Prepare payload
      const payload = {
        table_id: form.table_id,
        reservation_date: form.reservation_date,
        reservation_time: form.reservation_time,
        party_size: partySize,
        status: form.status
      };
      
      // Add optional fields if provided
      if (form.special_requests?.trim()) payload.special_requests = form.special_requests.trim();
      
      // Note: Customer info (first_name, last_name, email, phone) is handled via user authentication
      // These fields are not stored directly in table_reservations table
      
      if (reservation && reservation.id) {
        await restaurantReservationApi.updateReservation(reservation.id, payload);
      } else {
        await restaurantReservationApi.createReservation(payload);
      }
      
      // Call onSave callback to trigger parent component updates
      if (onSave) {
        onSave();
      }
      onClose();
    } catch (err) {
      setError(err.message || (reservation ? 'Failed to update reservation' : 'Failed to create reservation'));
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-20">
    <div className="bg-white rounded-lg shadow-lg w-full max-w-md md:max-w-lg lg:max-w-xl p-4 relative max-h-[90vh] overflow-y-auto">
     <button
          className="absolute top-2 right-2 text-gray-200 hover:text-gray-400"
          onClick={onClose}
        >
          &times;
        </button>
  <h2 className="text-lg font-semibold mb-3 bg-light-orange text-white p-2 rounded">{reservation ? 'Edit Reservation' : 'New Reservation'}</h2>

        {loadingTables ? (
          <p>Loading tables...</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
              <p className="text-sm text-blue-700">
                <strong>Note:</strong> Customer information is linked to user account. 
                {reservation?.created_by_name && (
                  <span className="block mt-1">
                    Created by: <strong>{reservation.created_by_name} {reservation.created_by_lastname}</strong> ({reservation.created_by_role})
                  </span>
                )}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">First Name (Display Only)</label>
              <input
                type="text"
                name="first_name"
                value={form.first_name}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-50"
                placeholder="From user account"
                disabled
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Last Name (Display Only)</label>
              <input
                type="text"
                name="last_name"
                value={form.last_name}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-50"
                placeholder="From user account"
                disabled
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email (Display Only)</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-50"
                placeholder="From user account"
                disabled
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone (Display Only)</label>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-50"
                placeholder="From user account"
                disabled
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Table *</label>
              <select
                name="table_id"
                value={form.table_id}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={!!prefilledTableId}
              >
                <option value="">Select Table</option>
                {tables.map((table) => (
                  <option key={table.id} value={table.id}>
                    Table {table.table_number} - {table.location} (Capacity: {table.capacity})
                  </option>
                ))}
              </select>
              {prefilledTableId && (
                <p className="text-xs text-blue-600 mt-1">
                  ✓ Table pre-selected from tables view
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Date *</label>
              <input
                type="date"
                name="reservation_date"
                value={form.reservation_date}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Time *</label>
              <input
                type="time"
                name="reservation_time"
                value={form.reservation_time}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Party Size *</label>
              <input
                type="number"
                name="party_size"
                value={form.party_size}
                onChange={handleChange}
                min="1"
                max="20"
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="seated">Seated</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Special Requests</label>
              <textarea
                name="special_requests"
                value={form.special_requests}
                onChange={handleChange}
                rows="3"
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Any special requests or notes..."
              />
            </div>


            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                {error}
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <button
                type="button"
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                onClick={onClose}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-orange-400 text-white font-semibold rounded-lg shadow-md hover:bg-orange-500 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-1 transition disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={saving}
              >
                {saving ? 'Saving...' : (reservation ? 'Update' : 'Create')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ReservationModal;

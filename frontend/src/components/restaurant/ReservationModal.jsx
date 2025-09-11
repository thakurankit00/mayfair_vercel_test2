import React, { useState, useEffect } from 'react';
import { restaurantTableApi, restaurantReservationApi } from '../../services/restaurantApi';

const ReservationModal = ({ reservation, onClose, onSave }) => {
  const [form, setForm] = useState({
    first_name: reservation?.first_name || '',
    last_name: reservation?.last_name || '',
    email: reservation?.email || '',
    phone: reservation?.phone || '',
    table_id: reservation?.table_id || '',
    reservation_date: reservation?.reservation_date || '',
    reservation_time: reservation?.reservation_time || '',
    party_size: reservation?.party_size || 1,
	status: reservation?.status || 'pending',
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
    // Validate all required fields
    const requiredFields = [
      'first_name', 'last_name', 'phone', 'email', 'table_id', 'reservation_date', 'reservation_time', 'party_size', 'status'
    ];
    for (let field of requiredFields) {
      if (!form[field] || (typeof form[field] === 'string' && form[field].trim() === '')) {
        setError(`Please fill in all required fields: ${field.replace('_', ' ')}`);
        setSaving(false);
        return;
      }
    }
    try {
      // Prepare payload
      const payload = { ...form };
      if (form.special_requests) payload.special_requests = form.special_requests;
      if (reservation && reservation.id) {
        await restaurantReservationApi.updateReservation(reservation.id, payload);
      } else {
        await restaurantReservationApi.createReservation(payload);
      }
      onSave();
      onClose();
    } catch (err) {
      setError(err.message || (reservation ? 'Failed to update reservation' : 'Failed to create reservation'));
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-20">
    <div className="bg-white rounded-lg shadow-lg w-full max-w-sm p-4 relative">
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
            <div>
              <label className="block text-sm font-medium text-black-300">First Name</label>
              <input
                type="text"
                name="first_name"
                value={form.first_name}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-100 rounded-md px-2 py-1 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-black-300">Last Name</label>
              <input
                type="text"
                name="last_name"
                value={form.last_name}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-100 rounded-md px-2 py-1 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-black-300">Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-100 rounded-md px-2 py-1 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-black-300">Phone</label>
              <input
                type="text"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-100 rounded-md px-2 py-1 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-black-300">Table</label>
              <select
                name="table_id"
                value={form.table_id}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-100 rounded-md px-2 py-1 text-sm"
                required
              >
                <option value="">Select Table</option>
                {tables.map((table) => (
                  <option key={table.id} value={table.id}>
                    Table {table.table_number} ({table.location})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-black-300">Date</label>
              <input
                type="date"
                name="reservation_date"
                value={form.reservation_date}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-100 rounded-md px-2 py-1 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-black-300">Time</label>
              <input
                type="time"
                name="reservation_time"
                value={form.reservation_time}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-100 rounded-md px-2 py-1 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-black-300">Party Size</label>
              <input
                type="number"
                name="party_size"
                value={form.party_size}
                onChange={handleChange}
                min="1"
                className="mt-1 block w-full border border-gray-100 rounded-md px-2 py-1 text-sm"
                required
              />
            </div>
			<div>
  <label className="block text-sm font-medium text-gray-700">Status</label>
  <select
    name="status"
    value={form.status}
    onChange={handleChange}
    className="mt-1 block w-full border border-gray-300 rounded-md px-2 py-1 text-gray-900 text-sm bg-white"
    required
  >
    <option value="pending">Pending</option>
    <option value="confirmed">Confirmed</option>
    <option value="cancelled">Cancelled</option>
  </select>
</div>


            {error && <div className="text-red-300 text-sm">{error}</div>}

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
                className="px-5 py-2 bg-light-orange text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition"
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Create'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ReservationModal;

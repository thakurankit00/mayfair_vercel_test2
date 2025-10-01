import React, { useState, useEffect } from 'react';
import { bookingApi, roomApi } from '../../services/hotelApi';
import { useAuth } from '../../contexts/AuthContext';

const BookingModal = ({ isOpen, onClose, booking = null, selectedDate = null, onSave }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rooms, setRooms] = useState([]);
  const [formData, setFormData] = useState({
    room_id: '',
    check_in_date: '',
    check_out_date: '',
    adults: 1,
    children: 0,
    status: 'pending',
    rate_type: 'EP', // Default to European Plan
    special_requests: '',
    guest_info: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: ''
    }
  });

  // Initialize form data
  useEffect(() => {
    if (booking) {
      // Editing existing booking
      setFormData({
        room_id: booking.room_id || '',
        check_in_date: booking.check_in_date ? booking.check_in_date.split('T')[0] : '',
        check_out_date: booking.check_out_date ? booking.check_out_date.split('T')[0] : '',
        adults: booking.adults || 1,
        children: booking.children || 0,
        status: booking.status || 'pending',
        rate_type: booking.rate_type || 'EP',
        special_requests: booking.special_requests || '',
        guest_info: {
          firstName: booking.guest_info?.firstName || booking.customer_name?.split(' ')[0] || '',
          lastName: booking.guest_info?.lastName || booking.customer_name?.split(' ').slice(1).join(' ') || '',
          email: booking.guest_info?.email || '',
          phone: booking.guest_info?.phone || '',
          address: booking.guest_info?.address || ''
        }
      });
    } else if (selectedDate) {
      // Creating new booking for selected date
      const dateStr = selectedDate.toISOString().split('T')[0];
      const nextDay = new Date(selectedDate);
      nextDay.setDate(nextDay.getDate() + 1);
      const nextDayStr = nextDay.toISOString().split('T')[0];
      
      setFormData(prev => ({
        ...prev,
        check_in_date: dateStr,
        check_out_date: nextDayStr,
        guest_info: {
          firstName: user?.first_name || '',
          lastName: user?.last_name || '',
          email: user?.email || '',
          phone: user?.phone || '',
          address: user?.address || ''
        }
      }));
    }
  }, [booking, selectedDate, user]);

  // Load available rooms
  useEffect(() => {
    const loadRooms = async () => {
      try {
        const response = await roomApi.getRooms();
        setRooms(response.rooms || []);
      } catch (err) {
        console.error('Failed to load rooms:', err);
      }
    };
    
    if (isOpen) {
      loadRooms();
    }
  }, [isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('guest_info.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        guest_info: {
          ...prev.guest_info,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const validateForm = () => {
    const errors = [];
    
    if (!formData.room_id) errors.push('Please select a room');
    if (!formData.check_in_date) errors.push('Please select check-in date');
    if (!formData.check_out_date) errors.push('Please select check-out date');
    if (!formData.guest_info.firstName) errors.push('Please enter guest first name');
    if (!formData.guest_info.lastName) errors.push('Please enter guest last name');
    if (!formData.guest_info.email) errors.push('Please enter guest email');
    
    const checkIn = new Date(formData.check_in_date);
    const checkOut = new Date(formData.check_out_date);
    
    if (checkOut <= checkIn) {
      errors.push('Check-out date must be after check-in date');
    }
    
    if (errors.length > 0) {
      setError(errors.join(', '));
      return false;
    }
    
    setError('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      const bookingData = {
        room_id: formData.room_id,
        check_in_date: formData.check_in_date,
        check_out_date: formData.check_out_date,
        adults: parseInt(formData.adults),
        children: parseInt(formData.children),
        status: formData.status,
        special_requests: formData.special_requests.trim() || null,
        guest_info: formData.guest_info
      };

      if (booking && booking.id) {
        // Update existing booking
        await bookingApi.updateBookingStatus(booking.id, bookingData);
      } else {
        // Create new booking
        await bookingApi.createBooking(bookingData);
      }
      
      onSave && onSave();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save booking');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {booking ? 'Edit Booking' : 'New Booking'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Room Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Room *
            </label>
            <select
              name="room_id"
              value={formData.room_id}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select a room</option>
              {rooms.map(room => (
                <option key={room.id} value={room.id}>
                  Room {room.room_number} - {room.room_type} (Floor {room.floor})
                </option>
              ))}
            </select>
          </div>

          {/* Date Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Check-in Date *
              </label>
              <input
                type="date"
                name="check_in_date"
                value={formData.check_in_date}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Check-out Date *
              </label>
              <input
                type="date"
                name="check_out_date"
                value={formData.check_out_date}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* Guest Count */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Adults *
              </label>
              <input
                type="number"
                name="adults"
                value={formData.adults}
                onChange={handleInputChange}
                min="1"
                max="10"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Children
              </label>
              <input
                type="number"
                name="children"
                value={formData.children}
                onChange={handleInputChange}
                min="0"
                max="8"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Status (for editing existing bookings) */}
          {booking && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="pending">🟨 Pending</option>
                <option value="confirmed">🟩 Confirmed</option>
                <option value="checked_in">🔵 Checked In</option>
                <option value="checked_out">🔴 Checked Out</option>
                <option value="cancelled">⬜ Cancelled</option>
              </select>
            </div>
          )}

          {/* Rate Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rate Type *
            </label>
            <select
              name="rate_type"
              value={formData.rate_type}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="EP">EP - European Plan (Room only)</option>
              <option value="CP">CP - Continental Plan (Room + breakfast)</option>
              <option value="MAP">MAP - Modified American Plan (Room + breakfast + one major meal)</option>
              <option value="AP">AP - American Plan (Room + all meals)</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Select the meal plan included with this booking
            </p>
          </div>

          {/* Guest Information */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Guest Information</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  name="guest_info.firstName"
                  value={formData.guest_info.firstName}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  name="guest_info.lastName"
                  value={formData.guest_info.lastName}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  name="guest_info.email"
                  value={formData.guest_info.email}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  name="guest_info.phone"
                  value={formData.guest_info.phone}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <textarea
                name="guest_info.address"
                value={formData.guest_info.address}
                onChange={handleInputChange}
                rows="2"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Special Requests */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Special Requests
            </label>
            <textarea
              name="special_requests"
              value={formData.special_requests}
              onChange={handleInputChange}
              rows="3"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Any special requests or notes..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Saving...' : (booking ? 'Update Booking' : 'Create Booking')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingModal;

import React, { useState } from 'react';
import { roomApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const RoomResults = ({ rooms, searchCriteria, onNewSearch }) => {
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const { user, isAuthenticated } = useAuth();

  if (!rooms || rooms.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto h-16 w-16 text-gray-400 mb-4">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-1 10V9a2 2 0 012-2h2a2 2 0 012 2v10M9 21v-7a2 2 0 012-2h2a2 2 0 012 2v7" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Rooms Available</h3>
        <p className="text-gray-600 mb-4">
          No rooms match your search criteria. Try adjusting your dates or guest count.
        </p>
        <button
          onClick={onNewSearch}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition duration-200"
        >
          Modify Search
        </button>
      </div>
    );
  }

  const handleBookNow = (room) => {
    if (!isAuthenticated) {
      alert('Please log in to book a room.');
      return;
    }
    setSelectedRoom(room);
    setShowBookingModal(true);
  };

  const handleCloseBookingModal = () => {
    setShowBookingModal(false);
    setSelectedRoom(null);
  };

  const handleBookingSuccess = (booking) => {
    setShowBookingModal(false);
    setSelectedRoom(null);
    alert(`Booking successful! Booking ID: ${booking.id}`);
    // You might want to redirect to booking confirmation page or refresh data
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Search Summary */}
      <div className="bg-blue-50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6 text-sm">
            <div>
              <span className="font-medium text-blue-900">Check-in:</span>
              <span className="text-blue-700 ml-1">{formatDate(searchCriteria?.checkInDate)}</span>
            </div>
            <div>
              <span className="font-medium text-blue-900">Check-out:</span>
              <span className="text-blue-700 ml-1">{formatDate(searchCriteria?.checkOutDate)}</span>
            </div>
            <div>
              <span className="font-medium text-blue-900">Guests:</span>
              <span className="text-blue-700 ml-1">
                {searchCriteria?.adults} adult{searchCriteria?.adults > 1 ? 's' : ''}
                {searchCriteria?.children > 0 && `, ${searchCriteria.children} child${searchCriteria.children > 1 ? 'ren' : ''}`}
              </span>
            </div>
            <div>
              <span className="font-medium text-blue-900">Duration:</span>
              <span className="text-blue-700 ml-1">{searchCriteria?.nights} night{searchCriteria?.nights > 1 ? 's' : ''}</span>
            </div>
          </div>
          <button
            onClick={onNewSearch}
            className="bg-white text-blue-600 border border-blue-600 px-4 py-2 rounded-md hover:bg-blue-50 text-sm font-medium"
          >
            Modify Search
          </button>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">
          {rooms.length} Available Room{rooms.length > 1 ? 's' : ''} Found
        </h2>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <span>Sort by:</span>
          <select className="border border-gray-300 rounded-md px-3 py-1">
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="capacity">Capacity</option>
            <option value="availability">Availability</option>
          </select>
        </div>
      </div>

      {/* Room Results */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {rooms.map((room) => (
          <div key={room.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            {/* Room Images */}
            <div className="relative h-48 bg-gray-200">
              {room.images && room.images.length > 0 ? (
                <img
                  src={room.images[0]}
                  alt={room.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full bg-gray-100">
                  <div className="text-gray-400 text-6xl">🏨</div>
                </div>
              )}
              
              {/* Available count badge */}
              <div className="absolute top-3 right-3 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                {room.availableCount} available
              </div>
            </div>

            {/* Room Details */}
            <div className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{room.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{room.description}</p>
                </div>
              </div>

              {/* Room Info */}
              <div className="flex items-center space-x-4 mb-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM5 8a2 2 0 11-4 0 2 2 0 014 0zM19 8a2 2 0 11-4 0 2 2 0 014 0zM7 14a5.981 5.981 0 00-3.5 1.5A1.5 1.5 0 005 17h10a1.5 1.5 0 001.5-1.5A5.981 5.981 0 0013 14H7z" />
                  </svg>
                  Up to {room.capacity} guests
                </div>
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                  </svg>
                  {room.totalRooms} total rooms
                </div>
              </div>

              {/* Amenities */}
              {room.amenities && room.amenities.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Amenities</h4>
                  <div className="flex flex-wrap gap-2">
                    {room.amenities.slice(0, 4).map((amenity, index) => (
                      <span
                        key={index}
                        className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs"
                      >
                        {amenity}
                      </span>
                    ))}
                    {room.amenities.length > 4 && (
                      <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                        +{room.amenities.length - 4} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Pricing */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Base price per night:</span>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(room.pricing?.pricePerNight)}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">
                    Total ({room.pricing?.nights} night{room.pricing?.nights > 1 ? 's' : ''}):
                  </span>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(room.pricing?.totalPrice)}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Taxes & fees:</span>
                  <span className="text-gray-900">
                    {formatCurrency(room.pricing?.taxes)}
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-2 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-900">Total Amount:</span>
                    <span className="font-bold text-lg text-green-600">
                      {formatCurrency(room.pricing?.totalWithTax)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={() => handleBookNow(room)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition duration-200"
                >
                  Book Now
                </button>
                <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition duration-200">
                  View Details
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Footer */}
      <div className="bg-white rounded-lg shadow p-6 mt-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">{rooms.length}</div>
            <div className="text-sm text-gray-600">Room Types Available</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {rooms.reduce((sum, room) => sum + room.availableCount, 0)}
            </div>
            <div className="text-sm text-gray-600">Total Rooms Available</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(Math.min(...rooms.map(room => room.pricing?.totalWithTax || 0)))}
            </div>
            <div className="text-sm text-gray-600">Starting From (incl. taxes)</div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && selectedRoom && (
        <BookingModal
          room={selectedRoom}
          searchCriteria={searchCriteria}
          onClose={handleCloseBookingModal}
          onBookingSuccess={handleBookingSuccess}
        />
      )}
    </div>
  );
};

// Booking Modal Component
const BookingModal = ({ room, searchCriteria, onClose, onBookingSuccess }) => {
  const [formData, setFormData] = useState({
    guest_info: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: ''
    },
    special_requests: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { user } = useAuth();

  // Initialize guest info with user data if available
  React.useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        guest_info: {
          firstName: user.first_name || user.firstName || '',
          lastName: user.last_name || user.lastName || '',
          email: user.email || '',
          phone: user.phone || '',
          address: user.address || ''
        }
      }));
    }
  }, [user]);

  const validateForm = () => {
    const newErrors = {};
    const { guest_info } = formData;

    if (!guest_info.firstName?.trim()) newErrors.firstName = 'First name is required';
    if (!guest_info.lastName?.trim()) newErrors.lastName = 'Last name is required';
    if (!guest_info.email?.trim()) newErrors.email = 'Email is required';
    if (!guest_info.phone?.trim()) newErrors.phone = 'Phone number is required';
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (guest_info.email && !emailRegex.test(guest_info.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Phone validation (basic)
    if (guest_info.phone && guest_info.phone.replace(/\D/g, '').length < 10) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      guest_info: {
        ...prev.guest_info,
        [field]: value
      }
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      const bookingData = {
        room_type_id: room.id,
        check_in_date: searchCriteria.checkInDate,
        check_out_date: searchCriteria.checkOutDate,
        adults: searchCriteria.adults,
        children: searchCriteria.children || 0,
        special_requests: formData.special_requests.trim() || null,
        guest_info: formData.guest_info
      };

      const result = await roomApi.createBooking(bookingData);
      onBookingSuccess(result.booking);
    } catch (error) {
      console.error('Booking error:', error);
      setErrors({ general: error.message || 'Failed to create booking' });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Complete Your Booking</h3>
            <p className="text-sm text-gray-600 mt-1">{room.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {errors.general && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{errors.general}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Booking Summary */}
            <div className="lg:col-span-2">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Guest Information</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={formData.guest_info.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.firstName ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter first name"
                  />
                  {errors.firstName && <p className="text-xs text-red-600 mt-1">{errors.firstName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={formData.guest_info.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.lastName ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter last name"
                  />
                  {errors.lastName && <p className="text-xs text-red-600 mt-1">{errors.lastName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={formData.guest_info.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.email ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter email address"
                  />
                  {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={formData.guest_info.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.phone ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter phone number"
                  />
                  {errors.phone && <p className="text-xs text-red-600 mt-1">{errors.phone}</p>}
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <textarea
                  value={formData.guest_info.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter full address (optional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Special Requests
                </label>
                <textarea
                  value={formData.special_requests}
                  onChange={(e) => setFormData({ ...formData, special_requests: e.target.value })}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Any special requests or requirements (optional)"
                  maxLength={1000}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.special_requests.length}/1000 characters
                </p>
              </div>
            </div>

            {/* Booking Summary Sidebar */}
            <div>
              <div className="bg-gray-50 rounded-lg p-4 sticky top-4">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Booking Summary</h4>
                
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Check-in:</span>
                    <span className="font-medium">{formatDate(searchCriteria.checkInDate)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Check-out:</span>
                    <span className="font-medium">{formatDate(searchCriteria.checkOutDate)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Guests:</span>
                    <span className="font-medium">
                      {searchCriteria.adults} adult{searchCriteria.adults > 1 ? 's' : ''}
                      {searchCriteria.children > 0 && `, ${searchCriteria.children} child${searchCriteria.children > 1 ? 'ren' : ''}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-medium">{searchCriteria.nights} night{searchCriteria.nights > 1 ? 's' : ''}</span>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4 mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Room rate per night:</span>
                    <span>{formatCurrency(room.pricing?.pricePerNight)}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Subtotal ({searchCriteria.nights} nights):</span>
                    <span>{formatCurrency(room.pricing?.totalPrice)}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Taxes & fees:</span>
                    <span>{formatCurrency(room.pricing?.taxes)}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2">
                    <div className="flex justify-between font-semibold">
                      <span>Total Amount:</span>
                      <span className="text-lg text-green-600">
                        {formatCurrency(room.pricing?.totalWithTax)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-gray-500 mb-4">
                  <p>✓ Free cancellation up to 24 hours before check-in</p>
                  <p>✓ Confirmation will be sent to your email</p>
                  <p>✓ No payment required now - pay at hotel</p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {loading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </div>
              ) : (
                'Confirm Booking'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RoomResults;

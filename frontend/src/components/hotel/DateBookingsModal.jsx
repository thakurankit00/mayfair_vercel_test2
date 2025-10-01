import React, { useEffect } from 'react';

const DateBookingsModal = ({ isOpen, onClose, date, bookings, onBookingClick }) => {
  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getBookingStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'checked_in':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'checked_out':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return '✅';
      case 'pending':
        return '⏳';
      case 'checked_in':
        return '🏨';
      case 'checked_out':
        return '✈️';
      case 'cancelled':
        return '❌';
      default:
        return '📋';
    }
  };



  const calculateNights = (checkIn, checkOut) => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              All Bookings for {formatDate(date)}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {bookings.length} booking{bookings.length !== 1 ? 's' : ''} scheduled
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md p-2"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {bookings.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 text-4xl mb-4">📅</div>
              <p className="text-gray-600">No bookings found for this date</p>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking, index) => (
                <div
                  key={`${booking.id}-${index}`}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-lg hover:border-blue-300 transition-all duration-200 cursor-pointer bg-white hover:bg-blue-50 group"
                  onClick={() => {
                    console.log('📅 [DATE BOOKINGS MODAL] Booking clicked:', booking);
                    if (onBookingClick) {
                      onBookingClick(booking);
                    }
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Room and Guest Info */}
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                          Room {booking.room_number}
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getBookingStatusColor(booking.status)}`}>
                          {getStatusIcon(booking.status)} {booking.status?.replace('_', ' ').toUpperCase() || 'PENDING'}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Guest Information */}
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Guest Information</h4>
                          <div className="space-y-1 text-sm text-gray-600">
                            <div className="flex items-center">
                              <span className="font-medium w-16">Name:</span>
                              <span>{booking.customer_name || 'Guest'}</span>
                            </div>
                            {booking.customer_email && (
                              <div className="flex items-center">
                                <span className="font-medium w-16">Email:</span>
                                <span className="text-blue-600">{booking.customer_email}</span>
                              </div>
                            )}
                            {booking.customer_phone && (
                              <div className="flex items-center">
                                <span className="font-medium w-16">Phone:</span>
                                <span>{booking.customer_phone}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Booking Details */}
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Booking Details</h4>
                          <div className="space-y-1 text-sm text-gray-600">
                            <div className="flex items-center">
                              <span className="font-medium w-20">Check-in:</span>
                              <span>{new Date(booking.check_in_date).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center">
                              <span className="font-medium w-20">Check-out:</span>
                              <span>{new Date(booking.check_out_date).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center">
                              <span className="font-medium w-20">Duration:</span>
                              <span>{calculateNights(booking.check_in_date, booking.check_out_date)} night{calculateNights(booking.check_in_date, booking.check_out_date) !== 1 ? 's' : ''}</span>
                            </div>
                            <div className="flex items-center">
                              <span className="font-medium w-20">Guests:</span>
                              <span>{booking.adults || 1} adult{(booking.adults || 1) !== 1 ? 's' : ''}{booking.children ? `, ${booking.children} child${booking.children !== 1 ? 'ren' : ''}` : ''}</span>
                            </div>
                            {booking.total_amount && (
                              <div className="flex items-center">
                                <span className="font-medium w-20">Total:</span>
                                <span className="font-semibold text-green-600">${booking.total_amount}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Special Requests */}
                      {booking.special_requests && (
                        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                          <h5 className="text-sm font-medium text-yellow-800 mb-1">Special Requests:</h5>
                          <p className="text-sm text-yellow-700">{booking.special_requests}</p>
                        </div>
                      )}
                    </div>

                    {/* Booking ID and Click Indicator */}
                    <div className="text-right">
                      <div className="text-xs text-gray-500 mb-1">Booking ID</div>
                      <div className="text-sm font-mono text-blue-600 bg-blue-50 px-2 py-1 rounded mb-2">
                        #{booking.id}
                      </div>
                      <div className="text-xs text-gray-400 group-hover:text-blue-600 transition-colors">
                        Click to edit →
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Click on any booking to view or edit details
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DateBookingsModal;

import React from 'react';

const BookingTooltip = ({ booking, position }) => {
  if (!booking) return null;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'checked_in':
        return 'bg-blue-100 text-blue-800';
      case 'checked_out':
        return 'bg-gray-100 text-gray-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlatformColor = (platform) => {
    switch (platform) {
      case 'direct':
        return 'bg-blue-100 text-blue-800';
      case 'booking.com':
        return 'bg-blue-100 text-blue-800';
      case 'airbnb':
        return 'bg-red-100 text-red-800';
      case 'expedia':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Calculate tooltip position to prevent overflow
  const tooltipStyle = {
    position: 'fixed',
    left: `${Math.min(position.x, window.innerWidth - 320)}px`, // 320px is tooltip width
    top: `${Math.min(position.y, window.innerHeight - 300)}px`, // Adjust for tooltip height
    zIndex: 1000
  };

  return (
    <div
      style={tooltipStyle}
      className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm w-80 pointer-events-none"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-900 text-sm">
            Room {booking.room_number}
          </h3>
          <p className="text-xs text-gray-500">{booking.room_type}</p>
        </div>
        <div className="flex space-x-2">
          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
            {booking.status.replace('_', ' ')}
          </span>
          {booking.platform && (
            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getPlatformColor(booking.platform)}`}>
              {booking.platform}
            </span>
          )}
        </div>
      </div>

      {/* Customer Information */}
      <div className="space-y-2 mb-3">
        <div>
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-sm font-medium text-gray-900">{booking.customer_name}</span>
          </div>
          {booking.customer_phone && (
            <div className="flex items-center space-x-2 ml-6">
              <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span className="text-xs text-gray-600">{booking.customer_phone}</span>
            </div>
          )}
        </div>
      </div>

      {/* Booking Details */}
      <div className="space-y-2 mb-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Check-in:</span>
          <span className="font-medium text-gray-900">{formatDate(booking.check_in_date)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Check-out:</span>
          <span className="font-medium text-gray-900">{formatDate(booking.check_out_date)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Duration:</span>
          <span className="font-medium text-gray-900">
            {booking.nights} night{booking.nights !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Guests:</span>
          <div className="font-medium text-gray-900">
            {booking.adults} adult{booking.adults !== 1 ? 's' : ''}
            {booking.children > 0 && `, ${booking.children} child${booking.children !== 1 ? 'ren' : ''}`}
            <span className="text-gray-500 ml-1">({booking.total_guests} total)</span>
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="border-t border-gray-200 pt-2 mb-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Total Amount:</span>
          <span className="font-semibold text-green-600">{formatCurrency(booking.total_amount)}</span>
        </div>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Per night:</span>
          <span>{formatCurrency(booking.total_amount / booking.nights)}</span>
        </div>
      </div>

      {/* Special Requests */}
      {booking.special_requests && (
        <div className="mb-3">
          <div className="text-xs text-gray-600 mb-1">Special Requests:</div>
          <div className="text-xs text-gray-800 bg-gray-50 p-2 rounded italic">
            "{booking.special_requests}"
          </div>
        </div>
      )}

      {/* Booking Date */}
      <div className="border-t border-gray-200 pt-2">
        <div className="flex items-center space-x-2 text-xs text-gray-500">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>
            Booked on {new Date(booking.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
          </span>
        </div>
      </div>

      {/* Quick Actions Hint */}
      <div className="border-t border-gray-200 pt-2 mt-2">
        <div className="text-xs text-gray-400 text-center">
          Click booking to manage • Double-click for details
        </div>
      </div>
    </div>
  );
};

export default BookingTooltip;

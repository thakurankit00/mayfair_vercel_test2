import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { reservationApi } from '../../services/reservationApi';

const ReservationModal = ({ 
  isOpen, 
  onClose, 
  selectedReservation = null,
  title = "Reservation Details" 
}) => {
  const [reservation, setReservation] = useState(selectedReservation);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch reservation details if only ID is provided
  useEffect(() => {
    if (isOpen && selectedReservation && typeof selectedReservation === 'object') {
      setReservation(selectedReservation);
    } else if (isOpen && selectedReservation && typeof selectedReservation === 'string') {
      // If selectedReservation is just an ID, fetch the details
      fetchReservationDetails(selectedReservation);
    }
  }, [isOpen, selectedReservation]);

  const fetchReservationDetails = async (reservationId) => {
    try {
      setLoading(true);
      setError(null);
      
      // This would need to be implemented based on your API structure
      // For now, we'll just use the selectedReservation as-is
      setReservation(selectedReservation);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md p-1"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-600">Loading reservation details...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-red-500 text-4xl mb-4">⚠️</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Close
              </button>
            </div>
          ) : reservation ? (
            <div className="space-y-4">
              {/* Reservation Type & Reference */}
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                  reservation.type === 'room' 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'bg-orange-100 text-orange-600'
                }`}>
                  {reservation.type === 'room' ? '🏨' : '🍽️'}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {reservation.title}
                  </h3>
                  <p className="text-blue-600 font-medium">
                    {reservation.reference}
                  </p>
                </div>
              </div>

              {/* Guest Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Guest Information</h4>
                <div className="space-y-1">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Name:</span> {reservation.guestName}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Party Size:</span> {reservation.guestCount} guest{reservation.guestCount !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              {/* Reservation Details */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Reservation Details</h4>
                <div className="space-y-1">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Date:</span> {reservation.date}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Time:</span> {reservation.time}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">
                      {reservation.type === 'room' ? 'Room:' : 'Table:'}
                    </span> {reservation.details}
                  </p>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-900">Status:</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  reservation.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                  reservation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  reservation.status === 'checked_in' ? 'bg-blue-100 text-blue-800' :
                  reservation.status === 'seated' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-400 text-4xl mb-4">📅</div>
              <p className="text-gray-600">No reservation details available</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default ReservationModal;

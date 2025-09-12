import React, { useState, useEffect } from 'react';
import { restaurantReservationApi } from '../../services/restaurantApi';
import { useAuth } from '../../contexts/AuthContext';
import io from 'socket.io-client';

const ReservationDetailsModal = ({ reservation, onClose, onUpdate }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentReservation, setCurrentReservation] = useState(reservation);

  useEffect(() => {
    setCurrentReservation(reservation);
  }, [reservation]);

  // Socket connection for real-time updates
  useEffect(() => {
    const socket = io(process.env.REACT_APP_API_URL || 'http://localhost:3000', {
      transports: ['websocket'],
      autoConnect: true
    });

    socket.on('table_status_updated', async (data) => {
      // If this reservation's table was updated, refresh the reservation data
      if (data.table_id === currentReservation?.table_id) {
        try {
          const updatedReservation = await restaurantReservationApi.getReservation(currentReservation.id);
          setCurrentReservation(updatedReservation.reservation);
        } catch (err) {
          console.error('Failed to refresh reservation:', err);
        }
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [currentReservation?.id, currentReservation?.table_id]);

  if (!currentReservation) return null;

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this reservation?')) return;
    
    setLoading(true);
    try {
      await restaurantReservationApi.cancelReservation(currentReservation.id);
      if (onUpdate) onUpdate();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to cancel reservation');
    } finally {
      setLoading(false);
    }
  };

  const canEdit = ['admin', 'manager', 'receptionist', 'waiter'].includes(user?.role);
  const canCancel = canEdit && currentReservation.status !== 'cancelled' && currentReservation.status !== 'completed';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Reservation Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 focus:outline-none"
            disabled={loading}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Reservation Reference</label>
              <p className="mt-1 text-sm text-gray-900">{currentReservation.reservation_reference || '-'}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Customer Name</label>
              <p className="mt-1 text-sm text-gray-900">
                {currentReservation.user_first_name && currentReservation.user_last_name 
                  ? `${currentReservation.user_first_name} ${currentReservation.user_last_name}`
                  : currentReservation.customer_name || '-'
                }
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <p className="mt-1 text-sm text-gray-900">{currentReservation.user_email || currentReservation.email || '-'}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <p className="mt-1 text-sm text-gray-900">{currentReservation.user_phone || currentReservation.phone || '-'}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Table</label>
                <p className="mt-1 text-sm text-gray-900">Table {currentReservation.table_number || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Location</label>
                <p className="mt-1 text-sm text-gray-900">{currentReservation.location || '-'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Date</label>
                <p className="mt-1 text-sm text-gray-900">
                  {currentReservation.reservation_date 
                    ? new Date(currentReservation.reservation_date).toLocaleDateString()
                    : '-'
                  }
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Time</label>
                <p className="mt-1 text-sm text-gray-900">
                  {currentReservation.reservation_time?.slice(0, 5) || '-'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Party Size</label>
                <p className="mt-1 text-sm text-gray-900">{currentReservation.party_size || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                  currentReservation.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                  currentReservation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  currentReservation.status === 'seated' ? 'bg-blue-100 text-blue-800' :
                  currentReservation.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                  currentReservation.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {currentReservation.status || '-'}
                </span>
              </div>
            </div>

            {currentReservation.special_requests && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Special Requests</label>
                <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-2 rounded">
                  {currentReservation.special_requests}
                </p>
              </div>
            )}

            {currentReservation.created_at && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Created</label>
                <p className="mt-1 text-sm text-gray-500">
                  {new Date(currentReservation.created_at).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        {canEdit && (
          <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              Close
            </button>
            {canCancel && (
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Cancelling...' : 'Cancel Reservation'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReservationDetailsModal;
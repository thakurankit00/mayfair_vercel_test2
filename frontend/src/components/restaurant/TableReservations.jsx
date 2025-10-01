import React, { useState, useEffect } from 'react';
import { restaurantReservationApi } from '../../services/restaurantApi';
import ReservationDetailsModal from './ReservationDetailsModal';
import io from 'socket.io-client';

const TableReservations = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [socket, setSocket] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);

  useEffect(() => {
    loadReservations();
    
    // Initialize socket connection for real-time updates
    const socketConnection = io(process.env.REACT_APP_API_URL || 'http://localhost:3000', {
      transports: ['websocket'],
      autoConnect: true,
      forceNew: true
    });

    socketConnection.on('connect', () => {
      console.log('Socket connected for reservations:', socketConnection.id);
    });

    // Listen for table status updates to refresh reservations
    socketConnection.on('table_status_updated', (data) => {
      console.log('Table status updated, refreshing reservations:', data);
      loadReservations();
    });

    setSocket(socketConnection);

    return () => {
      if (socketConnection) {
        socketConnection.disconnect();
      }
    };
  }, []);

  const loadReservations = async () => {
    try {
      setLoading(true);
      const data = await restaurantReservationApi.getReservations();
      setReservations(data.reservations || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load reservations');
    }
    setLoading(false);
  };

  const getCustomerName = (reservation) => {
    if (reservation.customer_name) return reservation.customer_name;
    if (reservation.user_first_name && reservation.user_last_name) {
      return `${reservation.user_first_name} ${reservation.user_last_name}`;
    }
    return '-';
  };

  const formatDate = (dateString) => {
    return dateString ? new Date(dateString).toLocaleDateString() : '-';
  };

  const formatTime = (timeString) => {
    return timeString ? timeString.slice(0, 5) : '-';
  };

  const handleCancel = async (reservationId) => {
    try {
      await restaurantReservationApi.cancelReservation(reservationId);
      // No need to manually reload - socket will trigger update
    } catch (err) {
      setError(err.message || 'Failed to cancel reservation');
    }
  };

  const handleViewDetails = (reservation) => {
    setSelectedReservation(reservation);
    setShowDetailsModal(true);
  };

  const handleReservationUpdated = () => {
    loadReservations();
  };

  if (loading) return <div className="p-6 text-center">Loading reservations...</div>;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Table Reservations</h1>
      
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reservation Ref</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Table</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Party Size</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {reservations.map((reservation) => (
              <tr key={reservation.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleViewDetails(reservation)}>
                <td className="px-4 py-3 text-sm">{reservation.reservation_reference || '-'}</td>
                <td className="px-4 py-3 text-sm font-medium">{getCustomerName(reservation)}</td>
                <td className="px-4 py-3 text-sm">{reservation.user_email || reservation.email || '-'}</td>
                <td className="px-4 py-3 text-sm">{reservation.user_phone || reservation.phone || '-'}</td>
                <td className="px-4 py-3 text-sm">{reservation.table_number || '-'}</td>
                <td className="px-4 py-3 text-sm">{reservation.location || '-'}</td>
                <td className="px-4 py-3 text-sm">{reservation.party_size || '-'}</td>
                <td className="px-4 py-3 text-sm">{formatDate(reservation.reservation_date)}</td>
                <td className="px-4 py-3 text-sm">{formatTime(reservation.reservation_time)}</td>
                <td className="px-4 py-3 text-sm">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    reservation.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                    reservation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    reservation.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {reservation.status || '-'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm" onClick={(e) => e.stopPropagation()}>
                  {reservation.status !== 'cancelled' && (
                    <button
                      onClick={() => handleCancel(reservation.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Cancel
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Reservation Details Modal */}
      {showDetailsModal && selectedReservation && (
        <ReservationDetailsModal
          reservation={selectedReservation}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedReservation(null);
          }}
          onUpdate={handleReservationUpdated}
        />
      )}
    </div>
  );
};

export default TableReservations;
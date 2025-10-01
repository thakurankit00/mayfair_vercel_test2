import React, { useState, useEffect } from 'react';
import { restaurantTableApi, restaurantReservationApi } from '../../services/restaurantApi';
import ReservationModal from './ReservationModal';

const ReservationTest = () => {
  const [reservations, setReservations] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  useEffect(() => {
    loadReservations();
  }, []);

  const handleCreateReservation = () => {
    setSelectedReservation(null);
    setShowModal(true);
  };

  const handleEditReservation = (reservation) => {
    setSelectedReservation(reservation);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedReservation(null);
  };

  const handleModalSave = () => {
    loadReservations();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (timeString) => {
    return timeString ? timeString.slice(0, 5) : '';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      case 'seated': return 'text-blue-600 bg-blue-100';
      case 'completed': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading reservations...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Restaurant Reservations</h1>
        <button
          onClick={handleCreateReservation}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          New Reservation
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Guest
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Table
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date & Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Party Size
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {reservations.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                  No reservations found
                </td>
              </tr>
            ) : (
              reservations.map((reservation) => (
                <tr key={reservation.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {reservation.user_first_name ? (
                      <>
                        <div className="text-sm font-medium text-gray-900">
                          {reservation.user_first_name} {reservation.user_last_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {reservation.user_email}
                        </div>
                        <div className="text-sm text-gray-500">
                          {reservation.user_phone}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-sm font-medium text-orange-600">
                          Walk-in Reservation
                        </div>
                        {reservation.created_by_name ? (
                          <>
                            <div className="text-sm text-gray-500">
                              Created by: {reservation.created_by_name} {reservation.created_by_lastname}
                            </div>
                            <div className="text-sm text-blue-600 capitalize">
                              Role: {reservation.created_by_role}
                            </div>
                          </>
                        ) : (
                          <div className="text-sm text-gray-500">
                            No customer info available
                          </div>
                        )}
                      </>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      Table {reservation.table_number}
                    </div>
                    <div className="text-sm text-gray-500">
                      {reservation.location}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatDate(reservation.reservation_date)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatTime(reservation.reservation_time)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {reservation.party_size}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(reservation.status)}`}>
                      {reservation.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEditReservation(reservation)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <ReservationModal
          reservation={selectedReservation}
          onClose={handleModalClose}
          onSave={handleModalSave}
        />
      )}
    </div>
  );
};

export default ReservationTest;
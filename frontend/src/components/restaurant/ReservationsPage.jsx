import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { restaurantReservationApi } from '../../services/restaurantApi';
import LoadingSpinner from '../common/LoadingSpinner';
import ReservationModal from './ReservationModal';
import ReservationDetailsModal from './ReservationDetailsModal';
import io from 'socket.io-client';

const ReservationsPage = () => {
  const { user } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('today');
  const [searchTerm, setSearchTerm] = useState('');

  // Custom date range
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');

  // Modal states
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [editingReservation, setEditingReservation] = useState(null);
  const [selectedReservation, setSelectedReservation] = useState(null);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      
      // Build filter parameters
      const filters = {};
      
      if (statusFilter !== 'all') {
        filters.status = statusFilter;
      }
      
      // Handle date filtering
      const today = new Date();
      const formatDate = (date) => date.toISOString().split('T')[0];
      
      switch (dateFilter) {
        case 'today':
          filters.date_from = formatDate(today);
          filters.date_to = formatDate(today);
          break;
        case 'week':
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          filters.date_from = formatDate(weekAgo);
          filters.date_to = formatDate(today);
          break;
        case 'month':
          const monthAgo = new Date(today);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          filters.date_from = formatDate(monthAgo);
          filters.date_to = formatDate(today);
          break;
        case 'custom':
          if (customDateFrom) filters.date_from = customDateFrom;
          if (customDateTo) filters.date_to = customDateTo;
          break;
      }
      
      const data = await restaurantReservationApi.getReservations(filters);
      setReservations(data.reservations || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to fetch reservations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, [statusFilter, dateFilter, customDateFrom, customDateTo]);

  // Socket.io real-time updates
  useEffect(() => {
    const socket = io(process.env.REACT_APP_API_URL || 'http://localhost:3000', {
      transports: ['websocket'],
      autoConnect: true
    });

    socket.on('reservation_created', () => {
      fetchReservations();
    });

    socket.on('reservation_updated', () => {
      fetchReservations();
    });

    socket.on('reservation_cancelled', () => {
      fetchReservations();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Filter reservations by search term
  const filteredReservations = reservations.filter(reservation => {
    if (!searchTerm.trim()) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      reservation.reservation_reference?.toLowerCase().includes(searchLower) ||
      reservation.user_first_name?.toLowerCase().includes(searchLower) ||
      reservation.user_last_name?.toLowerCase().includes(searchLower) ||
      reservation.customer_name?.toLowerCase().includes(searchLower)
    );
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'seated':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'completed':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleCreateReservation = () => {
    setEditingReservation(null);
    setShowReservationModal(true);
  };

  const handleEditReservation = (reservation) => {
    setEditingReservation(reservation);
    setShowReservationModal(true);
  };

  const handleViewDetails = (reservation) => {
    setSelectedReservation(reservation);
    setShowDetailsModal(true);
  };

  const handleReservationSaved = () => {
    setShowReservationModal(false);
    setEditingReservation(null);
    fetchReservations();
  };

  const handleDetailsUpdated = () => {
    fetchReservations();
  };

  const canEdit = ['admin', 'manager', 'receptionist', 'waiter'].includes(user?.role);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reservations Management</h1>
            <p className="mt-2 text-gray-600">
              View and manage all table reservations with real-time updates
            </p>
          </div>
          
          {canEdit && (
            <button
              onClick={handleCreateReservation}
              className="bg-light-orange text-white px-4 py-2 rounded-md hover:bg-light-orange focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              New Reservation
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="seated">Seated</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Date Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Range
            </label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <input
              type="text"
              placeholder="Reference ID or Customer Name"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Custom Date Range */}
        {dateFilter === 'custom' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                From Date
              </label>
              <input
                type="date"
                value={customDateFrom}
                onChange={(e) => setCustomDateFrom(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                To Date
              </label>
              <input
                type="date"
                value={customDateTo}
                onChange={(e) => setCustomDateTo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Reservations</p>
              <p className="text-2xl font-semibold text-gray-900">{filteredReservations.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-semibold text-gray-900">
                {filteredReservations.filter(r => r.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Confirmed</p>
              <p className="text-2xl font-semibold text-gray-900">
                {filteredReservations.filter(r => r.status === 'confirmed').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Seated</p>
              <p className="text-2xl font-semibold text-gray-900">
                {filteredReservations.filter(r => r.status === 'seated').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
          <button
            onClick={() => setError('')}
            className="mt-2 text-red-600 hover:text-red-700 text-sm font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner />
        </div>
      )}

      {/* Reservations List */}
      {!loading && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Reservations ({filteredReservations.length})
            </h2>
          </div>

          {filteredReservations.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <div className="text-gray-400 text-6xl mb-4">📅</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No reservations found</h3>
              <p className="text-gray-600">
                Try adjusting your filters or search criteria
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reference ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer Name
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
                  {filteredReservations.map((reservation) => (
                    <tr key={reservation.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {reservation.reservation_reference || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {reservation.user_first_name && reservation.user_last_name 
                            ? `${reservation.user_first_name} ${reservation.user_last_name}`
                            : reservation.customer_name || '-'
                          }
                        </div>
                        {(reservation.user_email || reservation.email) && (
                          <div className="text-xs text-gray-500">
                            {reservation.user_email || reservation.email}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          Table {reservation.table_number || '-'}
                        </div>
                        {reservation.location && (
                          <div className="text-xs text-gray-500">
                            {reservation.location.replace('_', ' ')}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {reservation.reservation_date 
                            ? new Date(reservation.reservation_date).toLocaleDateString()
                            : '-'
                          }
                        </div>
                        <div className="text-xs text-gray-500">
                          {reservation.reservation_time?.slice(0, 5) || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {reservation.party_size || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(reservation.status)}`}>
                          {reservation.status ? reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1) : '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleViewDetails(reservation)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            View
                          </button>
                          {canEdit && reservation.status !== 'cancelled' && reservation.status !== 'completed' && (
                            <button
                              onClick={() => handleEditReservation(reservation)}
                              className="text-green-600 hover:text-green-700"
                            >
                              Edit
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {showReservationModal && (
        <ReservationModal
          reservation={editingReservation}
          onClose={() => setShowReservationModal(false)}
          onSave={handleReservationSaved}
        />
      )}

      {showDetailsModal && selectedReservation && (
        <ReservationDetailsModal
          reservation={selectedReservation}
          onClose={() => setShowDetailsModal(false)}
          onUpdate={handleDetailsUpdated}
        />
      )}
    </div>
  );
};

export default ReservationsPage;
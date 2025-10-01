import React, { useState, useEffect, useCallback } from 'react';
import { reservationApi } from '../../services/reservationApi';
import { useAuth } from '../../contexts/AuthContext';

const TodayReservationsWidget = ({ onReservationClick, className = '' }) => {
  const { user, hasAnyRole } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user can view reservations
  const canViewReservations = hasAnyRole(['receptionist', 'waiter', 'chef', 'bartender', 'manager', 'admin']);

  // Fetch today's reservations
  const fetchReservations = useCallback(async () => {
    if (!canViewReservations) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await reservationApi.fetchTodayReservations();
      
      if (response.success) {
        setReservations(response.data.reservations);
      } else {
        setError(response.error || 'Failed to load reservations');
      }
    } catch (err) {
      console.error('Error fetching today\'s reservations:', err);
      setError(err.message || 'Failed to load reservations');
    } finally {
      setLoading(false);
    }
  }, [canViewReservations]);

  // Initial fetch and periodic refresh
  useEffect(() => {
    fetchReservations();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchReservations, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [fetchReservations]);

  // Handle reservation click
  const handleReservationClick = useCallback((reservation) => {
    if (onReservationClick) {
      onReservationClick(reservation);
    }
  }, [onReservationClick]);

  // Don't render if user can't view reservations
  if (!canViewReservations) {
    return null;
  }

  return (
    <div className={`bg-gray-800 rounded-lg border border-gray-700 ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-white">Upcoming</h3>
          <button
            onClick={fetchReservations}
            disabled={loading}
            className="text-gray-400 hover:text-white transition-colors p-1 rounded"
            title="Refresh"
          >
            <svg 
              className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-h-32 overflow-y-auto">
        {loading ? (
          // Loading state
          <div className="p-4 space-y-3">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-700 rounded"></div>
                  <div className="flex-1">
                    <div className="w-24 h-3 bg-gray-700 rounded mb-1"></div>
                    <div className="w-16 h-2 bg-gray-700 rounded"></div>
                  </div>
                  <div className="w-12 h-3 bg-gray-700 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          // Error state
          <div className="p-4 text-center">
            <div className="text-red-400 text-xs mb-2">⚠️ Error</div>
            <p className="text-gray-400 text-xs">{error}</p>
            <button
              onClick={fetchReservations}
              className="mt-2 text-blue-400 hover:text-blue-300 text-xs underline"
            >
              Try again
            </button>
          </div>
        ) : reservations.length === 0 ? (
          // Empty state
          <div className="p-4 text-center">
            <div className="text-gray-500 text-2xl mb-2">📅</div>
            <p className="text-gray-400 text-xs">No reservations today</p>
          </div>
        ) : (
          // Reservations list
          <div className="divide-y divide-gray-700">
            {reservations.map((reservation) => (
              <div
                key={`${reservation.type}-${reservation.id}`}
                onClick={() => handleReservationClick(reservation)}
                className="p-3 hover:bg-gray-700 cursor-pointer transition-colors"
              >
                <div className="flex items-center space-x-3">
                  {/* Icon */}
                  <div className="flex-shrink-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${
                      reservation.type === 'room' 
                        ? 'bg-blue-900 text-blue-300' 
                        : 'bg-orange-900 text-orange-300'
                    }`}>
                      {reservation.type === 'room' ? '🏨' : '🍽️'}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <p className="text-white text-xs font-medium truncate">
                        {reservation.title}
                      </p>
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                        reservation.type === 'room' 
                          ? 'bg-blue-900 text-blue-300' 
                          : 'bg-orange-900 text-orange-300'
                      }`}>
                        {reservation.reference}
                      </span>
                    </div>
                    <p className="text-gray-400 text-xs truncate">
                      {reservation.time} • {reservation.details}
                    </p>
                  </div>

                  {/* Status indicator */}
                  <div className="flex-shrink-0">
                    <div className={`w-2 h-2 rounded-full ${
                      reservation.status === 'confirmed' ? 'bg-green-500' :
                      reservation.status === 'pending' ? 'bg-yellow-500' :
                      reservation.status === 'checked_in' ? 'bg-blue-500' :
                      reservation.status === 'seated' ? 'bg-blue-500' :
                      'bg-gray-500'
                    }`}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer with count */}
      {!loading && !error && reservations.length > 0 && (
        <div className="px-4 py-2 border-t border-gray-700">
          <p className="text-gray-400 text-xs text-center">
            {reservations.length} reservation{reservations.length !== 1 ? 's' : ''} today
          </p>
        </div>
      )}
    </div>
  );
};

export default TodayReservationsWidget;

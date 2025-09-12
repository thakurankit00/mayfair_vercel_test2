import React, { useState, useEffect } from 'react';
import { restaurantTableApi, restaurantReservationApi } from '../../services/restaurantApi';
import AddTableForm from './AddTableForm';
import EditTableModal from './EditTableModal';
import ReservationModal from './ReservationModal';
import ReservationDetailsModal from './ReservationDetailsModal';
import io from 'socket.io-client';

const RestaurantTables = ({ selectedRestaurant, restaurants, userRole }) => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAddTableModal, setShowAddTableModal] = useState(false);
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [socket, setSocket] = useState(null);

  // Initialize socket connection
  useEffect(() => {
    const socketConnection = io(process.env.REACT_APP_API_URL || 'http://localhost:3000', {
      transports: ['websocket'],
      autoConnect: true,
      forceNew: true
    });

    socketConnection.on('connect', () => {
      console.log('Socket connected for tables:', socketConnection.id);
    });

    socketConnection.on('connect_error', (error) => {
      console.log('Socket connection error:', error);
    });

    // Listen for table status updates
    socketConnection.on('table_status_updated', (data) => {
      console.log('Table status updated:', data);
      setTables(prev => 
        prev.map(t => 
          t.id === data.table_id 
            ? { ...t, booking_status: data.booking_status }
            : t
        )
      );
    });

    // Listen for table deletion
    socketConnection.on('table_deleted', (data) => {
      console.log('Table deleted:', data);
      setTables(prev => prev.filter(t => t.id !== data.table_id));
    });

    // Listen for new table creation
    socketConnection.on('table_created', (data) => {
      console.log('New table created:', data);
      if (!selectedRestaurant || data.table.restaurant_id === selectedRestaurant) {
        setTables(prev => [...prev, data.table]);
      }
    });

    setSocket(socketConnection);

    return () => {
      if (socketConnection) {
        socketConnection.disconnect();
      }
    };
  }, []);

  // Load tables when restaurant changes
  useEffect(() => {
    if (selectedRestaurant) {
      loadTables();
    } else {
      setTables([]);
    }
  }, [selectedRestaurant]);

  const loadTables = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await restaurantTableApi.getTables(selectedRestaurant);
      setTables(data.tables || []);
    } catch (err) {
      setError(err.message || 'Failed to load tables');
    } finally {
      setLoading(false);
    }
  };

  const handleTableAdded = (newTable) => {
    // Check if table already exists (socket might have already added it)
    setTables(prev => {
      const exists = prev.some(t => t.id === newTable.id);
      if (exists) {
        return prev;
      }
      return [...prev, newTable];
    });
    setShowAddTableModal(false);
  };

  const handleTableEdited = (updatedTable) => {
    setTables(prev => 
      prev.map(t => t.id === updatedTable.id ? updatedTable : t)
    );
  };

  const handleTableDeleted = (tableId) => {
    setTables(prev => prev.filter(t => t.id !== tableId));
  };

  const handleTableAction = async (table) => {
    if (table.booking_status === 'booked') {
      // Find and show reservation details for this table
      try {
        const today = new Date().toISOString().split('T')[0];
        const reservationData = await restaurantReservationApi.getReservations({
          date_from: today,
          date_to: today
        });
        
        const tableReservation = reservationData.reservations?.find(
          r => r.table_id === table.id && ['confirmed', 'seated'].includes(r.status)
        );
        
        if (tableReservation) {
          setSelectedReservation(tableReservation);
          setShowDetailsModal(true);
        } else {
          setError(`Table ${table.table_number} appears to be booked but no reservation details found.`);
        }
      } catch (err) {
        setError(`Error loading reservation details: ${err.message}`);
      }
    } else {
      // Open reservation modal with pre-filled table
      setSelectedTable(table);
      setShowReservationModal(true);
    }
  };

  const handleReservationSaved = () => {
    setShowReservationModal(false);
    setSelectedTable(null);
    // Refresh tables to get updated status
    loadTables();
  };

  const handleReservationUpdated = () => {
    // Refresh tables to get updated status
    loadTables();
  };

  const selectedRestaurantData = restaurants.find(r => r.id === selectedRestaurant);

  const getStatusBadge = (status) => {
    if (status === 'available') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          🟢 Available
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          ⚫ Booked
        </span>
      );
    }
  };

  const getActionButton = (table) => {
    if (table.booking_status === 'booked') {
      return (
        <button
          onClick={() => handleTableAction(table)}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          View Details
        </button>
      );
    } else {
      return (
        <button
          onClick={() => handleTableAction(table)}
          className="text-green-600 hover:text-green-800 text-sm font-medium"
        >
          Add Reservation
        </button>
      );
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Restaurant Tables</h3>
        {['admin', 'manager'].includes(userRole) && selectedRestaurant && (
          <button
            onClick={() => setShowAddTableModal(true)}
            className="bg-light-orange text-white px-4 py-2 rounded-md hover:bg-orange-500"
          >
            Add Table
          </button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Restaurant Info */}
      {selectedRestaurantData && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <h4 className="font-semibold text-blue-900">
                {selectedRestaurantData.name}
              </h4>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {selectedRestaurantData.restaurant_type}
              </span>
            </div>
            <div className="text-sm text-blue-700">
              Total Tables: {tables.length} | 
              Available: {tables.filter(t => t.booking_status === 'available').length} | 
              Booked: {tables.filter(t => t.booking_status === 'booked').length}
            </div>
          </div>
        </div>
      )}

      {/* No Restaurant Selected */}
      {!selectedRestaurant && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800 text-sm">
            💡 Select a specific restaurant above to view and manage its tables.
          </p>
        </div>
      )}

      {/* Tables Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tables.map((table) => (
          <div key={table.id} className="bg-white rounded-lg shadow p-6 border">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-lg font-semibold text-gray-900">
                Table {table.table_number}
              </h4>
              <div className="flex items-center space-x-2">
                {getStatusBadge(table.booking_status)}
              </div>
            </div>

            <div className="space-y-2 text-sm text-gray-600 mb-4">
              <div className="flex items-center justify-between">
                <span>Capacity:</span>
                <span className="font-medium">{table.capacity} guests</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Location:</span>
                <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                  {table.location?.replace('_', ' ') || 'N/A'}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center space-x-2">
              {getActionButton(table)}
              {['admin', 'manager'].includes(userRole) && (
                <EditTableModal
                  item={table}
                  onEdit={handleTableEdited}
                  onDelete={handleTableDeleted}
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {selectedRestaurant && tables.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg">🪑</div>
          <p className="text-gray-600 mt-2">No tables configured</p>
          {['admin', 'manager'].includes(userRole) && (
            <button
              onClick={() => setShowAddTableModal(true)}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Add First Table
            </button>
          )}
        </div>
      )}

      {/* Add Table Modal */}
      {showAddTableModal && (
        <AddTableForm
          isOpen={showAddTableModal}
          onClose={() => setShowAddTableModal(false)}
          onTableAdded={handleTableAdded}
          restaurantId={selectedRestaurant}
        />
      )}

      {/* Reservation Modal */}
      {showReservationModal && selectedTable && (
        <ReservationModal
          reservation={null}
          prefilledTableId={selectedTable.id}
          onClose={() => {
            setShowReservationModal(false);
            setSelectedTable(null);
          }}
          onSave={handleReservationSaved}
        />
      )}

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

export default RestaurantTables;
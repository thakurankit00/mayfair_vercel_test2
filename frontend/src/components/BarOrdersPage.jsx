import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { orderApi } from '../services/restaurantApi';
import LoadingSpinner from './common/LoadingSpinner';

const BarOrdersPage = () => {
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  const [dashboardData, setDashboardData] = useState({ orders: [], stats: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updateLoading, setUpdateLoading] = useState({});
  const [orderActionLoading, setOrderActionLoading] = useState({});

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      const data = await orderApi.getKitchenDashboard();
      setDashboardData(data);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to fetch bar orders data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only allow bartenders to access this page
    if (user?.role !== 'bartender' && user?.role !== 'admin' && user?.role !== 'manager') {
      setError('Access denied. Only bartenders can access this page.');
      setLoading(false);
      return;
    }

    fetchDashboardData();

    // Set up socket listeners for real-time updates
    if (socket) {
      socket.emit('join-kitchen-room', 'bartender');

      socket.on('new-kitchen-order', (data) => {
        console.log('New bar order received:', data);
        fetchDashboardData();
      });

      socket.on('order-items-added', (data) => {
        console.log('New items added to bar order:', data);
        fetchDashboardData();
      });

      socket.on('order-item-status-updated', (data) => {
        console.log('Bar item status updated:', data);
        if (data.updatedBy !== user.id) {
          fetchDashboardData();
        }
      });

      return () => {
        socket.off('new-kitchen-order');
        socket.off('order-items-added');
        socket.off('order-item-status-updated');
      };
    }
  }, [socket, user.id, user.role]);

  // Update item status
  const updateItemStatus = async (orderId, itemId, status, bartenderNotes = '') => {
    try {
      setUpdateLoading(prev => ({ ...prev, [itemId]: true }));

      await orderApi.updateOrderItemStatus(orderId, itemId, {
        status,
        chef_notes: bartenderNotes
      });

      // Update local state immediately for better UX
      setDashboardData(prev => ({
        ...prev,
        orders: prev.orders.map(order => ({
          ...order,
          items: order.items.map(item =>
            item.id === itemId
              ? { ...item, status, bartenderNotes, acceptedAt: status === 'accepted' ? new Date() : item.acceptedAt }
              : item
          )
        }))
      }));

      setError('');
    } catch (err) {
      setError(err.message || 'Failed to update item status');
      fetchDashboardData();
    } finally {
      setUpdateLoading(prev => ({ ...prev, [itemId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (user?.role !== 'bartender' && user?.role !== 'admin' && user?.role !== 'manager') {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">Access denied. Only bartenders can access this page.</p>
        </div>
      </div>
    );
  }

  const { orders, stats } = dashboardData;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Bar Orders Dashboard</h1>
            <p className="mt-2 text-gray-600">
              Manage bar orders and drink preparation
            </p>
          </div>
          
          {/* Connection Status */}
          <div className="flex items-center space-x-4">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              <span className={`w-2 h-2 rounded-full mr-2 ${
                isConnected ? 'bg-green-400' : 'bg-red-400'
              }`}></span>
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Drinks</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalPendingItems || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Preparing Drinks</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalPreparingItems || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Ready Drinks</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalAcceptedItems || 0}</p>
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

      {/* Orders List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Active Bar Orders</h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage drink orders and preparation status
          </p>
        </div>
        
        <div className="divide-y divide-gray-200">
          {orders.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <div className="text-gray-400 text-6xl mb-4">🍹</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No active bar orders</h3>
              <p className="text-gray-600">New drink orders will appear here automatically</p>
            </div>
          ) : (
            orders.map((order) => (
              <BarOrderCard
                key={order.id}
                order={order}
                onUpdateItemStatus={updateItemStatus}
                updateLoading={updateLoading}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// Individual Bar Order Component
const BarOrderCard = ({ order, onUpdateItemStatus, updateLoading }) => {
  const [expandedItems, setExpandedItems] = useState({});
  const [bartenderNotes, setBartenderNotes] = useState({});

  const toggleItemExpansion = (itemId) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const handleNotesChange = (itemId, notes) => {
    setBartenderNotes(prev => ({
      ...prev,
      [itemId]: notes
    }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'accepted':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'preparing':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'ready':
      case 'ready_to_serve':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'accepted':
        return 'Accepted';
      case 'preparing':
        return 'Preparing';
      case 'ready':
      case 'ready_to_serve':
        return 'Ready to Serve';
      default:
        return status;
    }
  };

  return (
    <div className="p-6">
      {/* Order Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Order #{order.orderNumber}
          </h3>
          <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
            <span>Table {order.tableNumber}</span>
            <span>•</span>
            <span>{order.customerName}</span>
            <span>•</span>
            <span>Waiter: {order.waiterName}</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Placed: {new Date(order.placedAt).toLocaleString()}
          </p>
        </div>
        <div className="text-right">
          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
            Bar Order
          </span>
        </div>
      </div>

      {/* Special Instructions */}
      {order.specialInstructions && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm font-medium text-yellow-800">Order Instructions:</p>
          <p className="text-sm text-yellow-700 mt-1">{order.specialInstructions}</p>
        </div>
      )}

      {/* Order Items */}
      <div className="space-y-3">
        {order.items.map((item) => (
          <div key={item.id} className="border border-gray-200 rounded-lg">
            <div className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <span className="font-medium text-gray-900">
                      {item.quantity}x {item.item_name || item.name}
                    </span>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(item.status)}`}>
                      {getStatusText(item.status)}
                    </span>
                  </div>
                  
                  {item.specialInstructions && (
                    <p className="text-sm text-gray-600 mt-1">
                      <span className="font-medium">Drink notes:</span> {item.specialInstructions}
                    </p>
                  )}

                  {/* Bartender Notes Display */}
                  {item.bartenderNotes && (
                    <p className="text-sm text-blue-600 mt-1">
                      <span className="font-medium">Bartender notes:</span> {item.bartenderNotes}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => toggleItemExpansion(item.id)}
                  className="ml-4 p-1 text-gray-400 hover:text-gray-600"
                >
                  <svg 
                    className={`w-5 h-5 transform transition-transform ${expandedItems[item.id] ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              {/* Expanded Item Controls */}
              {expandedItems[item.id] && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  {/* Bartender Notes Input */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Add Bartender Notes (optional)
                    </label>
                    <textarea
                      value={bartenderNotes[item.id] || ''}
                      onChange={(e) => handleNotesChange(item.id, e.target.value)}
                      rows="2"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Add any notes about this drink..."
                    />
                  </div>

                  {/* Status Update Buttons */}
                  <div className="flex flex-wrap gap-2">
                    {item.status === 'pending' && (
                      <>
                        <button
                          onClick={() => onUpdateItemStatus(order.id, item.id, 'accepted', bartenderNotes[item.id] || '')}
                          disabled={updateLoading[item.id]}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                        >
                          {updateLoading[item.id] ? 'Updating...' : 'Accept'}
                        </button>
                        <button
                          onClick={() => onUpdateItemStatus(order.id, item.id, 'preparing', bartenderNotes[item.id] || '')}
                          disabled={updateLoading[item.id]}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50"
                        >
                          {updateLoading[item.id] ? 'Updating...' : 'Start Preparing'}
                        </button>
                      </>
                    )}
                    
                    {item.status === 'accepted' && (
                      <button
                        onClick={() => onUpdateItemStatus(order.id, item.id, 'preparing', bartenderNotes[item.id] || '')}
                        disabled={updateLoading[item.id]}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50"
                      >
                        {updateLoading[item.id] ? 'Updating...' : 'Start Preparing'}
                      </button>
                    )}
                    
                    {item.status === 'preparing' && (
                      <button
                        onClick={() => onUpdateItemStatus(order.id, item.id, 'ready', bartenderNotes[item.id] || '')}
                        disabled={updateLoading[item.id]}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                      >
                        {updateLoading[item.id] ? 'Updating...' : 'Ready to Serve'}
                      </button>
                    )}

                    {(item.status === 'ready' || item.status === 'ready_to_serve') && (
                      <span className="inline-flex items-center px-3 py-2 text-sm font-medium text-green-800 bg-green-100 rounded-md">
                        ✅ Ready for pickup
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BarOrdersPage;
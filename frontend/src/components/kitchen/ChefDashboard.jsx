import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { orderApi, kitchenApi } from '../../services/restaurantApi';
import LoadingSpinner from '../common/LoadingSpinner';

const ChefDashboard = () => {
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
      setError(err.message || 'Failed to fetch kitchen dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Set up socket listeners for real-time updates
    if (socket) {
      // Join kitchen room based on user role
      const kitchenRoom = user.role === 'bartender' ? 'bartender' : 'chef';
      socket.emit('join-kitchen-room', kitchenRoom);

      // Listen for new orders
      socket.on('new-kitchen-order', (data) => {
        console.log('New kitchen order received:', data);
        fetchDashboardData();
      });

      // Listen for order item additions
      socket.on('order-items-added', (data) => {
        console.log('New items added to order:', data);
        fetchDashboardData();
      });

      // Listen for item status updates from other chefs
      socket.on('order-item-status-updated', (data) => {
        console.log('Item status updated:', data);
        // Update local state without refetching if it's from another chef
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

  // Accept order
  const acceptOrder = async (orderId, estimatedTime = null, notes = '') => {
    try {
      setOrderActionLoading(prev => ({ ...prev, [orderId]: true }));

      // Find the order to get its restaurant ID
      const order = dashboardData.orders.find(o => o.id === orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      // Use the restaurant ID from the order
      const kitchenId = order.restaurant_id;

      await kitchenApi.acceptKitchenOrder(kitchenId, orderId, estimatedTime, notes);

      // Refresh dashboard data
      await fetchDashboardData();
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to accept order');
    } finally {
      setOrderActionLoading(prev => ({ ...prev, [orderId]: false }));
    }
  };

  // Reject order
  const rejectOrder = async (orderId, reason) => {
    try {
      setOrderActionLoading(prev => ({ ...prev, [orderId]: true }));

      // Find the order to get its restaurant ID
      const order = dashboardData.orders.find(o => o.id === orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      // Use the restaurant ID from the order
      const kitchenId = order.restaurant_id;

      await kitchenApi.rejectKitchenOrder(kitchenId, orderId, reason);

      // Refresh dashboard data
      await fetchDashboardData();
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to reject order');
    } finally {
      setOrderActionLoading(prev => ({ ...prev, [orderId]: false }));
    }
  };

  // Update item status
  const updateItemStatus = async (orderId, itemId, status, chefNotes = '') => {
    try {
      setUpdateLoading(prev => ({ ...prev, [itemId]: true }));

      await orderApi.updateOrderItemStatus(orderId, itemId, {
        status,
        chef_notes: chefNotes
      });

      // Update local state immediately for better UX
      setDashboardData(prev => ({
        ...prev,
        orders: prev.orders.map(order => ({
          ...order,
          items: order.items.map(item =>
            item.id === itemId
              ? { ...item, status, chefNotes, acceptedAt: status === 'accepted' ? new Date() : item.acceptedAt }
              : item
          )
        }))
      }));

      setError('');
    } catch (err) {
      setError(err.message || 'Failed to update item status');
      // Refresh data on error to ensure consistency
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

  const { orders, stats } = dashboardData;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Chef Dashboard</h1>
            <p className="mt-2 text-gray-600">
              Manage order items with real-time status updates
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
              <p className="text-sm font-medium text-gray-600">Pending Items</p>
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
              <p className="text-sm font-medium text-gray-600">Accepted Items</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalAcceptedItems || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Preparing Items</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalPreparingItems || 0}</p>
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
          <h2 className="text-xl font-semibold text-gray-900">Active Orders</h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage individual items in each order
          </p>
        </div>
        
        <div className="divide-y divide-gray-200">
          {orders.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <div className="text-gray-400 text-6xl mb-4">🍽️</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No active orders</h3>
              <p className="text-gray-600">New orders will appear here automatically</p>
            </div>
          ) : (
            orders.map((order) => (
              <OrderItemCard
                key={order.id}
                order={order}
                onUpdateItemStatus={updateItemStatus}
                onAcceptOrder={acceptOrder}
                onRejectOrder={rejectOrder}
                updateLoading={updateLoading}
                orderActionLoading={orderActionLoading}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// Individual Order with Items Component
const OrderItemCard = ({ order, onUpdateItemStatus, onAcceptOrder, onRejectOrder, updateLoading, orderActionLoading }) => {
  const [expandedItems, setExpandedItems] = useState({});
  const [chefNotes, setChefNotes] = useState({});
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [estimatedTime, setEstimatedTime] = useState('');
  const [acceptNotes, setAcceptNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  const toggleItemExpansion = (itemId) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const handleNotesChange = (itemId, notes) => {
    setChefNotes(prev => ({
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
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            order.orderType === 'bar' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
          }`}>
            {order.orderType.charAt(0).toUpperCase() + order.orderType.slice(1)}
          </span>
        </div>
      </div>

      {/* Order Actions - Show only if order is pending */}
      {order.status === 'pending' && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-800">Order Pending Kitchen Approval</p>
              <p className="text-xs text-yellow-600">Accept or reject this order to proceed</p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowAcceptModal(true)}
                disabled={orderActionLoading[order.id]}
                className="bg-green-600 text-white px-3 py-1 rounded text-sm font-medium hover:bg-green-700 disabled:opacity-50"
              >
                {orderActionLoading[order.id] ? 'Processing...' : 'Accept'}
              </button>
              <button
                onClick={() => setShowRejectModal(true)}
                disabled={orderActionLoading[order.id]}
                className="bg-red-600 text-white px-3 py-1 rounded text-sm font-medium hover:bg-red-700 disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Status Info */}
      {order.status && order.status !== 'pending' && (
        <div className={`mb-4 p-3 rounded-lg ${
          order.status === 'preparing' ? 'bg-blue-50 border border-blue-200' :
          order.status === 'cancelled' ? 'bg-red-50 border border-red-200' :
          order.status === 'ready' ? 'bg-green-50 border border-green-200' :
          'bg-gray-50 border border-gray-200'
        }`}>
          <p className={`text-sm font-medium ${
            order.status === 'preparing' ? 'text-blue-800' :
            order.status === 'cancelled' ? 'text-red-800' :
            order.status === 'ready' ? 'text-green-800' :
            'text-gray-800'
          }`}>
            Order {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </p>
          {order.special_instructions && (
            <p className={`text-xs mt-1 ${
              order.status === 'preparing' ? 'text-blue-600' :
              order.status === 'cancelled' ? 'text-red-600' :
              order.status === 'ready' ? 'text-green-600' :
              'text-gray-600'
            }`}>
              Notes: {order.special_instructions}
            </p>
          )}
        </div>
      )}

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
                      <span className="font-medium">Item notes:</span> {item.specialInstructions}
                    </p>
                  )}
                  
                  {item.preparationTime && (
                    <p className="text-sm text-gray-500 mt-1">
                      Est. prep time: {item.preparationTime} minutes
                    </p>
                  )}

                  {/* Chef Notes Display */}
                  {item.chefNotes && (
                    <p className="text-sm text-blue-600 mt-1">
                      <span className="font-medium">Chef notes:</span> {item.chefNotes}
                    </p>
                  )}

                  {/* Timestamps */}
                  <div className="flex items-center space-x-4 text-xs text-gray-500 mt-2">
                    {item.acceptedAt && (
                      <span>Accepted: {new Date(item.acceptedAt).toLocaleTimeString()}</span>
                    )}
                    {item.startedPreparingAt && (
                      <span>Started: {new Date(item.startedPreparingAt).toLocaleTimeString()}</span>
                    )}
                    {item.readyAt && (
                      <span>Ready: {new Date(item.readyAt).toLocaleTimeString()}</span>
                    )}
                  </div>
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
                  {/* Chef Notes Input */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Add Chef Notes (optional)
                    </label>
                    <textarea
                      value={chefNotes[item.id] || ''}
                      onChange={(e) => handleNotesChange(item.id, e.target.value)}
                      rows="2"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Add any notes about this item..."
                    />
                  </div>

                  {/* Status Update Buttons */}
                  <div className="flex flex-wrap gap-2">
                    {item.status === 'pending' && (
                      <>
                        <button
                          onClick={() => onUpdateItemStatus(order.id, item.id, 'accepted', chefNotes[item.id] || '')}
                          disabled={updateLoading[item.id]}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                        >
                          {updateLoading[item.id] ? 'Updating...' : 'Accept'}
                        </button>
                        <button
                          onClick={() => onUpdateItemStatus(order.id, item.id, 'preparing', chefNotes[item.id] || '')}
                          disabled={updateLoading[item.id]}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50"
                        >
                          {updateLoading[item.id] ? 'Updating...' : 'Start Preparing'}
                        </button>
                      </>
                    )}
                    
                    {item.status === 'accepted' && (
                      <button
                        onClick={() => onUpdateItemStatus(order.id, item.id, 'preparing', chefNotes[item.id] || '')}
                        disabled={updateLoading[item.id]}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50"
                      >
                        {updateLoading[item.id] ? 'Updating...' : 'Start Preparing'}
                      </button>
                    )}
                    
                    {item.status === 'preparing' && (
                      <button
                        onClick={() => onUpdateItemStatus(order.id, item.id, 'ready', chefNotes[item.id] || '')}
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

      {/* Accept Order Modal */}
      {showAcceptModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Accept Order #{order.orderNumber}</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estimated Preparation Time (minutes)
                </label>
                <input
                  type="number"
                  value={estimatedTime}
                  onChange={(e) => setEstimatedTime(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="e.g., 15"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (optional)
                </label>
                <textarea
                  value={acceptNotes}
                  onChange={(e) => setAcceptNotes(e.target.value)}
                  rows="3"
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="Any special notes for the waiter..."
                />
              </div>
            </div>

            <div className="mt-6 flex space-x-3">
              <button
                onClick={() => setShowAcceptModal(false)}
                className="flex-1 bg-gray-200 text-gray-900 px-4 py-2 rounded-md font-medium hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onAcceptOrder(order.id, estimatedTime ? parseInt(estimatedTime) : null, acceptNotes);
                  setShowAcceptModal(false);
                  setEstimatedTime('');
                  setAcceptNotes('');
                }}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md font-medium hover:bg-green-700"
              >
                Accept Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Order Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reject Order #{order.orderNumber}</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason for rejection *
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows="3"
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="Please explain why this order cannot be fulfilled..."
                  required
                />
              </div>
            </div>

            <div className="mt-6 flex space-x-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 bg-gray-200 text-gray-900 px-4 py-2 rounded-md font-medium hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (rejectReason.trim()) {
                    onRejectOrder(order.id, rejectReason);
                    setShowRejectModal(false);
                    setRejectReason('');
                  }
                }}
                disabled={!rejectReason.trim()}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md font-medium hover:bg-red-700 disabled:opacity-50"
              >
                Reject Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChefDashboard;
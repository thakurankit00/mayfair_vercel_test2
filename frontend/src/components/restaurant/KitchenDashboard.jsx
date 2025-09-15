import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { kitchenApi } from '../../services/restaurantApi';
import LoadingSpinner from '../common/LoadingSpinner';

const KitchenDashboard = () => {
  const { user } = useAuth();
  const { notifications, isConnected } = useSocket();
  const [kitchens, setKitchens] = useState([]);
  const [selectedKitchen, setSelectedKitchen] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    const fetchKitchens = async () => {
      try {
        const data = await kitchenApi.getKitchens();
        const userKitchens = data.kitchens.filter(kitchen => {
          // Filter kitchens based on user role
          if (user.role === 'chef') {
            return kitchen.restaurant_type === 'restaurant';
          } else if (user.role === 'bartender') {
            return kitchen.restaurant_type === 'bar';
          }
          return true; // managers and admins can see all
        });
        
        setKitchens(userKitchens);
        if (userKitchens.length > 0) {
          setSelectedKitchen(userKitchens[0].id);
        }
      } catch (err) {
        setError(err.message || 'Failed to fetch kitchens');
      } finally {
        setLoading(false);
      }
    };

    fetchKitchens();
  }, [user.role]);

  useEffect(() => {
    const fetchKitchenOrders = async () => {
      if (!selectedKitchen) return;
      
      try {
        const data = await kitchenApi.getKitchenOrders(selectedKitchen);

        // Sort orders by latest activity (updated_at or created_at)
        const sortedOrders = (data.orders || []).sort((a, b) => {
          const aTime = new Date(a.updated_at || a.created_at);
          const bTime = new Date(b.updated_at || b.created_at);
          return bTime - aTime; // Most recent first
        });

        setOrders(sortedOrders);
      } catch (err) {
        setError(err.message || 'Failed to fetch kitchen orders');
      }
    };

    fetchKitchenOrders();
    
    // Refresh orders when new order notifications arrive
    const newOrderNotifications = notifications.filter(n => n.type === 'new-order');
    if (newOrderNotifications.length > 0) {
      fetchKitchenOrders();
    }
    
  }, [selectedKitchen, notifications]);

  const handleAcceptOrder = async (orderId, estimatedTime = null, notes = null) => {
    try {
      setActionLoading(orderId);
      await kitchenApi.acceptKitchenOrder(selectedKitchen, orderId, estimatedTime, notes);
      
      // Refresh orders
      const data = await kitchenApi.getKitchenOrders(selectedKitchen);

      // Sort orders by latest activity (updated_at or created_at)
      const sortedOrders = (data.orders || []).sort((a, b) => {
        const aTime = new Date(a.updated_at || a.created_at);
        const bTime = new Date(b.updated_at || b.created_at);
        return bTime - aTime; // Most recent first
      });

      setOrders(sortedOrders);
    } catch (err) {
      setError(err.message || 'Failed to accept order');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectOrder = async (orderId, reason) => {
    try {
      setActionLoading(orderId);
      await kitchenApi.rejectKitchenOrder(selectedKitchen, orderId, reason);
      
      // Refresh orders
      const data = await kitchenApi.getKitchenOrders(selectedKitchen);

      // Sort orders by latest activity (updated_at or created_at)
      const sortedOrders = (data.orders || []).sort((a, b) => {
        const aTime = new Date(a.updated_at || a.created_at);
        const bTime = new Date(b.updated_at || b.created_at);
        return bTime - aTime; // Most recent first
      });

      setOrders(sortedOrders);
    } catch (err) {
      setError(err.message || 'Failed to reject order');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (kitchens.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-lg">🍳</div>
        <p className="text-gray-600 mt-2">No kitchens assigned to you</p>
        <p className="text-sm text-gray-500 mt-1">
          Contact your manager to get assigned to a kitchen
        </p>
      </div>
    );
  }

  const selectedKitchenData = kitchens.find(k => k.id === selectedKitchen);
  const pendingOrders = orders.filter(order => order.kitchen_status === 'pending');
  const acceptedOrders = orders.filter(order => order.kitchen_status === 'accepted');

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Kitchen Dashboard</h1>
            <p className="mt-2 text-gray-600">
              Manage incoming orders for your kitchen
            </p>
          </div>
          
          {/* Kitchen Selector */}
          {kitchens.length > 1 && (
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">Kitchen:</label>
              <select
                value={selectedKitchen}
                onChange={(e) => setSelectedKitchen(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2"
              >
                {kitchens.map((kitchen) => (
                  <option key={kitchen.id} value={kitchen.id}>
                    {kitchen.kitchen_name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Kitchen Info */}
      {selectedKitchenData && (
        <div className="mb-6 bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {selectedKitchenData.kitchen_name}
              </h2>
              <p className="text-gray-600">{selectedKitchenData.name}</p>
              <div className="mt-2 flex items-center space-x-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  <span className={`w-2 h-2 rounded-full mr-1.5 ${
                    isConnected ? 'bg-green-400' : 'bg-red-400'
                  }`}></span>
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{pendingOrders.length}</div>
                <div className="text-sm text-gray-500">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{acceptedOrders.length}</div>
                <div className="text-sm text-gray-500">In Progress</div>
              </div>
            </div>
          </div>
        </div>
      )}

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

      {/* Orders Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Orders */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <span className="w-3 h-3 bg-yellow-400 rounded-full mr-2"></span>
              Pending Orders ({pendingOrders.length})
            </h3>
          </div>
          <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
            {pendingOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onAccept={handleAcceptOrder}
                onReject={handleRejectOrder}
                actionLoading={actionLoading === order.id}
                isPending={true}
              />
            ))}
            {pendingOrders.length === 0 && (
              <div className="p-6 text-center text-gray-500">
                No pending orders
              </div>
            )}
          </div>
        </div>

        {/* Accepted/In Progress Orders */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <span className="w-3 h-3 bg-blue-400 rounded-full mr-2"></span>
              In Progress ({acceptedOrders.length})
            </h3>
          </div>
          <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
            {acceptedOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                isPending={false}
              />
            ))}
            {acceptedOrders.length === 0 && (
              <div className="p-6 text-center text-gray-500">
                No orders in progress
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Individual Order Card Component
const OrderCard = ({ order, onAccept, onReject, actionLoading, isPending }) => {
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [estimatedTime, setEstimatedTime] = useState('');
  const [notes, setNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  const handleAcceptSubmit = (e) => {
    e.preventDefault();
    const time = estimatedTime ? parseInt(estimatedTime) : null;
    onAccept(order.id, time, notes || null);
    setShowAcceptModal(false);
    setEstimatedTime('');
    setNotes('');
  };

  const handleRejectSubmit = (e) => {
    e.preventDefault();
    if (!rejectReason.trim()) return;
    onReject(order.id, rejectReason);
    setShowRejectModal(false);
    setRejectReason('');
  };

  return (
    <>
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h4 className="font-semibold text-gray-900">
              Order #{order.order_number}
            </h4>
            <p className="text-sm text-gray-600">
              Table {order.table_number} • {order.first_name} {order.last_name}
            </p>
            <p className="text-xs text-gray-500">
              Placed: {new Date(order.placed_at).toLocaleTimeString()}
            </p>
          </div>
          <div className="text-right">
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
              order.order_type === 'bar' ? 'bg-purple-100 text-purple-800' :
              'bg-green-100 text-green-800'
            }`}>
              {order.order_type}
            </span>
            <div className="text-sm font-medium text-gray-900 mt-1">
              ₹{parseFloat(order.total_amount + order.tax_amount).toFixed(2)}
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="mb-3">
          <div className="space-y-1">
            {order.items?.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span>{item.quantity}x {item.item_name}</span>
                <span>₹{parseFloat(item.total_price).toFixed(2)}</span>
              </div>
            ))}
          </div>
          {order.special_instructions && (
            <div className="mt-2 p-2 bg-yellow-50 rounded text-sm">
              <span className="font-medium text-yellow-800">Special Instructions:</span>
              <p className="text-yellow-700">{order.special_instructions}</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {isPending && (
          <div className="flex space-x-2">
            <button
              onClick={() => setShowAcceptModal(true)}
              disabled={actionLoading}
              className="flex-1 bg-green-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50"
            >
              {actionLoading ? 'Processing...' : 'Accept'}
            </button>
            <button
              onClick={() => setShowRejectModal(true)}
              disabled={actionLoading}
              className="flex-1 bg-red-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-50"
            >
              Reject
            </button>
          </div>
        )}

        {/* Show kitchen status for accepted orders */}
        {!isPending && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              Status: <span className="font-medium text-blue-600">In Progress</span>
            </span>
            {order.estimated_preparation_time && (
              <span className="text-sm text-gray-600">
                Est: {order.estimated_preparation_time} mins
              </span>
            )}
          </div>
        )}
      </div>

      {/* Accept Modal */}
      {showAcceptModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Accept Order #{order.order_number}
            </h3>
            <form onSubmit={handleAcceptSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Estimated Preparation Time (minutes)
                  </label>
                  <input
                    type="number"
                    value={estimatedTime}
                    onChange={(e) => setEstimatedTime(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., 15"
                    min="1"
                    max="120"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Notes (optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows="2"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Any special notes for this order..."
                  />
                </div>
              </div>
              <div className="mt-6 flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAcceptModal(false)}
                  className="flex-1 bg-gray-200 text-gray-900 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700"
                >
                  Accept Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Reject Order #{order.order_number}
            </h3>
            <form onSubmit={handleRejectSubmit}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for rejection *
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows="3"
                  required
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                  placeholder="Please specify why you're rejecting this order..."
                />
              </div>
              <div className="mt-6 flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="flex-1 bg-gray-200 text-gray-900 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!rejectReason.trim()}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                >
                  Reject Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default KitchenDashboard;

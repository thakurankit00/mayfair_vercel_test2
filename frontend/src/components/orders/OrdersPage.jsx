import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { orderApi } from '../../services/restaurantApi';
import LoadingSpinner from '../common/LoadingSpinner';

const OrdersPage = () => {
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('today');
  const [orderTypeFilter, setOrderTypeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Custom date range
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');

  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      // Build filter parameters
      const filters = {};
      
      if (statusFilter !== 'all') {
        filters.status = statusFilter;
      }
      
      if (orderTypeFilter !== 'all') {
        filters.order_type = orderTypeFilter;
      }
      
      // Handle date filtering
      const today = new Date();
      const formatDate = (date) => date.toISOString().split('T')[0];
      
      switch (dateFilter) {
        case 'today':
          filters.date_from = formatDate(today);
          filters.date_to = formatDate(today);
          break;
        case 'yesterday':
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          filters.date_from = formatDate(yesterday);
          filters.date_to = formatDate(yesterday);
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
      
      const data = await orderApi.getOrders(filters);
      setOrders(data.orders || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, dateFilter, orderTypeFilter, customDateFrom, customDateTo]);

  // Socket.io real-time updates
  useEffect(() => {
    if (socket && isConnected) {
      // Listen for order updates
      socket.on('new-kitchen-order', () => {
        fetchOrders();
      });

      socket.on('order-status-updated', () => {
        fetchOrders();
      });

      socket.on('order-item-status-updated', () => {
        fetchOrders();
      });

      socket.on('order-items-added', () => {
        fetchOrders();
      });

      return () => {
        socket.off('new-kitchen-order');
        socket.off('order-status-updated');
        socket.off('order-item-status-updated');
        socket.off('order-items-added');
      };
    }
  }, [socket, isConnected]);

  // Filter orders by search term
  const filteredOrders = orders.filter(order => {
    if (!searchTerm.trim()) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      order.order_number.toLowerCase().includes(searchLower) ||
      order.first_name?.toLowerCase().includes(searchLower) ||
      order.last_name?.toLowerCase().includes(searchLower) ||
      order.table_number?.toString().includes(searchLower)
    );
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'preparing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ready':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'served':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getOrderTypeColor = (type) => {
    switch (type) {
      case 'restaurant':
        return 'bg-green-100 text-green-800';
      case 'bar':
        return 'bg-purple-100 text-purple-800';
      case 'room_service':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Orders Management</h1>
            <p className="mt-2 text-gray-600">
              View and manage all orders with real-time updates
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
              {isConnected ? 'Live Updates' : 'Disconnected'}
            </span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
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
              <option value="preparing">Preparing</option>
              <option value="ready">Ready</option>
              <option value="served">Served</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Order Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Order Type
            </label>
            <select
              value={orderTypeFilter}
              onChange={(e) => setOrderTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Types</option>
              <option value="restaurant">Restaurant</option>
              <option value="bar">Bar</option>
              <option value="room_service">Room Service</option>
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
              <option value="yesterday">Yesterday</option>
              <option value="week">Last 7 days</option>
              <option value="month">Last 30 days</option>
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
              placeholder="Order number, customer name..."
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-semibold text-gray-900">{filteredOrders.length}</p>
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
                {filteredOrders.filter(o => o.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Preparing</p>
              <p className="text-2xl font-semibold text-gray-900">
                {filteredOrders.filter(o => o.status === 'preparing').length}
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
              <p className="text-sm font-medium text-gray-600">Ready</p>
              <p className="text-2xl font-semibold text-gray-900">
                {filteredOrders.filter(o => o.status === 'ready').length}
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

      {/* Orders List */}
      {!loading && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Orders ({filteredOrders.length})
            </h2>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <div className="text-gray-400 text-6xl mb-4">🍽️</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
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
                      Order Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Table/Service
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            #{order.order_number}
                          </div>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getOrderTypeColor(order.order_type)}`}>
                              {order.order_type.replace('_', ' ')}
                            </span>
                            <span className="text-xs text-gray-500">
                              {order.items?.length || 0} items
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {order.first_name} {order.last_name}
                        </div>
                        {order.waiter_first_name && (
                          <div className="text-xs text-gray-500">
                            Waiter: {order.waiter_first_name} {order.waiter_last_name}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {order.table_number ? `Table ${order.table_number}` : 'Room Service'}
                        </div>
                        {order.table_location && (
                          <div className="text-xs text-gray-500">
                            {order.table_location.replace('_', ' ')}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(order.status)}`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          ₹{parseFloat(order.total_amount).toFixed(2)}
                        </div>
                        {order.tax_amount > 0 && (
                          <div className="text-xs text-gray-500">
                            +₹{parseFloat(order.tax_amount).toFixed(2)} tax
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(order.placed_at || order.created_at).toLocaleTimeString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(order.placed_at || order.created_at).toLocaleDateString()}
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
    </div>
  );
};

export default OrdersPage;

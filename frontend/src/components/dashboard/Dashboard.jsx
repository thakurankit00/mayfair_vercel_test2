import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { dashboardApi } from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,

  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
 
} from 'recharts';

// Time Filter Component
const TimeFilter = ({
  currentFilter,
  onFilterChange,
  customDateRange,
  onCustomDateChange,
  showCustomDatePicker,
  loading
}) => {
  const filterOptions = [
    { value: 'hourly', label: 'Hourly', description: 'Last 24 hours by hour' },
    { value: '1day', label: '1 Day', description: 'Last 24 hours' },
    { value: '10days', label: '10 Days', description: 'Last 10 days' },
    { value: 'custom', label: 'Custom Dates', description: 'Select date range' }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 relative">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Filter by Time Period</h3>
          <p className="text-sm text-gray-500 mt-1">
            {filterOptions.find(opt => opt.value === currentFilter)?.description || 'Select time range'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {filterOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onFilterChange(option.value)}
              disabled={loading}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                currentFilter === option.value
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Date Picker */}
      {showCustomDatePicker && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={customDateRange.startDate}
                onChange={(e) => onCustomDateChange('startDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={customDateRange.endDate}
                onChange={(e) => onCustomDateChange('endDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              />
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm text-gray-600">Loading data...</span>
          </div>
        </div>
      )}
    </div>
  );
};

const Dashboard = () => {
  const { user, hasAnyRole } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeFilter, setTimeFilter] = useState('1day');
  const [customDateRange, setCustomDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        setLoading(true);
        let dateRange = timeFilter;

        // Handle custom date range
        if (timeFilter === 'custom' && customDateRange.startDate && customDateRange.endDate) {
          // Validate that end date is not before start date
          if (new Date(customDateRange.endDate) >= new Date(customDateRange.startDate)) {
            dateRange = `${customDateRange.startDate}_${customDateRange.endDate}`;
          } else {
            // If invalid date range, fall back to 1day
            dateRange = '1day';
          }
        }

        const data = await dashboardApi.getMetrics(dateRange);
        setMetrics(data);
        setError(null);
      } catch (err) {
        setError('Failed to load dashboard metrics');
        console.error('Dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadMetrics();
  }, [timeFilter, customDateRange]);

  // Handle filter change
  const handleFilterChange = (newFilter) => {
    setTimeFilter(newFilter);
    if (newFilter === 'custom') {
      setShowCustomDatePicker(true);
    } else {
      setShowCustomDatePicker(false);
      setCustomDateRange({ startDate: '', endDate: '' });
    }
  };

  // Handle custom date range change
  const handleCustomDateChange = (field, value) => {
    setCustomDateRange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <div className="p-6">
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderCustomerDashboard = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Welcome back, {user.firstName}!
        </h2>
        <p className="text-gray-600">
          Thank you for choosing Mayfair Hotel. Here's your personalized dashboard.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-blue-500 rounded-md flex items-center justify-center">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">My Bookings</div>
              <div className="text-2xl font-semibold text-gray-900">2</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-green-500 rounded-md flex items-center justify-center">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">Loyalty Points</div>
              <div className="text-2xl font-semibold text-gray-900">1,250</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-purple-500 rounded-md flex items-center justify-center">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">Available Offers</div>
              <div className="text-2xl font-semibold text-gray-900">3</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

const renderStaffDashboard = () => {
  // Transform daily metrics data for mini charts
  const getDailyChartData = (dataType = 'revenue') => {
    if (!metrics?.dailyMetrics || metrics.dailyMetrics.length === 0) {
      // Fallback sample data
      return [
        { name: 'Mon', value: 400 },
        { name: 'Tue', value: 300 },
        { name: 'Wed', value: 600 },
        { name: 'Thu', value: 800 },
        { name: 'Fri', value: 700 },
        { name: 'Sat', value: 900 },
        { name: 'Sun', value: 500 }
      ];
    }

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return metrics.dailyMetrics.map(item => {
      let name;

      if (timeFilter === 'hourly' && item.hour !== null && item.hour !== undefined) {
        // For hourly data, show hour format (e.g., "14:00")
        name = `${item.hour.toString().padStart(2, '0')}:00`;
      } else {
        // For daily data, show day names
        const dayOfWeek = parseInt(item.day_of_week || 0);
        name = dayNames[dayOfWeek] || 'Unknown';
      }

      let value = 0;
      switch (dataType) {
        case 'revenue':
          value = parseFloat(item.revenue || 0);
          break;
        case 'bookings':
          value = parseInt(item.bookings || 0);
          break;
        case 'orders':
          value = parseInt(item.orders || 0);
          break;
        case 'occupancy':
          // Calculate occupancy rate based on bookings (simplified)
          value = Math.min(100, parseInt(item.bookings || 0) * 10); // Mock calculation
          break;
        default:
          value = parseFloat(item.revenue || 0);
      }

      return {
        name: name,
        value: Math.round(value)
      };
    });
  };

  // Get specific chart data for each KPI card
  const revenueChartData = getDailyChartData('revenue');
  const bookingsChartData = getDailyChartData('bookings');
  const ordersChartData = getDailyChartData('orders');
  const occupancyChartData = getDailyChartData('occupancy');

  // Transform real category revenue data from metrics
  const getCategoryRevenueData = () => {
    if (!metrics?.categoryRevenue || metrics.categoryRevenue.length === 0) {
      return [
        { name: 'No data available', value: 0, fill: '#6B7280' }
      ];
    }

    // Color mapping for different category types
    const categoryColorMap = {
      'food': '#3B82F6',
      'main course': '#3B82F6',
      'appetizers': '#10B981',
      'starters': '#10B981',
      'beverages': '#F59E0B',
      'drinks': '#F59E0B',
      'alcoholic': '#EF4444',
      'alcohol': '#EF4444',
      'desserts': '#8B5CF6',
      'dessert': '#8B5CF6',
      'snacks': '#06B6D4',
      'breakfast': '#F97316',
      'lunch': '#84CC16',
      'dinner': '#EC4899',
      'bar': '#EF4444',
      'restaurant': '#3B82F6'
    };

    // Get color for category based on name
    const getCategoryColor = (categoryName) => {
      const name = categoryName.toLowerCase();
      for (const [key, color] of Object.entries(categoryColorMap)) {
        if (name.includes(key)) {
          return color;
        }
      }
      return '#6B7280'; // Default gray color
    };

    return metrics.categoryRevenue
      .map(item => ({
        name: item.category_name || 'Unknown Category',
        value: Math.round(parseFloat(item.total_revenue || 0)),
        fill: getCategoryColor(item.category_name || ''),
        orderCount: parseInt(item.order_count || 0),
        quantity: parseInt(item.total_quantity || 0)
      }))
      .filter(item => item.value > 0) // Only include categories with actual revenue
      .slice(0, 8); // Limit to top 8 categories for better visualization
  };

  const categories = getCategoryRevenueData();

  const payments = [
    { name: 'Cash', value: 52000, fill: '#EF4444' },
    { name: 'UPI', value: 28000, fill: '#3B82F6' },
    { name: 'Credit', value: 18000, fill: '#10B981' },
    { name: 'Bank', value: 2000, fill: '#F59E0B' }
  ];

  // Transform real order type data from metrics
  const getOrderTypesData = () => {
    if (!metrics?.orders?.byType) {
      return [
        { name: 'Dine-In', value: 0, fill: '#06B6D4' },
        { name: 'Takeaway', value: 0, fill: '#8B5CF6' },
        { name: 'Room Service', value: 0, fill: '#EC4899' },
        { name: 'Delivery', value: 0, fill: '#F59E0B' }
      ];
    }

    const colorMap = {
      'DINE_IN': '#06B6D4',
      'dine_in': '#06B6D4',
      'RESTAURANT': '#06B6D4',
      'TAKEAWAY': '#8B5CF6',
      'takeaway': '#8B5CF6',
      'ROOM_SERVICE': '#EC4899',
      'room_service': '#EC4899',
      'DELIVERY': '#F59E0B',
      'delivery': '#F59E0B',
      'BAR': '#10B981'
    };

    const nameMap = {
      'DINE_IN': 'Dine-In',
      'dine_in': 'Dine-In',
     
      'TAKEAWAY': 'Takeaway',
      'takeaway': 'Takeaway',
      'ROOM_SERVICE': 'Room Service',
      'room_service': 'Room Service',
      'DELIVERY': 'Delivery',
      'delivery': 'Delivery',
      'bar': 'Bar Orders'
    };

    return metrics.orders.byType.map(item => ({
      name: nameMap[item.order_type] || item.order_type,
      value: parseInt(item.count || 0),
      fill: colorMap[item.order_type] || '#6B7280'
    }));
  };

  const orderTypes = getOrderTypesData();

  // Transform real top selling items data from metrics
  const getTopSellingItemsData = () => {
    if (!metrics?.topSellingItems || metrics.topSellingItems.length === 0) {
      return [
        { name: 'No data available', qty: 0, revenue: 0, orderCount: 0 }
      ];
    }

    return metrics.topSellingItems
      .map(item => ({
        name: item.name || 'Unknown Item',
        qty: parseInt(item.total_quantity || 0),
        revenue: Math.round(parseFloat(item.total_revenue || 0)),
        orderCount: parseInt(item.order_count || 0)
      }))
      .filter(item => item.qty > 0 && item.revenue > 0) // Only include items with actual sales
      .slice(0, 5); // Limit to top 5 items
  };

  const topItems = getTopSellingItemsData();

  return (
  <div className="space-y-8">
    {/* Greeting */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
        <h2 className="text-2xl md:text-3xl font-bold">
          Good morning, {user.firstName}!
        </h2>
        <p className="mt-1 opacity-90">
          Here’s your {user.role} dashboard for today.
        </p>
      </div>

      {/* Time Period Filter */}
      <TimeFilter
        currentFilter={timeFilter}
        onFilterChange={handleFilterChange}
        customDateRange={customDateRange}
        onCustomDateChange={handleCustomDateChange}
        showCustomDatePicker={showCustomDatePicker}
        loading={loading}
      />

      {/* KPI Cards with Mini Charts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {hasAnyRole(['manager', 'admin', 'receptionist']) && (
          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg hover:-translate-y-0.5 transform transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 bg-green-100 text-green-600 flex items-center justify-center rounded-lg">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
            <div className="mb-3">
              <p className="text-sm text-gray-500">
                {timeFilter === '1day' ? "Today's Revenue" :
                 timeFilter === 'hourly' ? "Last 24 Hours Revenue" :
                 timeFilter === '10days' ? "Last 10 Days Revenue" :
                 timeFilter === 'custom' ? "Custom Period Revenue" : "Revenue"}
              </p>
              <p className="text-2xl font-bold text-gray-900">
                ₹{(timeFilter === '1day' ? metrics.revenue?.today : metrics.revenue?.filtered)?.toLocaleString() || '0'}
              </p>
            </div>
            <div className="h-16 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueChartData}>
                  <Area type="monotone" dataKey="value" stroke="#10B981" fill="#10B981" fillOpacity={0.2} strokeWidth={2} />
                  <Tooltip 
                    formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']}
                    labelFormatter={(label) => `${timeFilter === 'hourly' ? 'Hour' : 'Day'}: ${label}`}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

         {/* Today’s Bookings */}
  {hasAnyRole(['manager', 'admin', 'receptionist']) && (
    <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg hover:-translate-y-0.5 transform transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className="h-12 w-12 bg-blue-100 text-blue-600 flex items-center justify-center rounded-lg">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      </div>
      <div className="mb-3">
        <p className="text-sm text-gray-500">
          {timeFilter === '1day' ? "Today's Bookings" :
           timeFilter === 'hourly' ? "Last 24 Hours Bookings" :
           timeFilter === '10days' ? "Last 10 Days Bookings" :
           timeFilter === 'custom' ? "Custom Period Bookings" : "Bookings"}
        </p>
        <p className="text-2xl font-bold text-gray-900">
          {timeFilter === '1day' ? (metrics.bookings?.today || '0') : (metrics.bookings?.filtered || '0')}
        </p>
      </div>
      <div className="h-16 mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={bookingsChartData}>
            <Area type="monotone" dataKey="value" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.2} strokeWidth={2} />
            <Tooltip 
              formatter={(value) => [value, 'Bookings']}
              labelFormatter={(label) => `${timeFilter === 'hourly' ? 'Hour' : 'Day'}: ${label}`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )}


      {hasAnyRole(['manager', 'admin', 'waiter', 'chef', 'bartender']) && (
        <div className="bg-white rounded-xl shadow-md p-5 hover:shadow-lg transition">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 bg-orange-100 text-orange-600 flex items-center justify-center rounded-lg">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">
                {timeFilter === '1day' ? "Today's Orders" :
                 timeFilter === 'hourly' ? "Last 24 Hours Orders" :
                 timeFilter === '10days' ? "Last 10 Days Orders" :
                 timeFilter === 'custom' ? "Custom Period Orders" : "Orders"}
              </p>
              <p className="text-xl font-semibold text-gray-800">
                {timeFilter === '1day' ? (metrics.orders?.today || '0') : (metrics.orders?.filtered || '0')}
              </p>
            </div>
          </div>
        </div>
      )}

      {hasAnyRole(['chef', 'bartender','waiter']) && (
        <div className="bg-white rounded-xl shadow-md p-5 hover:shadow-lg transition">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 bg-red-100 text-red-600 flex items-center justify-center rounded-lg">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">Pending Orders</p>
              <p className="text-xl font-semibold text-gray-800">{metrics.orders.pending}</p>
            </div>
          </div>
        </div>
      )}

      {hasAnyRole(['manager', 'admin', 'receptionist']) && (
        <div className="bg-white rounded-xl shadow-md p-5 hover:shadow-lg transition">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 bg-green-100 text-green-600 flex items-center justify-center rounded-lg">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">Available Rooms</p>
              <p className="text-xl font-semibold text-gray-800">
                {metrics.rooms?.available || 0}/{metrics.rooms?.total || 0}
              </p>
            </div>
          </div>
        </div>
      )}

     {/* Occupancy Rate */}
  {hasAnyRole(['manager', 'admin']) && (
    <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg hover:-translate-y-0.5 transform transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className="h-12 w-12 bg-purple-100 text-purple-600 flex items-center justify-center rounded-lg">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6" />
          </svg>
        </div>
      </div>
      <div className="mb-3">
        <p className="text-sm text-gray-500">Occupancy Rate</p>
        <p className="text-2xl font-bold text-gray-900">
          {metrics.bookings?.occupancyRate || 0}%
        </p>
      </div>
      <div className="h-16 mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={occupancyChartData}>
            <Area type="monotone" dataKey="value" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.2} strokeWidth={2} />
            <Tooltip 
              formatter={(value) => [`${value}%`, 'Occupancy Rate']}
              labelFormatter={(label) => `${timeFilter === 'hourly' ? 'Hour' : 'Day'}: ${label}`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )}
</div>

   



      {/* Chart Sections */}
      {hasAnyRole(['manager', 'admin']) && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Category Summary (Bar Chart) */}
          <div className="bg-white rounded-xl shadow-md p-5 transition-all duration-300">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Revenue </h3>
            {categories.length > 0 && categories[0].value > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={categories.filter(cat => cat.value > 0)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip formatter={(value, _name, props) => {
                      const data = props.payload;
                      return [
                        `₹${value.toLocaleString()}`,
                        'Revenue',
                        `${data.quantity || 0} items sold`,
                        `${data.orderCount || 0} orders`
                      ];
                    }} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {categories.filter(cat => cat.value > 0).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {categories.filter(cat => cat.value > 0).map((category, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: category.fill }}></div>
                        <span className="text-gray-700">{category.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-medium text-gray-900">₹{category.value.toLocaleString()}</span>
                        <p className="text-xs text-gray-500">{category.quantity || 0} items</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">No Category Data Available</h4>
                <p className="text-gray-500">No menu category sales data found for the last 30 days.</p>
              </div>
            )}
          </div>

          {/* Payment Summary (Pie Chart) */}
          <div className="bg-white rounded-xl shadow-md p-5 transition-all duration-300">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Summary</h3>
            <div className="flex flex-col items-center">
              <div className="w-full mb-6">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={payments}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {payments.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, 'Amount']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2 w-full">
                <div className="text-center mb-4">
                  <p className="text-lg font-bold text-gray-900">
                    ₹{payments.reduce((sum, p) => sum + p.value, 0).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500">Total Payment</p>
                </div>
                {payments.map((payment, index) => (
                  <div key={index} className="flex items-center justify-between text-sm ">
                    <div className='flex items-center justify-between '>
                      <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: payment.fill }}></div>
                      <span className="text-gray-700 mr-2">{payment.name}</span>
                    </div>
                    <span className="font-medium">₹{payment.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Type Summary (Radial Chart) */}
          <div className="bg-white rounded-xl shadow-md p-5 transition-all duration-300">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Types</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={orderTypes.filter(type => type.value > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {orderTypes.filter(type => type.value > 0).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [value, 'Orders']} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              <div className="text-center mb-4">
                  <p className="text-lg font-bold text-gray-900">
                    {orderTypes.reduce((count, p) => count + p.value, 0).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500">Total orders</p>
                </div>
              {orderTypes.filter(type => type.value > 0).map((type, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: type.fill }}></div>
                    <span className="text-gray-700">{type.name}</span>
                  </div>
                  <span className="font-medium text-gray-900">{type.value} orders</span>
                </div>
              ))}
              {orderTypes.every(type => type.value === 0) && (
                <div className="text-center text-gray-500 text-sm py-4">
                  No order data available for the selected period
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Top Selling Items */}
      {hasAnyRole(['manager', 'admin']) && (
        <div className="bg-white rounded-xl shadow-md p-5 transition-all duration-300">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Top Selling Items </h3>
          {topItems.length > 0 && topItems[0].revenue > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Bar Chart */}
              <div>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topItems.filter(item => item.revenue > 0)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip formatter={(value, name) => {
                      if (name === 'revenue') return [`₹${value.toLocaleString()}`, 'Revenue'];
                      return [value, name];
                    }} />
                    <Bar dataKey="revenue" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* List */}
              <div className="space-y-4">
                {topItems.filter(item => item.revenue > 0).map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-sm">{item.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.name}</p>
                        <p className="text-xs text-gray-500">{item.qty} sold • {item.orderCount || 0} orders</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">₹{item.revenue.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">#{index + 1}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">No Sales Data Available</h4>
              <p className="text-gray-500">No menu items have been sold in the last 30 days.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};


  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </p>
      </div>

      {user?.role === 'customer' ? renderCustomerDashboard() : renderStaffDashboard()}
    </div>
  );
};

export default Dashboard;

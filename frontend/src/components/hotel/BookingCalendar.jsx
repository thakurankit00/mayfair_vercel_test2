import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { bookingApi } from '../../services/hotelApi';
import LoadingSpinner from '../common/LoadingSpinner';
import DatePicker from '../common/DatePicker';
import CalendarGrid from './CalendarGrid';
import BookingTooltip from './BookingTooltip';

const BookingCalendar = () => {
  const { user } = useAuth();
  const [calendarData, setCalendarData] = useState({
    bookings: [],
    rooms: [],
    room_types: [],
    date_range: {},
    summary: {
      total_bookings: 0,
      total_rooms: 0,
      occupancy_rate: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Calendar navigation state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState('month'); // month, quarter, year
  const [selectedRoomType, setSelectedRoomType] = useState('');
  
  // Tooltip state
  const [hoveredBooking, setHoveredBooking] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // Calculate date range based on current view
  const getDateRange = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    let startDate, endDate;
    
    switch (viewType) {
      case 'month':
        startDate = new Date(year, month, 1);
        endDate = new Date(year, month + 1, 0);
        break;
      case 'quarter':
        const quarterStart = Math.floor(month / 3) * 3;
        startDate = new Date(year, quarterStart, 1);
        endDate = new Date(year, quarterStart + 3, 0);
        break;
      case 'year':
        startDate = new Date(year, 0, 1);
        endDate = new Date(year, 11, 31);
        break;
      default:
        startDate = new Date(year, month, 1);
        endDate = new Date(year, month + 1, 0);
    }
    
    return {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0]
    };
  };

  // Format date range for display
  const formatDateRangeDisplay = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    switch (viewType) {
      case 'month':
        return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      case 'quarter':
        const quarterNum = Math.floor(month / 3) + 1;
        return `Q${quarterNum} ${year}`;
      case 'year':
        return year.toString();
      default:
        return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
  };

  // Navigation functions
  const navigateCalendar = (direction) => {
    const newDate = new Date(currentDate);
    
    switch (viewType) {
      case 'month':
        newDate.setMonth(newDate.getMonth() + direction);
        break;
      case 'quarter':
        newDate.setMonth(newDate.getMonth() + (direction * 3));
        break;
      case 'year':
        newDate.setFullYear(newDate.getFullYear() + direction);
        break;
      default:
        newDate.setMonth(newDate.getMonth() + direction);
        break;
    }
    
    setCurrentDate(newDate);
  };

  // Load calendar data
  const loadCalendarData = async () => {
    try {
      setLoading(true);
      const dateRange = getDateRange();
      const data = await bookingApi.getCalendarData(
        dateRange.start,
        dateRange.end,
        selectedRoomType || null
      );
      // Ensure we have the right data structure
      const calendarInfo = data?.data || data;
      setCalendarData({
        bookings: calendarInfo?.bookings || [],
        rooms: calendarInfo?.rooms || [],
        room_types: calendarInfo?.room_types || [],
        date_range: calendarInfo?.date_range || {},
        summary: calendarInfo?.summary || {
          total_bookings: 0,
          total_rooms: 0,
          occupancy_rate: 0
        }
      });
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load calendar data');
      console.error('Calendar load error:', err);
      // Set empty data on error to prevent undefined errors
      setCalendarData({
        bookings: [],
        rooms: [],
        room_types: [],
        date_range: {},
        summary: {
          total_bookings: 0,
          total_rooms: 0,
          occupancy_rate: 0
        }
      });
    } finally {
      setLoading(false);
    }
  };

  // Load data when dependencies change
  useEffect(() => {
    loadCalendarData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate, viewType, selectedRoomType]);

  // Handle booking hover
  const handleBookingHover = (booking, event) => {
    if (booking) {
      setHoveredBooking(booking);
      setTooltipPosition({
        x: event.clientX + 10,
        y: event.clientY + 10
      });
    } else {
      setHoveredBooking(null);
    }
  };

  if (!['receptionist', 'manager', 'admin'].includes(user?.role)) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="text-red-500 text-lg mb-2">Access Denied</div>
          <p className="text-gray-600">You don't have permission to view the booking calendar.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Booking Calendar</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage room reservations and view occupancy patterns
            </p>
          </div>
          
          {/* Quick Stats */}
          <div className="mt-4 sm:mt-0 flex flex-wrap gap-4">
            <div className="bg-blue-50 px-3 py-1 rounded-lg">
              <span className="text-xs text-blue-600 font-medium">Total Bookings</span>
              <div className="text-lg font-bold text-blue-900">{calendarData?.summary?.total_bookings || 0}</div>
            </div>
            <div className="bg-green-50 px-3 py-1 rounded-lg">
              <span className="text-xs text-green-600 font-medium">Occupancy Rate</span>
              <div className="text-lg font-bold text-green-900">{calendarData?.summary?.occupancy_rate || 0}%</div>
            </div>
            <div className="bg-purple-50 px-3 py-1 rounded-lg">
              <span className="text-xs text-purple-600 font-medium">Total Rooms</span>
              <div className="text-lg font-bold text-purple-900">{calendarData?.summary?.total_rooms || 0}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3">
        <div className="flex flex-col gap-3 sm:gap-4">
          {/* Navigation */}
          <div className="flex items-center justify-center sm:justify-start">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigateCalendar(-1)}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 min-w-32 sm:min-w-40 text-center">
                {formatDateRangeDisplay()}
              </h2>
              
              <button
                onClick={() => navigateCalendar(1)}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <div className="flex items-center gap-2 ml-4">
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100"
              >
                Today
              </button>
              
              {/* Quick Jump Buttons */}
              <div className="flex gap-1">
                <button
                  onClick={() => {
                    const date = new Date();
                    date.setMonth(date.getMonth() + 1);
                    setCurrentDate(date);
                  }}
                  className="px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                >
                  Next Month
                </button>
                <button
                  onClick={() => {
                    const date = new Date();
                    date.setMonth(date.getMonth() + 3);
                    setCurrentDate(date);
                  }}
                  className="px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                >
                  +3 Months
                </button>
              </div>
            </div>
          </div>

          {/* View Controls */}
          <div className="flex flex-col gap-4">
            {/* First Row: Room Type Filter and Date Picker */}
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3 sm:gap-4">
              {/* Room Type Filter */}
              <div className="w-full sm:w-48">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Filter by Room Type
                </label>
                <select
                  value={selectedRoomType}
                  onChange={(e) => setSelectedRoomType(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Room Types</option>
                  {(calendarData?.room_types || []).map(roomType => (
                    <option key={roomType.id} value={roomType.id}>
                      {roomType.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Picker */}
              <div className="w-full sm:w-52">
                <DatePicker
                  selectedDate={currentDate}
                  onDateChange={setCurrentDate}
                  viewType={viewType}
                  label={`Jump to ${viewType}`}
                />
              </div>

              {/* View Type Toggle */}
              <div className="">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  View Type
                </label>
                <div className="flex bg-gray-100 rounded-lg p-1">
                  {['month', 'quarter', 'year'].map(type => (
                    <button
                      key={type}
                      onClick={() => setViewType(type)}
                      className={`px-3 py-1 text-sm rounded-md capitalize transition-colors min-w-16 ${
                        viewType === type
                          ? 'bg-white text-blue-700 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Refresh Button */}
              <div className="">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  &nbsp;
                </label>
                <button
                  onClick={loadCalendarData}
                  disabled={loading}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900 disabled:opacity-50 border border-gray-300"
                  title="Refresh calendar data"
                >
                  <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-red-500 text-lg mb-2">Error</div>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={loadCalendarData}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          </div>
        ) : (
          <CalendarGrid
            rooms={calendarData?.rooms || []}
            bookings={calendarData?.bookings || []}
            dateRange={calendarData?.date_range || {}}
            viewType={viewType}
            onBookingHover={handleBookingHover}
          />
        )}
      </div>

      {/* Tooltip */}
      {hoveredBooking && (
        <BookingTooltip
          booking={hoveredBooking}
          position={tooltipPosition}
        />
      )}
    </div>
  );
};

export default BookingCalendar;

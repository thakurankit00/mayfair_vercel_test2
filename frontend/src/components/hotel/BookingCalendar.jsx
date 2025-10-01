import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { bookingApi } from '../../services/hotelApi';
import LoadingSpinner from '../common/LoadingSpinner';
import CalendarGrid from './CalendarGrid';
import BookingTooltip from './BookingTooltip';
import BookingModal from './BookingModal';
import DateBookingsModal from './DateBookingsModal';

// New inline component for Month and Year selection
const MonthYearPicker = ({ selectedDate, onDateChange, label }) => {
  const currentMonth = selectedDate.getMonth();
  const currentYear = selectedDate.getFullYear();

  const handleMonthChange = (e) => {
    const newMonth = parseInt(e.target.value, 10);
    const newDate = new Date(currentYear, newMonth, 1);
    onDateChange(newDate);
  };

  const handleYearChange = (e) => {
    const newYear = parseInt(e.target.value, 10);
    const newDate = new Date(newYear, currentMonth, 1);
    onDateChange(newDate);
  };

  // Generate options for months
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i,
    label: new Date(0, i).toLocaleString('en-US', { month: 'long' })
  }));

  // Generate options for years (current year +/- 10 years)
  const years = Array.from({ length: 21 }, (_, i) => currentYear - 10 + i);

  return (
    <div className="w-full sm:w-52">
      <label className="block text-xs font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className="flex space-x-2">
        <select
          value={currentMonth}
          onChange={handleMonthChange}
          className="w-1/2 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {months.map(month => (
            <option key={month.value} value={month.value}>{month.label}</option>
          ))}
        </select>
        <select
          value={currentYear}
          onChange={handleYearChange}
          className="w-1/2 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {years.map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>
    </div>
  );
};

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

  // Booking modal state
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);

  // Date bookings modal state
  const [showDateBookingsModal, setShowDateBookingsModal] = useState(false);
  const [selectedDateBookings, setSelectedDateBookings] = useState([]);
  const [selectedDateForBookings, setSelectedDateForBookings] = useState(null);

  // Calendar view mode state
  const [calendarViewMode, setCalendarViewMode] = useState('monthly'); // 'monthly' or 'timeline'

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

  // Handle booking click for editing
  const handleBookingClick = (booking) => {
    console.log('📅 [BOOKING CALENDAR] Booking clicked for editing:', booking);
    setSelectedBooking(booking);
    setSelectedDate(null);
    setShowBookingModal(true);
  };

  // Handle date click for new booking
  const handleDateClick = (date, room = null) => {
    setSelectedDate(date);
    setSelectedBooking(room ? { room_id: room.id, room_number: room.room_number } : null);
    setShowBookingModal(true);
  };

  // Handle booking update (drag & resize)
  const handleBookingUpdate = async (bookingId, updates) => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        // Reload calendar data to reflect changes
        loadCalendarData();

        // Show success notification (optional)
        console.log('Booking updated successfully');
      } else {
        console.error('Failed to update booking');
        // Reload to revert changes
        loadCalendarData();
      }
    } catch (error) {
      console.error('Error updating booking:', error);
      // Reload to revert changes
      loadCalendarData();
    }
  };

  // Handle booking modal close
  const handleBookingModalClose = () => {
    setShowBookingModal(false);
    setSelectedBooking(null);
    setSelectedDate(null);
  };

  // Handle booking save (refresh calendar data)
  const handleBookingSave = () => {
    loadCalendarData();
  };

  // Handle date bookings modal
  const handleDateBookingsClick = (date, bookings) => {
    setSelectedDateForBookings(date);
    setSelectedDateBookings(bookings);
    setShowDateBookingsModal(true);
  };

  const handleDateBookingsModalClose = () => {
    setShowDateBookingsModal(false);
    setSelectedDateBookings([]);
    setSelectedDateForBookings(null);
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
      {/* Fixed Header - Always visible */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4  z-30">
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

      {/* Fixed Controls - Part of sticky header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-3  sm:top-[140px] z-20">
        <div className="flex flex-col gap-3 sm:gap-4">
          

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

              {/* New Modern Month/Year Picker */}
              <MonthYearPicker
                selectedDate={currentDate}
                onDateChange={setCurrentDate}
                label="Jump to Month/Year"
              />

              {/* Calendar View Mode Toggle */}
              <div className="">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Calendar View
                </label>
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setCalendarViewMode('monthly')}
                    className={`px-3 py-1 text-sm rounded-md transition-colors min-w-20 flex items-center space-x-1 ${
                      calendarViewMode === 'monthly'
                        ? 'bg-white text-blue-700 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <span>📅</span>
                    <span>Monthly</span>
                  </button>
                  <button
                    onClick={() => setCalendarViewMode('timeline')}
                    className={`px-3 py-1 text-sm rounded-md transition-colors min-w-20 flex items-center space-x-1 ${
                      calendarViewMode === 'timeline'
                        ? 'bg-white text-blue-700 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <span>📊</span>
                    <span>Timeline</span>
                  </button>
                </div>
              </div>

              {/* View Type Toggle (for timeline view) */}
              {calendarViewMode === 'timeline' && (
                <div className="">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Time Range
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
              )}

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

      {/* Main Calendar Container - Only Date Grid Scrolls */}
      <div className="flex-1 flex flex-col overflow-hidden">
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
            calendarViewMode={calendarViewMode}
            onBookingHover={handleBookingHover}
            onBookingClick={handleBookingClick}
            onDateClick={handleDateClick}
            onBookingUpdate={handleBookingUpdate}
            onDateBookingsClick={handleDateBookingsClick}
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

      {/* Booking Modal */}
      <BookingModal
        isOpen={showBookingModal}
        onClose={handleBookingModalClose}
        booking={selectedBooking}
        selectedDate={selectedDate}
        onSave={handleBookingSave}
        rooms={calendarData?.rooms || []}
      />

      {/* Date Bookings Modal */}
      <DateBookingsModal
        isOpen={showDateBookingsModal}
        onClose={handleDateBookingsModalClose}
        date={selectedDateForBookings}
        bookings={selectedDateBookings}
        onBookingClick={handleBookingClick}
      />
    </div>
  );
};

export default BookingCalendar;

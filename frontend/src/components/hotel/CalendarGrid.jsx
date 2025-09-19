import React, { useMemo, useState } from 'react';

const CalendarGrid = ({ rooms, bookings, dateRange, viewType, onBookingHover, onBookingClick, onDateClick, calendarViewMode = 'monthly' }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Generate date columns for timeline view (original implementation)
  const dateColumns = useMemo(() => {
    if (!dateRange.start_date || !dateRange.end_date) return [];

    const startDate = new Date(dateRange.start_date);
    const endDate = new Date(dateRange.end_date);
    const columns = [];

    let currentDate = new Date(startDate);

    switch (viewType) {
      case 'month':
        // Daily columns for month view
        while (currentDate <= endDate) {
          columns.push({
            date: new Date(currentDate),
            label: currentDate.getDate().toString(),
            fullLabel: currentDate.toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric'
            }),
            key: currentDate.toISOString().split('T')[0]
          });
          currentDate.setDate(currentDate.getDate() + 1);
        }
        break;

      case 'quarter':
        // Weekly columns for quarter view
        while (currentDate <= endDate) {
          const weekStart = new Date(currentDate);
          const weekEnd = new Date(currentDate);
          weekEnd.setDate(weekEnd.getDate() + 6);

          columns.push({
            date: new Date(weekStart),
            label: `W${Math.ceil(currentDate.getDate() / 7)}`,
            fullLabel: `Week of ${weekStart.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric'
            })}`,
            key: weekStart.toISOString().split('T')[0],
            isWeek: true,
            weekEnd: weekEnd.toISOString().split('T')[0]
          });
          currentDate.setDate(currentDate.getDate() + 7);
        }
        break;

      case 'year':
        // Monthly columns for year view
        while (currentDate <= endDate) {
          columns.push({
            date: new Date(currentDate),
            label: currentDate.toLocaleDateString('en-US', { month: 'short' }),
            fullLabel: currentDate.toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric'
            }),
            key: currentDate.toISOString().split('T')[0].substring(0, 7), // YYYY-MM format
            isMonth: true
          });
          currentDate.setMonth(currentDate.getMonth() + 1);
        }
        break;

      default:
        break;
    }

    return columns;
  }, [dateRange, viewType]);

  // Generate monthly calendar grid (Google Calendar style)
  const generateMonthlyGrid = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    // Get first day of month and calculate starting date (including previous month days)
    const firstDayOfMonth = new Date(year, month, 1);
    const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday

    // Calculate the start date (may include days from previous month)
    const startDate = new Date(firstDayOfMonth);
    startDate.setDate(startDate.getDate() - startingDayOfWeek);

    // Generate 6 weeks (42 days) to ensure full calendar grid
    const days = [];
    const currentDate = new Date(startDate);

    for (let i = 0; i < 42; i++) {
      const isCurrentMonth = currentDate.getMonth() === month;
      const isToday = currentDate.toDateString() === new Date().toDateString();
      const isPreviousMonth = currentDate.getMonth() < month || (currentDate.getMonth() === 11 && month === 0);
      const isNextMonth = currentDate.getMonth() > month || (currentDate.getMonth() === 0 && month === 11);

      days.push({
        date: new Date(currentDate),
        day: currentDate.getDate(),
        isCurrentMonth,
        isToday,
        isPreviousMonth,
        isNextMonth,
        key: currentDate.toISOString().split('T')[0]
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return days;
  }, [currentMonth]);

  // Group bookings by room for timeline view
  const bookingsByRoom = useMemo(() => {
    const grouped = {};

    rooms.forEach(room => {
      grouped[room.id] = [];
    });

    bookings.forEach(booking => {
      if (grouped[booking.room_id]) {
        grouped[booking.room_id].push(booking);
      }
    });

    return grouped;
  }, [rooms, bookings]);

  // Group bookings by date for monthly view
  const bookingsByDate = useMemo(() => {
    const grouped = {};

    bookings.forEach(booking => {
      const checkInDate = booking.check_in_date.split('T')[0];
      const checkOutDate = booking.check_out_date.split('T')[0];

      // Create date range for booking
      const startDate = new Date(checkInDate);
      const endDate = new Date(checkOutDate);
      const currentDate = new Date(startDate);

      while (currentDate < endDate) {
        const dateKey = currentDate.toISOString().split('T')[0];
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push({
          ...booking,
          isStartDate: dateKey === checkInDate,
          isEndDate: dateKey === checkOutDate
        });
        currentDate.setDate(currentDate.getDate() + 1);
      }
    });

    return grouped;
  }, [bookings]);

  // Calculate booking position and width for timeline view
  const calculateBookingStyle = (booking, dateColumns) => {
    const checkInDate = new Date(booking.check_in_date);
    const checkOutDate = new Date(booking.check_out_date);
    const startDate = new Date(dateRange.start_date);

    // Find start and end positions
    let startIndex = 0;
    let endIndex = dateColumns.length - 1;

    switch (viewType) {
      case 'month':
        startIndex = Math.max(0, Math.floor((checkInDate - startDate) / (1000 * 60 * 60 * 24)));
        endIndex = Math.min(dateColumns.length - 1, Math.floor((checkOutDate - startDate) / (1000 * 60 * 60 * 24)));
        break;

      case 'quarter':
        // For weekly view, find which week the booking starts and ends
        for (let i = 0; i < dateColumns.length; i++) {
          const weekStart = new Date(dateColumns[i].key);
          const weekEnd = new Date(dateColumns[i].weekEnd || dateColumns[i].key);

          if (checkInDate <= weekEnd && checkInDate >= weekStart) {
            startIndex = i;
          }
          if (checkOutDate <= weekEnd && checkOutDate >= weekStart) {
            endIndex = i;
          }
        }
        break;

      case 'year':
        // For monthly view, find which month the booking starts and ends
        for (let i = 0; i < dateColumns.length; i++) {
          const monthKey = dateColumns[i].key;
          const bookingStartMonth = booking.check_in_date.substring(0, 7);
          const bookingEndMonth = booking.check_out_date.substring(0, 7);

          if (bookingStartMonth === monthKey) {
            startIndex = i;
          }
          if (bookingEndMonth === monthKey) {
            endIndex = i;
          }
        }
        break;

      default:
        startIndex = Math.max(0, Math.floor((checkInDate - startDate) / (1000 * 60 * 60 * 24)));
        endIndex = Math.min(dateColumns.length - 1, Math.floor((checkOutDate - startDate) / (1000 * 60 * 60 * 24)));
        break;
    }

    const width = Math.max(1, endIndex - startIndex + 1);
    const left = startIndex;

    return {
      left: `${(left * 100) / dateColumns.length}%`,
      width: `${(width * 100) / dateColumns.length}%`
    };
  };

  // Column width based on view type and screen size for timeline view
  const getColumnWidth = () => {
    const isMobile = window.innerWidth < 768;

    switch (viewType) {
      case 'month':
        if (isMobile) {
          return dateColumns.length > 31 ? 'min-w-6' : 'min-w-8';
        }
        return dateColumns.length > 31 ? 'min-w-8' : 'min-w-12';
      case 'quarter':
        return isMobile ? 'min-w-12' : 'min-w-16';
      case 'year':
        return isMobile ? 'min-w-16' : 'min-w-20';
      default:
        return isMobile ? 'min-w-8' : 'min-w-12';
    }
  };

  // Navigation functions for monthly view
  const navigateMonth = (direction) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  // Get booking status color (updated with new color scheme)
  const getBookingStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500 text-white border-green-600'; // 🟩 Green
      case 'checked_in':
        return 'bg-blue-500 text-white border-blue-600'; // 🔵 Blue
      case 'pending':
        return 'bg-yellow-500 text-black border-yellow-600'; // 🟨 Yellow
      case 'checked_out':
        return 'bg-red-500 text-white border-red-600'; // 🔴 Red
      case 'cancelled':
        return 'bg-gray-500 text-white border-gray-600'; // ⬜ Gray
      default:
        return 'bg-orange-500 text-white border-orange-600'; // 🟧 Orange (Booked)
    }
  };

  // Format month/year display
  const formatMonthYear = () => {
    return currentMonth.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });
  };

  // Render Timeline View (original implementation)
  if (calendarViewMode === 'timeline') {
    if (!rooms.length || !dateColumns.length) {
      return (
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">No data to display</p>
        </div>
      );
    }

    return (
      <div className="bg-white">
        {/* Calendar Header - Fixed */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
          <div className="flex min-w-full">
            {/* Room header column */}
            <div className="w-48 sm:w-48 w-32 flex-shrink-0 bg-gray-50 border-r border-gray-200 p-2 sm:p-3">
              <div className="font-semibold text-gray-900 text-xs sm:text-sm">Room Details</div>
            </div>

            {/* Date columns - No internal scrolling */}
            <div className="flex-1 min-w-0">
              <div className="flex">
                {dateColumns.map((column) => (
                  <div
                    key={column.key}
                    className={`${getColumnWidth()} flex-shrink-0 p-2 text-center border-r border-gray-100 last:border-r-0`}
                  >
                    <div className="text-xs font-medium text-gray-600">
                      {column.label}
                    </div>
                    {viewType === 'month' && (
                      <div className="text-xs text-gray-400">
                        {column.date.toLocaleDateString('en-US', { weekday: 'short' })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Calendar Body - No internal scrolling */}
        <div className="relative">
          {rooms.map((room, roomIndex) => (
            <div
              key={room.id}
              className={`flex border-b border-gray-100 hover:bg-gray-50 min-w-full ${
                roomIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'
              }`}
            >
              {/* Room info column */}
              <div className="w-32 sm:w-48 flex-shrink-0 border-r border-gray-200 p-2 sm:p-3">
                <div className="flex flex-col space-y-1">
                  <div className="font-semibold text-xs sm:text-sm text-gray-900">
                    Room {room.room_number}
                  </div>
                  <div className="text-xs text-gray-500 hidden sm:block">
                    {room.room_type} • Floor {room.floor}
                  </div>
                  <div className="text-xs text-gray-500 sm:hidden">
                    {room.room_type}
                  </div>
                  <div className="text-xs text-gray-400 hidden sm:block">
                    Max: {room.max_occupancy} guests
                  </div>
                  <div className="flex items-center space-x-1">
                    <span
                      className={`inline-block w-2 h-2 rounded-full ${
                        room.status === 'available'
                          ? 'bg-green-400'
                          : room.status === 'occupied'
                          ? 'bg-red-400'
                          : 'bg-yellow-400'
                      }`}
                    />
                    <span className="text-xs text-gray-500 capitalize">
                      {room.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Calendar cells - No internal scrolling */}
              <div className="flex-1 relative min-w-0">
                <div className="flex h-20">
                  {/* Background grid cells */}
                  {dateColumns.map((column) => (
                    <div
                      key={`${room.id}-${column.key}`}
                      className={`${getColumnWidth()} flex-shrink-0 border-r border-gray-100 last:border-r-0 cursor-pointer hover:bg-gray-50`}
                      onClick={() => onDateClick && onDateClick(column.date)}
                    />
                  ))}

                  {/* Booking bars */}
                  {bookingsByRoom[room.id] && bookingsByRoom[room.id].map((booking) => {
                    const style = calculateBookingStyle(booking, dateColumns);
                    return (
                      <div
                        key={booking.id}
                        className={`absolute top-2 bottom-2 rounded-md border-2 ${getBookingStatusColor(
                          booking.status
                        )} cursor-pointer hover:opacity-80 flex items-center px-2 z-10`}
                        style={style}
                        onClick={(e) => {
                          e.stopPropagation();
                          onBookingClick && onBookingClick(booking);
                        }}
                        onMouseEnter={(e) => onBookingHover && onBookingHover(booking, e)}
                        onMouseLeave={(e) => onBookingHover && onBookingHover(null, e)}
                        title={`${booking.customer_name} • ${booking.nights} night(s) • ${booking.total_guests} guests`}
                      >
                        <div className="text-xs text-white font-medium truncate">
                          <div className="truncate">{booking.customer_name}</div>
                          <div className="text-xs opacity-90">
                            {booking.total_guests} guest{booking.total_guests !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Legend - Fixed at bottom */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 mt-4">
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <span className="font-medium text-gray-700">Booking Status:</span>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded bg-green-500"></div>
              <span>🟩 Confirmed</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded bg-blue-500"></div>
              <span>🔵 Checked In</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded bg-yellow-500"></div>
              <span>🟨 Pending</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded bg-red-500"></div>
              <span>🔴 Checked Out</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded bg-orange-500"></div>
              <span>🟧 Booked</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded bg-gray-500"></div>
              <span>⬜ Cancelled</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render Monthly Grid View (Google Calendar style)
  return (
    <div className="bg-white">
      {/* Calendar Header with Navigation - Fixed */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <h2 className="text-xl font-semibold text-gray-900">
              {formatMonthYear()}
            </h2>

            <button
              onClick={() => navigateMonth(1)}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <button
            onClick={goToToday}
            className="px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100"
          >
            Today
          </button>
        </div>
      </div>

      {/* Days of Week Header */}
      <div className="grid grid-cols-7 border-b border-gray-200">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="p-2 sm:p-3 text-center text-xs sm:text-sm font-medium text-gray-500 bg-gray-50">
            <span className="hidden sm:inline">{day}</span>
            <span className="sm:hidden">{day.charAt(0)}</span>
          </div>
        ))}
      </div>

      {/* Calendar Grid Body */}
      <div className="grid grid-cols-7">
        {generateMonthlyGrid.map((day) => (
          <div
            key={day.key}
            className={`min-h-24 sm:min-h-32 border-r border-b border-gray-200 p-1 sm:p-2 cursor-pointer hover:bg-gray-50 ${
              day.isToday ? 'bg-blue-50 border-blue-300' : ''
            } ${
              !day.isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white'
            }`}
            onClick={() => onDateClick && onDateClick(day.date)}
          >
            {/* Date number */}
            <div className={`text-xs sm:text-sm font-medium mb-1 sm:mb-2 ${
              day.isToday ? 'bg-blue-600 text-white rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-xs' : ''
            }`}>
              {day.day}
            </div>

            {/* Bookings for this date */}
            <div className="space-y-0.5 sm:space-y-1 overflow-hidden">
              {bookingsByDate[day.key] && bookingsByDate[day.key].slice(0, window.innerWidth < 768 ? 2 : 3).map((booking, bookingIndex) => (
                <div
                  key={`${booking.id}-${bookingIndex}`}
                  className={`text-xs px-1 sm:px-2 py-0.5 sm:py-1 rounded cursor-pointer hover:opacity-80 ${getBookingStatusColor(booking.status)}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onBookingClick && onBookingClick(booking);
                  }}
                  onMouseEnter={(e) => onBookingHover && onBookingHover(booking, e)}
                  onMouseLeave={(e) => onBookingHover && onBookingHover(null, e)}
                  title={`Room ${booking.room_number} - ${booking.customer_name || 'Guest'}`}
                >
                  <div className="truncate text-xs">
                    <span className="hidden sm:inline">{booking.isStartDate && '📅'} Room {booking.room_number}</span>
                    <span className="sm:hidden">R{booking.room_number}</span>
                  </div>
                  <div className="truncate text-xs hidden sm:block">
                    {booking.customer_name || 'Guest'}
                  </div>
                </div>
              ))}

              {/* Show "more" indicator if there are additional bookings */}
              {bookingsByDate[day.key] && bookingsByDate[day.key].length > (window.innerWidth < 768 ? 2 : 3) && (
                <div className="text-xs text-gray-500 px-1 sm:px-2">
                  +{bookingsByDate[day.key].length - (window.innerWidth < 768 ? 2 : 3)} more
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Legend - Fixed at bottom */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 mt-4">
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <span className="font-medium text-gray-700">Booking Status:</span>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded bg-green-500"></div>
            <span>🟩 Confirmed</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded bg-blue-500"></div>
            <span>🔵 Checked In</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded bg-yellow-500"></div>
            <span>🟨 Pending</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded bg-red-500"></div>
            <span>🔴 Checked Out</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded bg-orange-500"></div>
            <span>🟧 Booked</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded bg-gray-500"></div>
            <span>⬜ Cancelled</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarGrid;

import React, { useMemo } from 'react';

const CalendarGrid = ({ rooms, bookings, dateRange, viewType, onBookingHover }) => {
  // Generate date columns based on view type and date range
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

  // Group bookings by room
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

  // Calculate booking position and width
  const calculateBookingStyle = (booking, dateColumns) => {
    const checkInDate = new Date(booking.check_in_date);
    const checkOutDate = new Date(booking.check_out_date);
    const startDate = new Date(dateRange.start_date);
    // const endDate = new Date(dateRange.end_date); // Unused variable
    
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

  // Get booking status color
  const getBookingStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-400 border-green-500';
      case 'checked_in':
        return 'bg-blue-400 border-blue-500';
      case 'checked_out':
        return 'bg-gray-400 border-gray-500';
      case 'pending':
        return 'bg-yellow-400 border-yellow-500';
      case 'cancelled':
        return 'bg-red-400 border-red-500';
      default:
        return 'bg-blue-400 border-blue-500';
    }
  };

  // Column width based on view type and screen size
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

  if (!rooms.length || !dateColumns.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">No data to display</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto bg-white">
      {/* Calendar Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200">
        <div className="flex">
          {/* Room header column */}
          <div className="w-48 sm:w-48 w-32 flex-shrink-0 bg-gray-50 border-r border-gray-200 p-2 sm:p-3">
            <div className="font-semibold text-gray-900 text-xs sm:text-sm">Room Details</div>
          </div>
          
          {/* Date columns */}
          <div className="flex-1 overflow-x-auto">
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

      {/* Calendar Body */}
      <div className="relative">
        {rooms.map((room, roomIndex) => (
          <div
            key={room.id}
            className={`flex border-b border-gray-100 hover:bg-gray-50 ${
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

            {/* Calendar cells */}
            <div className="flex-1 relative overflow-x-auto">
              <div className="flex h-20">
                {/* Background grid cells */}
                {dateColumns.map((column) => (
                  <div
                    key={`${room.id}-${column.key}`}
                    className={`${getColumnWidth()} flex-shrink-0 border-r border-gray-100 last:border-r-0`}
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
                      onMouseEnter={(e) => onBookingHover(booking, e)}
                      onMouseLeave={(e) => onBookingHover(null, e)}
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

      {/* Legend */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <span className="font-medium text-gray-700">Status:</span>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded bg-yellow-400 border border-yellow-500"></div>
            <span>Pending</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded bg-green-400 border border-green-500"></div>
            <span>Confirmed</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded bg-blue-400 border border-blue-500"></div>
            <span>Checked In</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded bg-gray-400 border border-gray-500"></div>
            <span>Checked Out</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded bg-red-400 border border-red-500"></div>
            <span>Cancelled</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarGrid;

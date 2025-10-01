import { useMemo, useState, useRef, useEffect } from 'react';
import DraggableBookingBar from './DraggableBookingBar';

const CalendarGrid = ({ rooms, bookings, dateRange, viewType, onBookingHover, onBookingClick, onDateClick, onBookingUpdate, onDateBookingsClick, calendarViewMode = 'monthly' }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Timeline scrolling state and refs
  const timelineScrollRef = useRef(null);
  const headerScrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);

  // Timeline scroll management functions
  const updateScrollButtons = () => {
    if (timelineScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = timelineScrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  const scrollTimeline = (direction) => {
    if (timelineScrollRef.current) {
      const scrollAmount = calendarViewMode === 'hotel-timeline' ? 288 : 320; // 3 columns * 96px for hotel timeline, 4 columns * 80px for regular timeline
      const currentScroll = timelineScrollRef.current.scrollLeft;
      const targetScroll = direction === 'left'
        ? Math.max(0, currentScroll - scrollAmount)
        : currentScroll + scrollAmount;

      timelineScrollRef.current.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      });
    }
  };

  const handleTimelineScroll = () => {
    setIsScrolling(true);
    updateScrollButtons();

    // Sync header scroll with content scroll using refs for better reliability
    if (timelineScrollRef.current && headerScrollRef.current) {
      headerScrollRef.current.style.transform = `translateX(-${timelineScrollRef.current.scrollLeft}px)`;
    }

    // Clear scrolling state after scroll ends
    clearTimeout(window.scrollTimeout);
    window.scrollTimeout = setTimeout(() => {
      setIsScrolling(false);
    }, 150);
    };

  // Enhanced wheel event handler for horizontal scrolling
  const handleWheelScroll = (e) => {
    if (timelineScrollRef.current && Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      e.preventDefault();
      timelineScrollRef.current.scrollLeft += e.deltaX;
    } else if (timelineScrollRef.current && e.shiftKey) {
      // Allow shift+wheel for horizontal scrolling
      e.preventDefault();
      timelineScrollRef.current.scrollLeft += e.deltaY;
    }
  };

  // Keyboard navigation support
  const handleKeyDown = (e) => {
    if (e.target.closest('.timeline-container')) {
      if (e.key === 'ArrowLeft' && canScrollLeft) {
        e.preventDefault();
        scrollTimeline('left');
      } else if (e.key === 'ArrowRight' && canScrollRight) {
        e.preventDefault();
        scrollTimeline('right');
      } else if (e.key === 'Home') {
        e.preventDefault();
        timelineScrollRef.current?.scrollTo({ left: 0, behavior: 'smooth' });
      } else if (e.key === 'End') {
        e.preventDefault();
        timelineScrollRef.current?.scrollTo({
          left: timelineScrollRef.current.scrollWidth,
          behavior: 'smooth'
        });
      }
    }
  };

  // Generate date columns for timeline view
  const dateColumns = useMemo(() => {
    if (!dateRange || !dateRange.start_date || !dateRange.end_date) {
      return [];
    }

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

  // Update scroll buttons when timeline data changes and add keyboard listener
  useEffect(() => {
    updateScrollButtons();

    // Add keyboard event listener
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (window.scrollTimeout) {
        clearTimeout(window.scrollTimeout);
      }
    };
  }, [dateColumns, canScrollLeft, canScrollRight]);

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

  // Generate timeline dates for hotel view
  const timelineDates = useMemo(() => {
    const dates = [];
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 3); // Start 3 days before today
    
    for (let i = 0; i < 30; i++) { // Show 30 days
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      dates.push({
        date: new Date(date),
        day: date.getDate(),
        weekday: date.toLocaleDateString('en-US', { weekday: 'short' }),
        isToday: date.toDateString() === today.toDateString(),
        key: date.toISOString().split('T')[0]
      });
    }
    
    return dates;
  }, []);

  // Group bookings by room and date for timeline
  const timelineBookings = useMemo(() => {
    const grouped = {};
    
    rooms.forEach(room => {
      grouped[room.id] = {};
    });
    
    bookings.forEach(booking => {
      if (grouped[booking.room_id]) {
        const checkIn = new Date(booking.check_in_date);
        const checkOut = new Date(booking.check_out_date);
        const currentDate = new Date(checkIn);
        
        while (currentDate < checkOut) {
          const dateKey = currentDate.toISOString().split('T')[0];
          if (!grouped[booking.room_id][dateKey]) {
            grouped[booking.room_id][dateKey] = [];
          }
          grouped[booking.room_id][dateKey].push({
            ...booking,
            isStartDate: dateKey === booking.check_in_date.split('T')[0],
            isEndDate: dateKey === booking.check_out_date.split('T')[0]
          });
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }
    });
    
    return grouped;
  }, [rooms, bookings]);

  // Enhanced booking position and width calculation for timeline view
  const calculateBookingStyle = (booking, dateColumns) => {
    if (!booking || !dateColumns || dateColumns.length === 0) {
      return { left: '0px', width: '0px', nights: 0 };
    }

    const checkInDate = new Date(booking.check_in_date);
    const checkOutDate = new Date(booking.check_out_date);

    // Calculate nights (check-out date is exclusive)
    const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));

    // Find start and end column indices with improved logic
    let startIndex = -1;
    let endIndex = -1;

    // Find the exact column indices for check-in and check-out dates
    for (let i = 0; i < dateColumns.length; i++) {
      const column = dateColumns[i];
      const columnDate = new Date(column.date || column.key);

      // Normalize dates to compare only the date part (ignore time)
      const columnDateStr = columnDate.toISOString().split('T')[0];
      const checkInDateStr = checkInDate.toISOString().split('T')[0];
      const checkOutDateStr = checkOutDate.toISOString().split('T')[0];

      // Find check-in date column
      if (columnDateStr === checkInDateStr) {
        startIndex = i;
      }

      // Find the last day of stay (check-out date is exclusive)
      // For a booking from Sep 4-7, guest stays Sep 4, 5, 6 and checks out on Sep 7
      // So the bar should span from Sep 4 to Sep 6 (inclusive)
      if (columnDateStr < checkOutDateStr && startIndex !== -1) {
        endIndex = i;
      }
    }

    // If we couldn't find exact matches, fall back to calculation
    if (startIndex === -1 || endIndex === -1) {
      const startDate = new Date(dateRange.start_date);

      switch (viewType) {
        case 'month':
          startIndex = Math.max(0, Math.floor((checkInDate - startDate) / (1000 * 60 * 60 * 24)));
          // Check-out date is exclusive, so subtract 1 day for the last occupied day
          const lastOccupiedDay = new Date(checkOutDate);
          lastOccupiedDay.setDate(lastOccupiedDay.getDate() - 1);
          endIndex = Math.min(dateColumns.length - 1, Math.floor((lastOccupiedDay - startDate) / (1000 * 60 * 60 * 24)));
          break;

        case 'quarter':
          // For weekly view, find which week the booking starts and ends
          for (let i = 0; i < dateColumns.length; i++) {
            const weekStart = new Date(dateColumns[i].key);
            const weekEnd = new Date(dateColumns[i].weekEnd || dateColumns[i].key);

            if (checkInDate <= weekEnd && checkInDate >= weekStart) {
              startIndex = i;
            }
            // For checkout, find the week containing the last occupied day
            const lastOccupiedDay = new Date(checkOutDate);
            lastOccupiedDay.setDate(lastOccupiedDay.getDate() - 1);
            if (lastOccupiedDay <= weekEnd && lastOccupiedDay >= weekStart) {
              endIndex = i;
            }
          }
          break;

        case 'year':
          // For monthly view, find which month the booking starts and ends
          for (let i = 0; i < dateColumns.length; i++) {
            const monthKey = dateColumns[i].key;
            const bookingStartMonth = booking.check_in_date.substring(0, 7);
            const lastOccupiedDay = new Date(checkOutDate);
            lastOccupiedDay.setDate(lastOccupiedDay.getDate() - 1);
            const bookingEndMonth = lastOccupiedDay.toISOString().substring(0, 7);

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
          const lastOccupiedDayDefault = new Date(checkOutDate);
          lastOccupiedDayDefault.setDate(lastOccupiedDayDefault.getDate() - 1);
          endIndex = Math.min(dateColumns.length - 1, Math.floor((lastOccupiedDayDefault - startDate) / (1000 * 60 * 60 * 24)));
          break;
      }
    }

    // Ensure valid indices
    startIndex = Math.max(0, startIndex);
    endIndex = Math.max(startIndex, Math.min(dateColumns.length - 1, endIndex));

    // Calculate width (number of columns to span)
    const width = Math.max(1, endIndex - startIndex + 1);
    const left = startIndex;

    return {
      left: `${(left * 100) / dateColumns.length}%`,
      width: `${(width * 100) / dateColumns.length}%`,
      startIndex,
      endIndex,
      nights: nights, // Use the calculated nights value
      position: 'absolute'
    };
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

  // Unified Status Legend Component
  const renderStatusLegend = (viewMode = 'timeline') => {
    const tipText = viewMode === 'timeline'
      ? 'Drag bars to reschedule • Resize edges to extend/shorten • Double-click empty cells to create bookings'
      : 'Click booking cards to edit • Click empty cells to create new bookings';

    return (
      <div className="sticky bottom-0 bg-gradient-to-r from-blue-50 to-green-50 border-t-2 border-gray-300 p-4 mt-4 shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <span className="font-bold text-gray-800 text-sm">Booking Status Legend:</span>
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center space-x-2 bg-white px-2 py-1 rounded-lg shadow-sm">
              <div className="w-4 h-4 rounded bg-green-500 border border-green-600"></div>
              <span className="font-medium"> Confirmed</span>
            </div>
            <div className="flex items-center space-x-2 bg-white px-2 py-1 rounded-lg shadow-sm">
              <div className="w-4 h-4 rounded bg-blue-500 border border-blue-600"></div>
              <span className="font-medium"> Checked In</span>
            </div>
            <div className="flex items-center space-x-2 bg-white px-2 py-1 rounded-lg shadow-sm">
              <div className="w-4 h-4 rounded bg-yellow-500 border border-yellow-600"></div>
              <span className="font-medium">Pending</span>
            </div>
            <div className="flex items-center space-x-2 bg-white px-2 py-1 rounded-lg shadow-sm">
              <div className="w-4 h-4 rounded bg-red-500 border border-red-600"></div>
              <span className="font-medium"> Checked Out</span>
            </div>
            <div className="flex items-center space-x-2 bg-white px-2 py-1 rounded-lg shadow-sm">
              <div className="w-4 h-4 rounded bg-orange-500 border border-orange-600"></div>
              <span className="font-medium"> Booked</span>
            </div>
            <div className="flex items-center space-x-2 bg-white px-2 py-1 rounded-lg shadow-sm">
              <div className="w-4 h-4 rounded bg-gray-500 border border-gray-600"></div>
              <span className="font-medium">Cancelled</span>
            </div>
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-600 bg-white px-3 py-1 rounded-lg inline-block">
          💡 <strong>Tip:</strong> {tipText}
        </div>
      </div>
    );
  };

  // Hotel Timeline View
  if (calendarViewMode === 'hotel-timeline') {
    return (
      <div className="h-full flex flex-col bg-white">
        {/* Fixed Header with Month Navigation */}
        <div className="flex-shrink-0 bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Hotel Timeline View</h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => scrollTimeline('left')}
                disabled={!canScrollLeft}
                className={`p-2 rounded-lg ${canScrollLeft ? 'bg-blue-50 hover:bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-400'}`}
              >
                ←
              </button>
              <button
                onClick={() => scrollTimeline('right')}
                disabled={!canScrollRight}
                className={`p-2 rounded-lg ${canScrollRight ? 'bg-blue-50 hover:bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-400'}`}
              >
                →
              </button>
            </div>
          </div>
        </div>

        {/* Fixed Date Header */}
        <div className="flex-shrink-0 flex border-b border-gray-200">
          {/* Fixed Room Header Corner */}
          <div className="w-80 flex-shrink-0 bg-gray-50 border-r border-gray-200 p-3">
            <div className="font-semibold text-gray-900">Rooms ({rooms.length})</div>
            <div className="text-xs text-gray-500">Click cells to book</div>
          </div>
          
          {/* Scrollable Date Header */}
          <div className="flex-1 overflow-hidden">
            <div
              ref={headerScrollRef}
              className="flex transition-transform duration-200"
            >
              {timelineDates.map((date) => (
                <div
                  key={date.key}
                  className={`w-24 flex-shrink-0 p-3 text-center border-r border-gray-200 ${
                    date.isToday ? 'bg-blue-100 border-blue-300' : 'bg-gray-50'
                  }`}
                >
                  <div className={`font-semibold ${date.isToday ? 'text-blue-800' : 'text-gray-900'}`}>
                    {date.day}
                  </div>
                  <div className={`text-xs ${date.isToday ? 'text-blue-600' : 'text-gray-500'}`}>
                    {date.weekday}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Fixed Room Column */}
          <div className="w-80 flex-shrink-0 border-r border-gray-200 overflow-y-auto">
            {rooms.map((room) => (
              <div key={room.id} className="border-b border-gray-200 p-4 bg-white hover:bg-gray-50">
                <div className="font-semibold text-gray-900 mb-2">Room {room.room_number}</div>
                <div className="space-y-1 text-sm">
                  <div className="text-gray-600">{room.room_type}</div>
                  <div className="text-gray-500">Floor {room.floor} • Max {room.max_occupancy} guests</div>
                  <div className="flex items-center space-x-2">
                    <span className={`w-2 h-2 rounded-full ${
                      room.status === 'available' ? 'bg-green-500' :
                      room.status === 'occupied' ? 'bg-red-500' :
                      room.status === 'maintenance' ? 'bg-orange-500' : 'bg-yellow-500'
                    }`} />
                    <span className="text-xs capitalize">{room.status}</span>
                  </div>
                  {room.base_price && (
                    <div className="text-green-600 font-medium">₹{room.base_price}/night</div>
                  )}
                </div>
                
                {/* Room Bookings List */}
                {bookingsByRoom[room.id] && bookingsByRoom[room.id].length > 0 && (
                  <div className="mt-3 space-y-1">
                    <div className="text-xs font-medium text-gray-700">Current Bookings:</div>
                    {bookingsByRoom[room.id].slice(0, 2).map((booking) => (
                      <div key={booking.id} className="text-xs bg-blue-50 p-2 rounded">
                        <div className="font-medium">{booking.customer_name || 'Guest'}</div>
                        <div className="text-gray-600">
                          {booking.number_of_guests || 1} guests • {Math.ceil((new Date(booking.check_out_date) - new Date(booking.check_in_date)) / (1000 * 60 * 60 * 24))} nights
                        </div>
                        <div className="text-gray-500">
                          {new Date(booking.check_in_date).toLocaleDateString()} - {new Date(booking.check_out_date).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Scrollable Timeline Grid */}
          <div
            ref={timelineScrollRef}
            className="flex-1 overflow-auto"
            onScroll={handleTimelineScroll}
            onWheel={handleWheelScroll}
          >
            <div style={{ minWidth: `${timelineDates.length * 96}px` }}>
              {rooms.map((room) => (
                <div key={room.id} className="flex border-b border-gray-200" style={{ height: '120px' }}>
                  {timelineDates.map((date) => {
                    const dateBookings = timelineBookings[room.id]?.[date.key] || [];
                    const hasBooking = dateBookings.length > 0;
                    
                    return (
                      <div
                        key={`${room.id}-${date.key}`}
                        className={`w-24 flex-shrink-0 border-r border-gray-200 p-1 cursor-pointer hover:bg-blue-50 ${
                          date.isToday ? 'bg-blue-25' : 'bg-white'
                        } ${hasBooking ? 'bg-green-50' : ''}`}
                        onClick={() => onDateClick && onDateClick(date.date, room)}
                        title={`${hasBooking ? 'Booked' : 'Available'} - Room ${room.room_number} on ${date.date.toLocaleDateString()}`}
                      >
                        {hasBooking && (
                          <div className="space-y-1">
                            {dateBookings.slice(0, 2).map((booking, idx) => (
                              <div
                                key={`${booking.id}-${idx}`}
                                className={`text-xs px-2 py-1 rounded cursor-pointer ${getBookingStatusColor(booking.status)}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onBookingClick && onBookingClick(booking);
                                }}
                                onMouseEnter={(e) => onBookingHover && onBookingHover(booking, e)}
                                onMouseLeave={(e) => onBookingHover && onBookingHover(null, e)}
                              >
                                <div className="truncate font-medium">
                                  {booking.customer_name || 'Guest'}
                                </div>
                                {booking.isStartDate && (
                                  <div className="text-xs opacity-75">Check-in</div>
                                )}
                                {booking.isEndDate && (
                                  <div className="text-xs opacity-75">Check-out</div>
                                )}
                              </div>
                            ))}
                            {dateBookings.length > 2 && (
                              <div className="text-xs text-blue-600 px-2">+{dateBookings.length - 2} more</div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Status Legend */}
        {renderStatusLegend('timeline')}
      </div>
    );
  }

  // Enhanced Timeline View with Professional Layout
  if (calendarViewMode === 'timeline') {
    if (!rooms.length || !dateColumns.length) {
      return (
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">No data to display</p>
        </div>
      );
    }

    return (
      <div className="h-full flex flex-col bg-white">
        {/* Fixed Header with Navigation - Consistent with Monthly View */}
        <div className="flex-shrink-0 bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => scrollTimeline('left')}
                disabled={!canScrollLeft}
                className={`p-2 rounded-lg transition-colors ${
                  canScrollLeft
                    ? 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                    : 'text-gray-400 cursor-not-allowed'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <h2 className="text-xl font-semibold text-gray-900">
                Timeline View - {viewType.charAt(0).toUpperCase() + viewType.slice(1)}
              </h2>

              <button
                onClick={() => scrollTimeline('right')}
                disabled={!canScrollRight}
                className={`p-2 rounded-lg transition-colors ${
                  canScrollRight
                    ? 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                    : 'text-gray-400 cursor-not-allowed'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">{rooms.length} rooms</span>
              <div className="w-px h-4 bg-gray-300"></div>
              <span className="text-sm text-gray-600">{dateColumns.length} {viewType === 'month' ? 'days' : viewType === 'quarter' ? 'weeks' : 'months'}</span>
            </div>
          </div>
        </div>

        {/* Horizontally Scrollable Date Header - Fixed Top */}
        <div className="flex-shrink-0 flex border-b border-gray-200 bg-gray-50 sticky top-0 z-20">
          {/* Fixed Room Header */}
          <div className="w-80 flex-shrink-0 border-r border-gray-200 p-3 bg-gray-50">
            <div className="font-semibold text-gray-900">Room Details</div>
            <div className="text-xs text-gray-500 mt-1">Type • Floor • Occupancy • Price</div>
          </div>

          {/* Horizontally Scrollable Date Header */}
          <div
            className="flex-1 overflow-x-auto bg-gray-50"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#CBD5E0 #F7FAFC'
            }}
            onScroll={(e) => {
              // Sync timeline content scroll with header scroll
              if (timelineScrollRef.current) {
                timelineScrollRef.current.scrollLeft = e.target.scrollLeft;
              }
            }}
          >
            <style jsx>{`
              .date-header-scroll::-webkit-scrollbar {
                height: 6px;
              }
              .date-header-scroll::-webkit-scrollbar-track {
                background: #F7FAFC;
                border-radius: 3px;
              }
              .date-header-scroll::-webkit-scrollbar-thumb {
                background: #CBD5E0;
                border-radius: 3px;
              }
              .date-header-scroll::-webkit-scrollbar-thumb:hover {
                background: #A0AEC0;
              }
            `}</style>
            <div 
              className="flex date-header-scroll"
              style={{ minWidth: `${dateColumns.length * 80}px` }}
            >
              {dateColumns.map((column) => {
                const isWeekend = viewType === 'month' && column.date && (column.date.getDay() === 0 || column.date.getDay() === 6);
                const isToday = viewType === 'month' && column.date && column.date.toDateString() === new Date().toDateString();

                return (
                  <div
                    key={column.key}
                    className={`w-20 flex-shrink-0 p-2 text-center border-r border-gray-200 relative ${
                      isToday
                        ? 'bg-blue-100 border-blue-300'
                        : isWeekend
                        ? 'bg-orange-50'
                        : 'bg-gray-50'
                    }`}
                  >
                    <div className={`text-sm font-medium ${
                      isToday ? 'text-blue-800' : isWeekend ? 'text-orange-800' : 'text-gray-900'
                    }`}>
                      {viewType === 'month' && column.date ? column.date.getDate() : column.label}
                    </div>
                    <div className={`text-xs mt-1 ${
                      isToday ? 'text-blue-600' : isWeekend ? 'text-orange-600' : 'text-gray-500'
                    }`}>
                      {viewType === 'month' && column.date
                        ? column.date.toLocaleDateString('en-US', { weekday: 'short' })
                        : column.fullLabel
                      }
                    </div>
                    {isToday && (
                      <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Timeline Content with Independent Scrollbars */}
        <div className="flex-1 flex overflow-hidden max-h-[600px]">
          {/* Room Column with Independent Vertical Scroll */}
          <div
            className="w-80 flex-shrink-0 border-r border-gray-200 bg-white overflow-y-auto room-scroll"
            style={{ scrollbarWidth: 'thin', scrollbarColor: '#CBD5E0 #F7FAFC' }}
            onScroll={(e) => {
              // Sync booking grid vertical scroll with room column scroll
              if (timelineScrollRef.current) {
                timelineScrollRef.current.scrollTop = e.target.scrollTop;
              }
            }}
          >
            <style jsx>{`
              .room-scroll::-webkit-scrollbar {
                width: 6px;
              }
              .room-scroll::-webkit-scrollbar-track {
                background: #F7FAFC;
                border-radius: 3px;
              }
              .room-scroll::-webkit-scrollbar-thumb {
                background: #CBD5E0;
                border-radius: 3px;
              }
              .room-scroll::-webkit-scrollbar-thumb:hover {
                background: #A0AEC0;
              }
            `}</style>
            {rooms.map((room, roomIndex) => (
              <div key={room.id} className={`border-b border-gray-200 p-4 hover:bg-gray-50 transition-colors ${
                roomIndex % 2 === 0 ? 'bg-white' : 'bg-gray-25'
              }`} style={{ minHeight: '80px' }}>
                <div className="flex flex-col space-y-2">
                  <div className="font-bold text-lg text-gray-900">Room {room.room_number}</div>
                  <div className="text-sm text-gray-700 bg-gray-100 px-2 py-1 rounded inline-block">{room.room_type}</div>
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span>Floor {room.floor}</span>
                    <span>Max {room.max_occupancy}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className={`w-2 h-2 rounded-full ${
                        room.status === 'available' ? 'bg-green-500' : room.status === 'occupied' ? 'bg-red-500' : room.status === 'maintenance' ? 'bg-orange-500' : 'bg-yellow-500'
                      }`} />
                      <span className="text-xs capitalize text-gray-700">{room.status}</span>
                    </div>
                    {room.base_price && <span className="text-xs text-green-600 font-medium">₹{room.base_price}/night</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Booking Grid with Synchronized Scrolling */}
          <div
            ref={timelineScrollRef}
            className="flex-1 overflow-auto booking-grid"
            style={{ scrollbarWidth: 'thin', scrollbarColor: '#CBD5E0 #F7FAFC' }}
            onScroll={(e) => {
              // Sync header horizontal scroll
              const headerScroll = e.target.parentElement.previousElementSibling.querySelector('.date-header-scroll').parentElement;
              if (headerScroll) {
                headerScroll.scrollLeft = e.target.scrollLeft;
              }
              // Sync room column vertical scroll
              const roomColumn = e.target.parentElement.previousElementSibling;
              if (roomColumn) {
                roomColumn.scrollTop = e.target.scrollTop;
              }
              handleTimelineScroll();
            }}
            onWheel={handleWheelScroll}
          >
            <style jsx>{`
              .booking-grid::-webkit-scrollbar {
                width: 6px;
                height: 6px;
              }
              .booking-grid::-webkit-scrollbar-track {
                background: #F7FAFC;
                border-radius: 3px;
              }
              .booking-grid::-webkit-scrollbar-thumb {
                background: #CBD5E0;
                border-radius: 3px;
              }
              .booking-grid::-webkit-scrollbar-thumb:hover {
                background: #A0AEC0;
              }
              .booking-grid::-webkit-scrollbar-corner {
                background: #F7FAFC;
              }
            `}</style>
            <div style={{ minWidth: `${dateColumns.length * 80}px` }}>
              {rooms.map((room, roomIndex) => (
                <div key={room.id} className={`flex border-b border-gray-200 relative ${
                  roomIndex % 2 === 0 ? 'bg-white' : 'bg-gray-25'
                }`} style={{ minHeight: '80px' }}>
                  {dateColumns.map((column) => {
                    const isWeekend = viewType === 'month' && column.date && (column.date.getDay() === 0 || column.date.getDay() === 6);
                    const isToday = viewType === 'month' && column.date && column.date.toDateString() === new Date().toDateString();
                    return (
                      <div key={`${room.id}-${column.key}`} className={`w-20 flex-shrink-0 border-r border-gray-200 cursor-pointer hover:bg-blue-50 transition-colors ${
                        isToday ? 'bg-blue-50 border-blue-300' : isWeekend ? 'bg-orange-25' : 'hover:bg-gray-50'
                      }`} onDoubleClick={() => onDateClick && onDateClick(column.date, room)} title={`Double-click to create booking for Room ${room.room_number}`}>
                        {isToday && <div className="absolute top-1 left-1 w-2 h-2 bg-blue-500 rounded-full opacity-75"></div>}
                      </div>
                    );
                  })}
                  {bookingsByRoom[room.id] && bookingsByRoom[room.id].map((booking, bookingIndex) => {
                    const style = calculateBookingStyle(booking, dateColumns);
                    const statusColor = getBookingStatusColor(booking.status);
                    const nights = Math.ceil((new Date(booking.check_out_date) - new Date(booking.check_in_date)) / (1000 * 60 * 60 * 24));
                    if (!style || style.left === undefined || style.width === undefined) return null;
                    const enhancedStyle = {
                      position: 'absolute',
                      left: style.left,
                      width: style.width,
                      top: `${12 + bookingIndex * 24}px`,
                      height: '20px',
                      zIndex: 10 + bookingIndex,
                      minWidth: '60px'
                    };
                    return (
                      <div key={booking.id} className={`${statusColor} rounded px-2 py-1 cursor-pointer hover:opacity-90 transition-all duration-200 shadow-sm border hover:shadow-md`} style={enhancedStyle}
                        onClick={(e) => { e.stopPropagation(); onBookingClick && onBookingClick(booking); }}
                        onMouseEnter={(e) => onBookingHover && onBookingHover(booking, e)}
                        onMouseLeave={(e) => onBookingHover && onBookingHover(null, e)}
                        title={`${booking.customer_name || 'Guest'} - ${nights} nights - ₹${booking.total_amount || 'N/A'} - Status: ${booking.status}`}>
                        <div className="flex items-center justify-between text-xs font-medium truncate">
                          <span className="truncate flex-1">{booking.customer_name || 'Guest'}</span>
                          <span className="ml-1 flex-shrink-0 opacity-75">₹{booking.total_amount || 'N/A'}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Status Legend - Consistent with Monthly View */}
        {renderStatusLegend('timeline')}
      </div>
    );
  }

  // Render Monthly Grid View (Google Calendar style)
  return (
    <div className="h-full flex flex-col bg-white">
      {/* Fixed Calendar Header with Navigation */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 p-4">
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

      {/* Fixed Days of Week Header */}
      <div className="flex-shrink-0 grid grid-cols-7 border-b border-gray-200 bg-gray-50">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="p-2 sm:p-3 text-center text-xs sm:text-sm font-medium text-gray-500">
            <span className="hidden sm:inline">{day}</span>
            <span className="sm:hidden">{day.charAt(0)}</span>
          </div>
        ))}
      </div>

      {/* Scrollable Calendar Grid Body */}
      <div className="flex-1 overflow-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
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
                  <div
                    className="text-xs text-blue-600 px-1 sm:px-2 cursor-pointer hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDateBookingsClick && onDateBookingsClick(day.date, bookingsByDate[day.key]);
                    }}
                    title="Click to view all bookings for this date"
                  >
                    +{bookingsByDate[day.key].length - (window.innerWidth < 768 ? 2 : 3)} more
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Status Legend */}
      {renderStatusLegend('monthly')}
    </div>
  );
};

export default CalendarGrid;

import { useMemo, useState, useRef, useEffect } from 'react';
import DraggableBookingBar from './DraggableBookingBar';

const CalendarGrid = ({ rooms, bookings, dateRange, viewType, onBookingHover, onBookingClick, onDateClick, onBookingUpdate, calendarViewMode = 'monthly' }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Timeline scrolling state and refs
  const timelineScrollRef = useRef(null);
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
      const scrollAmount = 320; // 4 columns * 80px each
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
              <span className="font-medium">✅ Confirmed</span>
            </div>
            <div className="flex items-center space-x-2 bg-white px-2 py-1 rounded-lg shadow-sm">
              <div className="w-4 h-4 rounded bg-blue-500 border border-blue-600"></div>
              <span className="font-medium">🟦 Checked In</span>
            </div>
            <div className="flex items-center space-x-2 bg-white px-2 py-1 rounded-lg shadow-sm">
              <div className="w-4 h-4 rounded bg-yellow-500 border border-yellow-600"></div>
              <span className="font-medium">🟨 Pending</span>
            </div>
            <div className="flex items-center space-x-2 bg-white px-2 py-1 rounded-lg shadow-sm">
              <div className="w-4 h-4 rounded bg-red-500 border border-red-600"></div>
              <span className="font-medium">🟥 Checked Out</span>
            </div>
            <div className="flex items-center space-x-2 bg-white px-2 py-1 rounded-lg shadow-sm">
              <div className="w-4 h-4 rounded bg-orange-500 border border-orange-600"></div>
              <span className="font-medium">🟧 Booked</span>
            </div>
            <div className="flex items-center space-x-2 bg-white px-2 py-1 rounded-lg shadow-sm">
              <div className="w-4 h-4 rounded bg-gray-500 border border-gray-600"></div>
              <span className="font-medium">⬜ Cancelled</span>
            </div>
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-600 bg-white px-3 py-1 rounded-lg inline-block">
          💡 <strong>Tip:</strong> {tipText}
        </div>
      </div>
    );
  };

  // Enhanced Timeline View with Booking Date Flow
  if (calendarViewMode === 'timeline') {
    if (!rooms.length || !dateColumns.length) {
      return (
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">No data to display</p>
        </div>
      );
    }

    // Enhanced responsive column width calculation for timeline view
    const getTimelineColumnWidth = () => {
      const isMobile = window.innerWidth < 768;
      const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;

      switch (viewType) {
        case 'month':
          if (isMobile) {
            return dateColumns.length > 31 ? 'min-w-10 w-10' : 'min-w-12 w-12'; // Daily columns - mobile
          } else if (isTablet) {
            return dateColumns.length > 31 ? 'min-w-12 w-12' : 'min-w-14 w-14'; // Daily columns - tablet
          } else {
            return dateColumns.length > 31 ? 'min-w-14 w-14' : 'min-w-16 w-16'; // Daily columns - desktop
          }
        case 'quarter':
          return isMobile ? 'min-w-16 w-16' : isTablet ? 'min-w-18 w-18' : 'min-w-20 w-20'; // Weekly columns
        case 'year':
          return isMobile ? 'min-w-20 w-20' : isTablet ? 'min-w-22 w-22' : 'min-w-24 w-24'; // Monthly columns
        default:
          return isMobile ? 'min-w-12 w-12' : isTablet ? 'min-w-14 w-14' : 'min-w-16 w-16';
      }
    };

    const columnWidth = getTimelineColumnWidth();

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden relative">
        {/* Navigation Controls */}
        <div className="absolute top-4 right-4 z-40 flex space-x-2">
          <button
            onClick={() => scrollTimeline('left')}
            disabled={!canScrollLeft}
            className={`p-2 rounded-full shadow-lg transition-all duration-200 ${
              canScrollLeft
                ? 'bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 cursor-pointer'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
            title="Scroll left"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => scrollTimeline('right')}
            disabled={!canScrollRight}
            className={`p-2 rounded-full shadow-lg transition-all duration-200 ${
              canScrollRight
                ? 'bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 cursor-pointer'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
            title="Scroll right"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Enhanced Scroll Indicator with Position */}
        {isScrolling && timelineScrollRef.current && (
          <div className="absolute top-16 right-4 z-40 bg-black bg-opacity-75 text-white text-xs px-3 py-2 rounded-lg shadow-lg">
            <div className="flex items-center space-x-2">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              <span>
                {Math.round((timelineScrollRef.current.scrollLeft / (timelineScrollRef.current.scrollWidth - timelineScrollRef.current.clientWidth)) * 100)}%
              </span>
            </div>
          </div>
        )}

        {/* Scroll Progress Bar */}
        {dateColumns.length > 10 && (
          <div className="absolute bottom-0 left-64 right-0 h-1 bg-gray-200 z-30">
            <div
              className="h-full bg-blue-500 transition-all duration-200"
              style={{
                width: timelineScrollRef.current
                  ? `${(timelineScrollRef.current.clientWidth / timelineScrollRef.current.scrollWidth) * 100}%`
                  : '0%',
                transform: timelineScrollRef.current
                  ? `translateX(${(timelineScrollRef.current.scrollLeft / (timelineScrollRef.current.scrollWidth - timelineScrollRef.current.clientWidth)) * (timelineScrollRef.current.clientWidth - (timelineScrollRef.current.clientWidth / timelineScrollRef.current.scrollWidth) * timelineScrollRef.current.clientWidth)}px)`
                  : 'translateX(0px)'
              }}
            />
          </div>
        )}

        {/* Unified Timeline Container with Enhanced Scrolling */}
        <div
          ref={timelineScrollRef}
          className="timeline-container overflow-x-auto overflow-y-visible scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 focus:outline-none"
          style={{
            touchAction: 'pan-x pan-y',
            scrollbarWidth: 'thin',
            scrollbarColor: '#CBD5E0 #F7FAFC'
          }}
          onScroll={handleTimelineScroll}
          onWheel={handleWheelScroll}
          tabIndex={0}
          role="region"
          aria-label="Timeline scroll area - use arrow keys to navigate"
        >
          <div style={{ minWidth: `${64 * 4 + dateColumns.length * 80}px` }}> {/* Fixed minimum width calculation */}

            {/* Enhanced Timeline Header - Scrolls with content */}
            <div className="sticky top-0 z-20 bg-white border-b-2 border-gray-300 shadow-lg">
              <div className="flex">
                {/* Room Details Header - Sticky Left Column */}
                <div className="w-64 flex-shrink-0 bg-gradient-to-r from-gray-100 to-gray-50 border-r-2 border-gray-300 p-4 sticky left-0 z-30">
                  <div className="font-bold text-gray-900 text-base">Room Details</div>
                  <div className="text-xs text-gray-600 mt-1">
                    {rooms.length} room{rooms.length !== 1 ? 's' : ''} • {viewType} view
                  </div>
                  <div className="text-xs text-blue-600 mt-1 font-medium">
                    Drag bars to reschedule
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    ← → keys or scroll to navigate
                  </div>
                </div>

                {/* Enhanced Date columns header - Scrolls horizontally */}
                <div className="flex">
                  {dateColumns.map((column, index) => {
                    const isWeekend = viewType === 'month' && column.date && column.date instanceof Date && (column.date.getDay() === 0 || column.date.getDay() === 6);
                    const isToday = viewType === 'month' && column.date && column.date instanceof Date && column.date.toDateString() === new Date().toDateString();

                    return (
                      <div
                        key={column.key}
                        className={`w-20 flex-shrink-0 p-3 text-center border-r border-gray-200 transition-colors ${
                          isToday
                            ? 'bg-blue-100 border-blue-300'
                            : isWeekend
                              ? 'bg-orange-50'
                              : 'bg-gray-50'
                        }`}
                      >
                      <div className={`text-sm font-bold ${
                        isToday
                          ? 'text-blue-800'
                          : isWeekend
                            ? 'text-orange-800'
                            : 'text-gray-800'
                      }`}>
                        {viewType === 'month'
                          ? (column.date && column.date instanceof Date ? column.date.getDate() : '')
                          : (column.label || '')
                        }
                      </div>
                      <div className={`text-xs mt-1 ${
                        isToday
                          ? 'text-blue-600 font-medium'
                          : isWeekend
                            ? 'text-orange-600 font-medium'
                            : 'text-gray-500'
                      }`}>
                        {viewType === 'month'
                          ? (column.date && column.date instanceof Date
                              ? column.date.toLocaleDateString('en-US', { weekday: 'short' })
                              : ''
                            )
                          : (column.fullLabel || '')
                        }
                      </div>
                      {isToday && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full mx-auto mt-1"></div>
                      )}
                    </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Enhanced Room Rows with Professional Booking Flow */}
            <div className="relative">
              {rooms.map((room, roomIndex) => (
                <div
                  key={room.id}
                  className={`flex border-b border-gray-200 hover:bg-blue-25 transition-colors ${
                    roomIndex % 2 === 0 ? 'bg-white' : 'bg-gray-25'
                  }`}
                  style={{ minHeight: '88px' }} // Increased height for better booking bar visibility
                >
                  {/* Enhanced Room Info Column - Sticky Left */}
                  <div className="w-64 flex-shrink-0 border-r-2 border-gray-300 p-4 bg-white sticky left-0 z-10 shadow-sm">
                <div className="flex flex-col space-y-2">
                  {/* Room Number - Primary */}
                  <div className="font-bold text-lg text-gray-900 mb-1">
                    Room {room.room_number}
                  </div>

                  {/* Room Type */}
                  <div className="text-sm font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded">
                    {room.room_type}
                  </div>

                  {/* Room Details */}
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span>Floor {room.floor}</span>
                    <span>Max: {room.max_occupancy}</span>
                  </div>

                  {/* Room Status */}
                  <div className="flex items-center space-x-2">
                    <span
                      className={`inline-block w-3 h-3 rounded-full shadow-sm ${
                        room.status === 'available'
                          ? 'bg-green-500'
                          : room.status === 'occupied'
                          ? 'bg-red-500'
                          : room.status === 'maintenance'
                          ? 'bg-orange-500'
                          : 'bg-yellow-500'
                      }`}
                    />
                    <span className="text-xs font-medium text-gray-700 capitalize">
                      {room.status}
                    </span>
                  </div>

                  {/* Base Price */}
                  {room.base_price && (
                    <div className="text-xs text-green-600 font-medium">
                      ₹{room.base_price}/night
                    </div>
                  )}
                </div>
              </div>

                  {/* Enhanced Booking Timeline Area */}
                  <div className="flex-1 relative h-20">
                    {/* Background Date Grid */}
                    <div className="flex h-full">
                      {dateColumns.map((column, colIndex) => {
                        const isWeekend = viewType === 'month' && column.date && column.date instanceof Date && (column.date.getDay() === 0 || column.date.getDay() === 6);
                        const isToday = viewType === 'month' && column.date && column.date instanceof Date && column.date.toDateString() === new Date().toDateString();

                        return (
                          <div
                            key={`${room.id}-${column.key}`}
                            className={`w-20 flex-shrink-0 border-r border-gray-200 cursor-pointer hover:bg-blue-50 transition-colors relative ${
                              isToday
                                ? 'bg-blue-50 border-blue-300'
                                : isWeekend
                                ? 'bg-orange-25'
                                : 'bg-white hover:bg-gray-50'
                            }`}
                            onDoubleClick={() => onDateClick && onDateClick(column.date, room)}
                            title={`Double-click to create booking for Room ${room.room_number} on ${column.date ? column.date.toLocaleDateString() : column.label}`}
                          >
                            {/* Subtle grid lines for better alignment */}
                            <div className="absolute inset-0 border-l border-gray-100"></div>
                          </div>
                        );
                      })}
                    </div>

                  {/* Enhanced Draggable Booking Bars with Professional Overlap Handling */}
                  {bookingsByRoom[room.id] && bookingsByRoom[room.id].map((booking, bookingIndex) => {
                    const style = calculateBookingStyle(booking, dateColumns);
                    const statusColor = getBookingStatusColor(booking.status);

                    // Enhanced vertical stacking for overlapping bookings
                    const verticalOffset = bookingIndex * 22; // 22px offset per booking for better visibility
                    const enhancedStyle = {
                      ...style,
                      top: `${8 + verticalOffset}px`, // Start 8px from top
                      height: '18px', // Consistent height for all booking bars
                      zIndex: 20 + bookingIndex, // Higher z-index for later bookings
                      minWidth: style.width || '60px' // Ensure minimum width for visibility
                    };

                    // Skip rendering if style calculation failed
                    if (!style || style.left === undefined || style.width === undefined) {
                      return null;
                    }

                    return (
                      <DraggableBookingBar
                        key={booking.id}
                        booking={booking}
                        style={enhancedStyle}
                        statusColor={statusColor}
                        dateColumns={dateColumns}
                        columnWidth={columnWidth}
                        onBookingClick={onBookingClick}
                        onBookingHover={onBookingHover}
                        onBookingUpdate={onBookingUpdate}
                        roomId={room.id}
                      />
                    );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Timeline Status Legend */}
        {renderStatusLegend('timeline')}
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

      {/* Monthly Status Legend */}
      {renderStatusLegend('monthly')}
    </div>
  );
};

export default CalendarGrid;

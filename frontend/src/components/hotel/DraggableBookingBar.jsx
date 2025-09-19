import React, { useState, useRef, useEffect } from 'react';

const DraggableBookingBar = ({
  booking,
  style,
  statusColor,
  dateColumns,
  columnWidth,
  onBookingClick,
  onBookingHover,
  onBookingUpdate,
  roomId
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState(null);
  const [dragStart, setDragStart] = useState({ x: 0, originalLeft: 0 });
  const [lastClickTime, setLastClickTime] = useState(0);
  const barRef = useRef(null);

  // Calculate date index from position
  const getDateIndexFromPosition = (x, containerRect) => {
    const relativeX = x - containerRect.left;
    const columnWidthPx = containerRect.width / dateColumns.length;
    return Math.floor(relativeX / columnWidthPx);
  };

  // Handle drag start (mouse and touch)
  const handleMouseDown = (e) => {
    if (e.target.classList.contains('resize-handle')) return;

    e.preventDefault();
    setIsDragging(true);

    const rect = barRef.current.getBoundingClientRect();
    const containerRect = barRef.current.parentElement.getBoundingClientRect();

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;

    setDragStart({
      x: clientX,
      originalLeft: rect.left - containerRect.left
    });
  };

  // Handle touch start
  const handleTouchStart = (e) => {
    handleMouseDown(e);
  };

  // Handle resize start
  const handleResizeStart = (e, direction) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeDirection(direction);
    
    const rect = barRef.current.getBoundingClientRect();
    setDragStart({
      x: e.clientX,
      originalLeft: rect.left,
      originalWidth: rect.width
    });
  };

  // Handle mouse/touch move
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging && !isResizing) return;

      const containerRect = barRef.current.parentElement.getBoundingClientRect();
      const columnWidthPx = containerRect.width / dateColumns.length;

      const clientX = e.touches ? e.touches[0].clientX : e.clientX;

      if (isDragging) {
        const deltaX = clientX - dragStart.x;
        const newLeft = dragStart.originalLeft + deltaX;
        const newDateIndex = Math.floor(newLeft / columnWidthPx);

        if (newDateIndex >= 0 && newDateIndex < dateColumns.length) {
          barRef.current.style.left = `${(newDateIndex * 100) / dateColumns.length}%`;
        }
      } else if (isResizing) {
        const deltaX = clientX - dragStart.x;
        
        if (resizeDirection === 'left') {
          const newLeft = dragStart.originalLeft + deltaX;
          const newDateIndex = Math.floor(newLeft / columnWidthPx);
          
          if (newDateIndex >= 0) {
            const currentRight = parseFloat(style.left) + parseFloat(style.width);
            const newWidth = currentRight - (newDateIndex * 100) / dateColumns.length;
            
            if (newWidth > (100 / dateColumns.length)) { // Minimum 1 day
              barRef.current.style.left = `${(newDateIndex * 100) / dateColumns.length}%`;
              barRef.current.style.width = `${newWidth}%`;
            }
          }
        } else if (resizeDirection === 'right') {
          const currentLeft = parseFloat(style.left);
          const newWidth = (deltaX / containerRect.width) * 100 + parseFloat(style.width);
          
          if (newWidth > (100 / dateColumns.length) && currentLeft + newWidth <= 100) {
            barRef.current.style.width = `${newWidth}%`;
          }
        }
      }
    };

    const handleMouseUp = () => {
      if (isDragging || isResizing) {
        const containerRect = barRef.current.parentElement.getBoundingClientRect();
        const rect = barRef.current.getBoundingClientRect();
        const columnWidthPx = containerRect.width / dateColumns.length;
        
        const startIndex = Math.floor((rect.left - containerRect.left) / columnWidthPx);
        const endIndex = Math.floor((rect.right - containerRect.left) / columnWidthPx);
        
        if (startIndex >= 0 && endIndex < dateColumns.length && startIndex < endIndex) {
          const newCheckIn = dateColumns[startIndex].date;
          const newCheckOut = new Date(dateColumns[endIndex].date);
          newCheckOut.setDate(newCheckOut.getDate() + 1); // Add one day for checkout
          
          // Update booking dates
          if (onBookingUpdate) {
            onBookingUpdate(booking.id, {
              check_in_date: newCheckIn.toISOString().split('T')[0],
              check_out_date: newCheckOut.toISOString().split('T')[0]
            });
          }
        } else {
          // Reset to original position if invalid
          barRef.current.style.left = style.left;
          barRef.current.style.width = style.width;
        }
      }
      
      setIsDragging(false);
      setIsResizing(false);
      setResizeDirection(null);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleMouseMove, { passive: false });
      document.addEventListener('touchend', handleMouseUp);
      document.body.style.cursor = isDragging ? 'grabbing' : 'ew-resize';
      document.body.style.userSelect = 'none';
      document.body.style.touchAction = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleMouseMove);
      document.removeEventListener('touchend', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.body.style.touchAction = '';
    };
  }, [isDragging, isResizing, dragStart, resizeDirection, style, dateColumns, booking.id, onBookingUpdate]);

  return (
    <div
      ref={barRef}
      className={`absolute top-3 bottom-3 rounded-lg border-2 ${statusColor} cursor-grab hover:shadow-lg hover:scale-105 transition-all duration-200 flex items-center px-3 z-10 group ${
        isDragging ? 'cursor-grabbing shadow-2xl scale-110' : ''
      } ${isResizing ? 'cursor-ew-resize' : ''}`}
      style={style}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onClick={(e) => {
        if (!isDragging && !isResizing) {
          const now = Date.now();
          // Prevent rapid multiple clicks (debounce with 300ms)
          if (now - lastClickTime < 300) {
            e.preventDefault();
            e.stopPropagation();
            return;
          }

          setLastClickTime(now);
          e.preventDefault();
          e.stopPropagation();
          onBookingClick && onBookingClick(booking);
        }
      }}
      onDoubleClick={(e) => {
        // Prevent double-click from propagating to parent date cells
        e.preventDefault();
        e.stopPropagation();
      }}
      onMouseEnter={(e) => !isDragging && !isResizing && onBookingHover && onBookingHover(booking, e)}
      onMouseLeave={(e) => !isDragging && !isResizing && onBookingHover && onBookingHover(null, e)}
      title={`${booking.guest_info?.firstName || booking.customer_name || 'Guest'}\n${booking.total_guests || booking.adults || 1} guest${(booking.total_guests || booking.adults || 1) !== 1 ? 's' : ''} • ${style.nights || booking.nights || 1} night${(style.nights || booking.nights || 1) !== 1 ? 's' : ''}\nRate Type: ${booking.rate_type || 'EP'}\nStatus: ${booking.status || 'pending'}\nDrag to reschedule • Resize edges to extend/shorten`}
    >
      {/* Enhanced Booking Content */}
      <div className="text-xs text-white font-medium truncate flex-1 pointer-events-none">
        <div className="truncate font-bold">
          {booking.guest_info?.firstName || booking.customer_name || 'Guest'}
        </div>
        <div className="text-xs opacity-90 truncate">
          {booking.total_guests || booking.adults || 1} guest{(booking.total_guests || booking.adults || 1) !== 1 ? 's' : ''} • {style.nights || booking.nights || 1}n
        </div>
        {/* Show date range for longer bookings - Display actual stay dates */}
        {(style.nights || booking.nights || 1) > 1 && (
          <div className="text-xs opacity-75 truncate">
            {(() => {
              const checkInDate = new Date(booking.check_in_date);
              const checkOutDate = new Date(booking.check_out_date);
              // Last night of stay is check-out date minus 1 day
              const lastStayDate = new Date(checkOutDate);
              lastStayDate.setDate(lastStayDate.getDate() - 1);

              return `${checkInDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${lastStayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
            })()}
          </div>
        )}
      </div>
      
      {/* Left Resize Handle */}
      <div 
        className="resize-handle absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize bg-black bg-opacity-20 opacity-0 group-hover:opacity-100 transition-opacity rounded-l-lg"
        onMouseDown={(e) => handleResizeStart(e, 'left')}
      />
      
      {/* Right Resize Handle */}
      <div 
        className="resize-handle absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize bg-black bg-opacity-20 opacity-0 group-hover:opacity-100 transition-opacity rounded-r-lg"
        onMouseDown={(e) => handleResizeStart(e, 'right')}
      />
      
      {/* Drag indicator */}
      {isDragging && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded pointer-events-none">
          Drag to reschedule
        </div>
      )}
      
      {/* Resize indicator */}
      {isResizing && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded pointer-events-none">
          Resize to extend/shorten
        </div>
      )}
    </div>
  );
};

export default DraggableBookingBar;

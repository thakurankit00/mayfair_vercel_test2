// Unified Reservation API Service for Today's Reservations Widget
import axios from 'axios';
import { format, isToday, parseISO } from 'date-fns';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    console.error('Reservation API Error:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    const errorMessage = error.response?.data?.error?.message || error.message || 'An error occurred';
    return Promise.reject(new Error(errorMessage));
  }
);

// Transform room booking data
const transformRoomBooking = (booking) => {
  const checkInDate = parseISO(booking.check_in_date);
  
  return {
    id: booking.id,
    type: 'room',
    reference: booking.booking_reference || `#R${booking.id.slice(-6).toUpperCase()}`,
    title: 'Check-in',
    guestName: booking.customer ? `${booking.customer.first_name} ${booking.customer.last_name}` : booking.primary_guest_name || 'Unknown Guest',
    roomNumber: booking.room?.room_number || 'N/A',
    roomType: booking.room?.roomType?.name || booking.room?.room_type || 'Standard',
    date: format(checkInDate, 'yyyy-MM-dd'),
    time: format(checkInDate, 'HH:mm'),
    details: `${booking.room?.room_type || 'Room'} ${booking.room?.room_number || ''}`,
    status: booking.status,
    guestCount: booking.adults + (booking.children || 0),
    _original: booking
  };
};

// Transform table reservation data
const transformTableReservation = (reservation) => {
  const reservationDate = parseISO(reservation.reservation_date);
  
  return {
    id: reservation.id,
    type: 'table',
    reference: reservation.reservation_reference || `#T${reservation.id.slice(-6).toUpperCase()}`,
    title: 'Dinner Reservation',
    guestName: reservation.user_first_name && reservation.user_last_name 
      ? `${reservation.user_first_name} ${reservation.user_last_name}`
      : 'Unknown Guest',
    tableNumber: reservation.table_number || 'N/A',
    date: format(reservationDate, 'yyyy-MM-dd'),
    time: reservation.reservation_time ? reservation.reservation_time.slice(0, 5) : '00:00',
    details: `Table ${reservation.table_number || 'N/A'} • ${reservation.party_size} guests`,
    status: reservation.status,
    guestCount: reservation.party_size,
    _original: reservation
  };
};

// Main API service
export const reservationApi = {
  // Fetch today's reservations (both room bookings and table reservations)
  async fetchTodayReservations() {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      
      // Fetch data from both endpoints in parallel
      const [roomBookingsResponse, tableReservationsResponse] = await Promise.all([
        api.get('/bookings', { 
          params: { 
            date_from: today, 
            date_to: today,
            limit: 50 
          } 
        }).catch(() => ({ data: { bookings: [] } })), // Fallback if endpoint fails
        
        api.get('/restaurant/reservations', { 
          params: { 
            date_from: today, 
            date_to: today,
            limit: 50 
          } 
        }).catch(() => ({ data: { reservations: [] } })) // Fallback if endpoint fails
      ]);

      // Transform and combine data
      const roomBookings = (roomBookingsResponse.data?.bookings || [])
        .filter(booking => {
          // Only include today's check-ins
          return isToday(parseISO(booking.check_in_date));
        })
        .map(transformRoomBooking);

      const tableReservations = (tableReservationsResponse.data?.reservations || [])
        .filter(reservation => {
          // Only include today's reservations
          return isToday(parseISO(reservation.reservation_date));
        })
        .map(transformTableReservation);
      
      // Combine and sort by time
      const allReservations = [...roomBookings, ...tableReservations]
        .sort((a, b) => {
          const timeA = new Date(`${a.date}T${a.time}`);
          const timeB = new Date(`${b.date}T${b.time}`);
          return timeA - timeB;
        });
      
      return {
        success: true,
        data: {
          reservations: allReservations,
          summary: {
            total: allReservations.length,
            roomBookings: roomBookings.length,
            tableReservations: tableReservations.length
          }
        }
      };
    } catch (error) {
      console.error('Failed to fetch today\'s reservations:', error);
      return {
        success: false,
        error: error.message,
        data: {
          reservations: [],
          summary: {
            total: 0,
            roomBookings: 0,
            tableReservations: 0
          }
        }
      };
    }
  },

  // Get reservation details by ID and type
  async getReservationDetails(id, type) {
    try {
      const endpoint = type === 'room' ? `/bookings/${id}` : `/restaurant/reservations/${id}`;
      const response = await api.get(endpoint);
      
      const transformer = type === 'room' ? transformRoomBooking : transformTableReservation;
      const reservation = transformer(response.data?.booking || response.data?.reservation);
      
      return {
        success: true,
        data: { reservation }
      };
    } catch (error) {
      console.error(`Failed to fetch ${type} reservation ${id}:`, error);
      throw error;
    }
  }
};

export default reservationApi;

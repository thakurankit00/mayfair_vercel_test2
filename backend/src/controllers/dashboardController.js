const db = require('../config/database');

// Get dashboard metrics
const getMetrics = async (req, res, next) => {
  try {
    const userRole = req.user.role;
    
    // Different metrics based on user role
    let metrics = {};

    // Revenue data (for staff only)
    if (['manager', 'admin', 'receptionist'].includes(userRole)) {
      const revenueQuery = await db.raw(`
        SELECT 
          COALESCE(SUM(CASE WHEN DATE(created_at) = CURRENT_DATE THEN total_amount ELSE 0 END), 0) as today,
          COALESCE(SUM(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN total_amount ELSE 0 END), 0) as thisWeek,
          COALESCE(SUM(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN total_amount ELSE 0 END), 0) as thisMonth
        FROM room_bookings 
        WHERE status IN ('confirmed', 'checked_in', 'checked_out')
      `);
      
      metrics.revenue = {
        today: parseFloat(revenueQuery.rows[0]?.today || 0),
        thisWeek: parseFloat(revenueQuery.rows[0]?.thisweek || 0),
        thisMonth: parseFloat(revenueQuery.rows[0]?.thismonth || 0),
        growth: 12.5 // Mock growth percentage
      };
    }

    // Booking data
    if (['manager', 'admin', 'receptionist'].includes(userRole)) {
      const bookingQuery = await db.raw(`
        SELECT 
          COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE THEN 1 END) as today,
          COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as thisWeek,
          COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as thisMonth
        FROM room_bookings
      `);
      
      // Calculate real-time room availability using proper rooms table
      const roomStatsQuery = await db.raw(`
        SELECT 
          COUNT(r.id) as total_rooms,
          COUNT(DISTINCT rt.id) as room_types_count,
          COUNT(CASE WHEN r.status = 'available' THEN 1 END) as available_rooms,
          COUNT(CASE WHEN r.status = 'occupied' THEN 1 END) as occupied_rooms,
          COUNT(CASE WHEN r.status = 'maintenance' THEN 1 END) as maintenance_rooms,
          COUNT(CASE WHEN r.status = 'cleaning' THEN 1 END) as cleaning_rooms
        FROM rooms r
        JOIN room_types rt ON r.room_type_id = rt.id
        WHERE rt.is_active = true
      `);
      
      const roomStats = roomStatsQuery.rows[0] || {};
      const totalRooms = parseInt(roomStats.total_rooms || 0);
      const roomTypesCount = parseInt(roomStats.room_types_count || 0);
      const availableRoomsFromStatus = parseInt(roomStats.available_rooms || 0);
      
      // Count actually booked rooms for today (considering current bookings)
      const todayBookedQuery = await db.raw(`
        SELECT COUNT(DISTINCT rb.room_id) as booked_count
        FROM room_bookings rb
        WHERE rb.status IN ('confirmed', 'checked_in') 
          AND CURRENT_DATE >= DATE(rb.check_in_date) 
          AND CURRENT_DATE < DATE(rb.check_out_date)
      `);
      
      const bookedRooms = parseInt(todayBookedQuery.rows[0]?.booked_count || 0);
      
      // Calculate available rooms more accurately:
      // Start with rooms that are physically available, then subtract those with active bookings
      const actuallyAvailableQuery = await db.raw(`
        SELECT COUNT(r.id) as truly_available
        FROM rooms r
        JOIN room_types rt ON r.room_type_id = rt.id
        WHERE rt.is_active = true 
          AND r.status = 'available'
          AND NOT EXISTS (
            SELECT 1 FROM room_bookings rb
            WHERE rb.room_id = r.id
              AND rb.status IN ('confirmed', 'checked_in')
              AND CURRENT_DATE >= DATE(rb.check_in_date)
              AND CURRENT_DATE < DATE(rb.check_out_date)
          )
      `);
      
      const availableRooms = parseInt(actuallyAvailableQuery.rows[0]?.truly_available || 0);
      const occupancyRate = totalRooms > 0 ? Math.round((bookedRooms / totalRooms) * 100) : 0;
      
      metrics.bookings = {
        today: parseInt(bookingQuery.rows[0]?.today || 0),
        thisWeek: parseInt(bookingQuery.rows[0]?.thisweek || 0),
        thisMonth: parseInt(bookingQuery.rows[0]?.thismonth || 0),
        occupancyRate
      };
      
      // Add room availability metrics
      metrics.rooms = {
        total: totalRooms,
        available: availableRooms,
        booked: bookedRooms,
        roomTypes: roomTypesCount
      };
    }

    // Order data
    if (['manager', 'admin', 'waiter', 'chef', 'bartender'].includes(userRole)) {
      const orderQuery = await db.raw(`
        SELECT 
          COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE THEN 1 END) as today,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
          COUNT(CASE WHEN status = 'served' AND DATE(created_at) = CURRENT_DATE THEN 1 END) as completed,
          COALESCE(AVG(CASE WHEN DATE(created_at) = CURRENT_DATE THEN total_amount END), 0) as avgOrderValue
        FROM orders
      `);
      
      metrics.orders = {
        today: parseInt(orderQuery.rows[0]?.today || 0),
        pending: parseInt(orderQuery.rows[0]?.pending || 0),
        completed: parseInt(orderQuery.rows[0]?.completed || 0),
        avgOrderValue: Math.round(parseFloat(orderQuery.rows[0]?.avgordervalue || 0))
      };
    }

    // Customer metrics (for managers/admins)
    if (['manager', 'admin'].includes(userRole)) {
      const customerQuery = await db.raw(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as newThisMonth
        FROM users 
        WHERE role = 'customer' AND is_active = true
      `);
      
      metrics.customers = {
        total: parseInt(customerQuery.rows[0]?.total || 0),
        newThisMonth: parseInt(customerQuery.rows[0]?.newthismonth || 0),
        returning: 65, // Mock data
        satisfaction: 4.6 // Mock data
      };
    }

    // Customer-specific metrics
    if (userRole === 'customer') {
      const customerMetrics = await db.raw(`
        SELECT 
          COUNT(CASE WHEN user_id = ? THEN 1 END) as myBookings,
          1250 as loyaltyPoints,
          3 as availableOffers
        FROM room_bookings
      `, [req.user.id]);
      
      metrics = {
        bookings: customerMetrics.rows[0]?.mybookings || 0,
        loyaltyPoints: 1250, // Mock data
        availableOffers: 3 // Mock data
      };
    }

    res.status(200).json({
      success: true,
      data: metrics
    });

  } catch (error) {
    next(error);
  }
};

// Get revenue chart data
const getRevenueChart = async (req, res, next) => {
  try {
    const { period = '7days' } = req.query;
    const days = period === '7days' ? 7 : period === '30days' ? 30 : 365;

    // Mock chart data for now
    const chartData = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      chartData.push({
        date: date.toISOString().split('T')[0],
        revenue: Math.floor(Math.random() * 50000) + 10000,
        bookings: Math.floor(Math.random() * 15) + 2,
        orders: Math.floor(Math.random() * 40) + 10
      });
    }

    res.status(200).json({
      success: true,
      data: chartData
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMetrics,
  getRevenueChart
};

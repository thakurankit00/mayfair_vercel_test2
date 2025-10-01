const db = require('../config/database');

// Get dashboard metrics
const getMetrics = async (req, res, next) => {
  try {
    const userRole = req.user.role;
    const range = req.query.range || '1day';

    // Parse time range parameters
    let timeCondition = '';

    if (range.includes('_')) {
      // Custom date range: startDate_endDate
      const [startDate, endDate] = range.split('_');
      timeCondition = `created_at >= '${startDate}' AND created_at <= '${endDate} 23:59:59'`;
    } else {
      // Predefined ranges
      switch (range) {
        case 'hourly':
          timeCondition = `created_at >= CURRENT_DATE AND created_at < CURRENT_DATE + INTERVAL '1 day'`;
          break;
        case '1day':
          timeCondition = `created_at >= CURRENT_DATE - INTERVAL '1 day'`;
          break;
        case '10days':
          timeCondition = `created_at >= CURRENT_DATE - INTERVAL '10 days'`;
          break;
        default:
          timeCondition = `created_at >= CURRENT_DATE - INTERVAL '1 day'`;
      }
    }

    // Debug logging
    console.log('Dashboard API called with range:', range);
    console.log('Generated timeCondition:', timeCondition);

    // Different metrics based on user role
    let metrics = {};

    // Revenue data (for staff only)
    if (['manager', 'admin', 'receptionist'].includes(userRole)) {
      const revenueQuery = await db.raw(`
        SELECT
          COALESCE(SUM(CASE WHEN DATE(created_at) = CURRENT_DATE THEN total_amount ELSE 0 END), 0) as today,
          COALESCE(SUM(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN total_amount ELSE 0 END), 0) as thisWeek,
          COALESCE(SUM(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN total_amount ELSE 0 END), 0) as thisMonth,
          COALESCE(SUM(CASE WHEN (${timeCondition}) THEN total_amount ELSE 0 END), 0) as filtered
        FROM room_bookings
        WHERE status IN ('confirmed', 'checked_in', 'checked_out')
      `);

      metrics.revenue = {
        today: parseFloat(revenueQuery.rows[0]?.today || 0),
        thisWeek: parseFloat(revenueQuery.rows[0]?.thisweek || 0),
        thisMonth: parseFloat(revenueQuery.rows[0]?.thismonth || 0),
        filtered: parseFloat(revenueQuery.rows[0]?.filtered || 0),
        growth: 12.5 // Mock growth percentage
      };
    }

    // Booking data
    if (['manager', 'admin', 'receptionist'].includes(userRole)) {
      const bookingQuery = await db.raw(`
        SELECT
          COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE THEN 1 END) as today,
          COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as thisWeek,
          COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as thisMonth,
          COUNT(CASE WHEN (${timeCondition}) THEN 1 END) as filtered
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
        filtered: parseInt(bookingQuery.rows[0]?.filtered || 0),
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
          COALESCE(AVG(CASE WHEN DATE(created_at) = CURRENT_DATE THEN total_amount END), 0) as avgOrderValue,
          COUNT(CASE WHEN (${timeCondition}) THEN 1 END) as filtered,
          COALESCE(AVG(CASE WHEN (${timeCondition}) THEN total_amount END), 0) as filteredAvgOrderValue
        FROM orders
      `);
      
      // Get order type distribution
      let orderTypeData = [];
      try {
        const orderTypeQuery = await db.raw(`
          SELECT
            order_type,
            COUNT(*) as count
          FROM orders
          WHERE (${timeCondition})
          GROUP BY order_type
          ORDER BY count DESC
        `);
        orderTypeData = orderTypeQuery.rows || [];
      } catch (error) {
        console.error('Error fetching order types:', error);
      }

      metrics.orders = {
        today: parseInt(orderQuery.rows[0]?.today || 0),
        pending: parseInt(orderQuery.rows[0]?.pending || 0),
        completed: parseInt(orderQuery.rows[0]?.completed || 0),
        filtered: parseInt(orderQuery.rows[0]?.filtered || 0),
        avgOrderValue: Math.round(parseFloat(orderQuery.rows[0]?.avgordervalue || 0)),
        filteredAvgOrderValue: Math.round(parseFloat(orderQuery.rows[0]?.filteredavgordervalue || 0)),
        byType: orderTypeData
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

      // Get top selling menu items
      try {
        const topItemsQuery = await db.raw(`
          SELECT
            mi.name,
            SUM(oi.quantity) as total_quantity,
            SUM(oi.total_price) as total_revenue,
            COUNT(DISTINCT o.id) as order_count
          FROM order_items oi
          JOIN menu_items mi ON oi.menu_item_id = mi.id
          JOIN orders o ON oi.order_id = o.id
          WHERE (${timeCondition.replaceAll('created_at', 'o.created_at')})
            AND o.status NOT IN ('cancelled')
          GROUP BY mi.id, mi.name
          ORDER BY total_revenue DESC
          LIMIT 10
        `);

        metrics.topSellingItems = topItemsQuery.rows || [];
      } catch (error) {
        console.error('Error fetching top selling items:', error);
        metrics.topSellingItems = [];
      }

      // Get category-wise revenue summary
      try {
        const categorySummaryQuery = await db.raw(`
          SELECT
            mc.name as category_name,
            SUM(oi.total_price) as total_revenue,
            COUNT(DISTINCT o.id) as order_count,
            SUM(oi.quantity) as total_quantity
          FROM order_items oi
          JOIN menu_items mi ON oi.menu_item_id = mi.id
          JOIN menu_categories mc ON mi.category_id = mc.id
          JOIN orders o ON oi.order_id = o.id
          WHERE (${timeCondition.replaceAll('created_at', 'o.created_at')})
            AND o.status NOT IN ('cancelled')
          GROUP BY mc.id, mc.name
          ORDER BY total_revenue DESC
        `);

        metrics.categoryRevenue = categorySummaryQuery.rows || [];
      } catch (error) {
        console.error('Error fetching category revenue:', error);
        metrics.categoryRevenue = [];
      }

      // Get daily metrics for mini charts - dynamic based on time filter
      try {
        let dailyRevenueQuery, dailyBookingsQuery, dailyOrdersQuery;

        if (range === 'hourly') {
          // For hourly data, group by hour for the last 24 hours
          dailyRevenueQuery = await db.raw(`
            SELECT
              EXTRACT(HOUR FROM created_at) as hour,
              DATE(created_at) as date,
              EXTRACT(DOW FROM DATE(created_at)) as day_of_week,
              SUM(total_amount) as revenue
            FROM room_bookings
            WHERE ${timeCondition}
              AND status IN ('confirmed', 'checked_in', 'checked_out')
            GROUP BY EXTRACT(HOUR FROM created_at), DATE(created_at), EXTRACT(DOW FROM DATE(created_at))
            ORDER BY DATE(created_at), EXTRACT(HOUR FROM created_at)
          `);

          dailyBookingsQuery = await db.raw(`
            SELECT
              EXTRACT(HOUR FROM created_at) as hour,
              DATE(created_at) as date,
              EXTRACT(DOW FROM DATE(created_at)) as day_of_week,
              COUNT(*) as bookings
            FROM room_bookings
            WHERE ${timeCondition}
            GROUP BY EXTRACT(HOUR FROM created_at), DATE(created_at), EXTRACT(DOW FROM DATE(created_at))
            ORDER BY DATE(created_at), EXTRACT(HOUR FROM created_at)
          `);

          dailyOrdersQuery = await db.raw(`
            SELECT
              EXTRACT(HOUR FROM created_at) as hour,
              DATE(created_at) as date,
              EXTRACT(DOW FROM DATE(created_at)) as day_of_week,
              COUNT(*) as orders
            FROM orders
            WHERE ${timeCondition}
              AND status NOT IN ('cancelled')
            GROUP BY EXTRACT(HOUR FROM created_at), DATE(created_at), EXTRACT(DOW FROM DATE(created_at))
            ORDER BY DATE(created_at), EXTRACT(HOUR FROM created_at)
          `);
        } else {
          // For daily data
          dailyRevenueQuery = await db.raw(`
            SELECT
              DATE(created_at) as date,
              EXTRACT(DOW FROM DATE(created_at)) as day_of_week,
              SUM(total_amount) as revenue
            FROM room_bookings
            WHERE ${timeCondition}
              AND status IN ('confirmed', 'checked_in', 'checked_out')
            GROUP BY DATE(created_at), EXTRACT(DOW FROM DATE(created_at))
            ORDER BY DATE(created_at)
          `);

          dailyBookingsQuery = await db.raw(`
            SELECT
              DATE(created_at) as date,
              EXTRACT(DOW FROM DATE(created_at)) as day_of_week,
              COUNT(*) as bookings
            FROM room_bookings
            WHERE ${timeCondition}
            GROUP BY DATE(created_at), EXTRACT(DOW FROM DATE(created_at))
            ORDER BY DATE(created_at)
          `);

          dailyOrdersQuery = await db.raw(`
            SELECT
              DATE(created_at) as date,
              EXTRACT(DOW FROM DATE(created_at)) as day_of_week,
              COUNT(*) as orders
            FROM orders
            WHERE ${timeCondition}
              AND status NOT IN ('cancelled')
            GROUP BY DATE(created_at), EXTRACT(DOW FROM DATE(created_at))
            ORDER BY DATE(created_at)
          `);
        }

        // Combine the results
        const revenueData = dailyRevenueQuery.rows || [];
        const bookingsData = dailyBookingsQuery.rows || [];
        const ordersData = dailyOrdersQuery.rows || [];

        // Helper function to get day name from day_of_week number
        const getDayName = (dayOfWeek) => {
          const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          return days[dayOfWeek] || 'Unknown';
        };

        // Create a map for easier lookup
        const combinedData = {};

        revenueData.forEach(item => {
          const dateKey = range === 'hourly' ? `${item.date}_${item.hour}` : item.date;
          combinedData[dateKey] = {
            date: item.date,
            day_of_week: item.day_of_week,
            day_name: getDayName(item.day_of_week),
            hour: item.hour || null,
            revenue: parseFloat(item.revenue || 0),
            bookings: 0,
            orders: 0
          };
        });

        bookingsData.forEach(item => {
          const dateKey = range === 'hourly' ? `${item.date}_${item.hour}` : item.date;
          if (combinedData[dateKey]) {
            combinedData[dateKey].bookings = parseInt(item.bookings || 0);
          } else {
            combinedData[dateKey] = {
              date: item.date,
              day_of_week: item.day_of_week,
              day_name: getDayName(item.day_of_week),
              hour: item.hour || null,
              revenue: 0,
              bookings: parseInt(item.bookings || 0),
              orders: 0
            };
          }
        });

        ordersData.forEach(item => {
          const dateKey = range === 'hourly' ? `${item.date}_${item.hour}` : item.date;
          if (combinedData[dateKey]) {
            combinedData[dateKey].orders = parseInt(item.orders || 0);
          } else {
            combinedData[dateKey] = {
              date: item.date,
              day_of_week: item.day_of_week,
              day_name: getDayName(item.day_of_week),
              hour: item.hour || null,
              revenue: 0,
              bookings: 0,
              orders: parseInt(item.orders || 0)
            };
          }
        });

        metrics.dailyMetrics = Object.values(combinedData).sort((a, b) => {
          if (range === 'hourly') {
            // Sort by date first, then by hour
            const dateCompare = new Date(a.date) - new Date(b.date);
            if (dateCompare !== 0) return dateCompare;
            return (a.hour || 0) - (b.hour || 0);
          } else {
            // Sort by date only
            return new Date(a.date) - new Date(b.date);
          }
        });
      } catch (error) {
        console.error('Error fetching daily metrics:', error);
        metrics.dailyMetrics = [];
      }
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

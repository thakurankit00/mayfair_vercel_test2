// Lazy load database to avoid circular dependency
let db;
const getDb = () => {
  if (!db) {
    db = require('../config/database');
  }
  return db;
};

/**
 * Utility functions for table status management
 */

/**
 * Get table booking status based on reservations
 * @param {string} tableId - The table ID
 * @returns {Promise<string>} - 'booked' or 'available'
 */
const getTableBookingStatus = async (tableId) => {
  const db = getDb();
  const today = new Date().toISOString().split('T')[0];
  const reservation = await db('table_reservations')
    .where('table_id', tableId)
    .where('reservation_date', today)
    .whereIn('status', ['confirmed', 'seated'])
    .first();
  
  return reservation ? 'booked' : 'available';
};

/**
 * Get comprehensive table status including reservations and orders
 * @param {string} tableId - The table ID
 * @returns {Promise<Object>} - Comprehensive status object
 */
const getComprehensiveTableStatus = async (tableId) => {
  const db = getDb();
  const today = new Date().toISOString().split('T')[0];
  
  // Check for reservations
  const reservation = await db('table_reservations')
    .where('table_id', tableId)
    .where('reservation_date', today)
    .whereIn('status', ['confirmed', 'seated'])
    .first();
  
  // Check for active orders
  const activeOrder = await db('orders')
    .where('table_id', tableId)
    .whereIn('status', ['pending', 'preparing', 'ready'])
    .first();
  
  // Determine unified status
  let unifiedStatus = 'available';
  if (reservation) {
    if (reservation.status === 'seated' || activeOrder) {
      unifiedStatus = 'occupied';
    } else if (reservation.status === 'confirmed') {
      unifiedStatus = 'reserved';
    }
  } else if (activeOrder) {
    unifiedStatus = 'occupied';
  }
  
  const reservationInfo = reservation ? {
    id: reservation.id,
    reservation_reference: reservation.reservation_reference,
    reservation_time: reservation.reservation_time,
    party_size: reservation.party_size,
    status: reservation.status,
    special_requests: reservation.special_requests
  } : null;
  
  return {
    booking_status: reservation ? 'booked' : 'available',
    unified_status: unifiedStatus,
    reservation_info: reservationInfo,
    has_active_orders: !!activeOrder
  };
};

module.exports = {
  getTableBookingStatus,
  getComprehensiveTableStatus
};

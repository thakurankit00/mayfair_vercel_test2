# Mayfair Hotel Management System - API Documentation

## Base URL
```
Production: https://api.mayfairhotel.com
Development: http://localhost:3000/api
```

## Authentication
All protected endpoints require JWT token in Authorization header:
```
Authorization: Bearer <jwt_token>
```

## API Versioning
Current API version: `v1`
All endpoints are prefixed with `/api/v1`

---

## 🔐 Authentication Endpoints

### POST /auth/register
Register a new customer account
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john.doe@example.com",
  "phone": "+91-9876543210",
  "password": "securePassword123"
}
```

### POST /auth/login
Login with email and password
```json
{
  "email": "john.doe@example.com",
  "password": "securePassword123"
}
```

### POST /auth/logout
Logout and invalidate token (Protected)

### POST /auth/refresh
Refresh JWT token
```json
{
  "refresh_token": "refresh_token_here"
}
```

### POST /auth/forgot-password
Request password reset
```json
{
  "email": "john.doe@example.com"
}
```

### POST /auth/reset-password
Reset password with token
```json
{
  "token": "reset_token",
  "password": "newPassword123"
}
```

---

## 👤 User Management Endpoints

### GET /users/profile (Protected)
Get current user profile

### PUT /users/profile (Protected)
Update user profile
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+91-9876543210",
  "address": "123 Main St",
  "city": "Mandi",
  "preferences": {
    "room_type": "deluxe",
    "dietary_restrictions": ["vegetarian"]
  }
}
```

### POST /users/upload-avatar (Protected)
Upload profile picture (multipart/form-data)

### GET /users (Admin/Manager)
List all users with pagination
Query params: `page`, `limit`, `role`, `search`

### POST /users (Admin)
Create new staff member
```json
{
  "first_name": "Jane",
  "last_name": "Smith",
  "email": "jane.smith@mayfairhotel.com",
  "phone": "+91-9876543211",
  "role": "receptionist",
  "password": "tempPassword123"
}
```

### PUT /users/:id (Admin)
Update user details

### DELETE /users/:id (Admin)
Deactivate user account

---

## 🏨 Room Management Endpoints

### GET /rooms/types
Get all room types
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Deluxe Room",
      "description": "Spacious room with mountain view",
      "base_price": 2500.00,
      "max_occupancy": 2,
      "amenities": ["AC", "TV", "WiFi", "Mini Bar"],
      "images": ["image1.jpg", "image2.jpg"],
      "is_active": true
    }
  ]
}
```

### GET /rooms/availability
Check room availability
Query params: `check_in`, `check_out`, `adults`, `children`

### GET /rooms (Receptionist+)
List all rooms with status

### POST /rooms (Admin)
Create new room
```json
{
  "room_number": "101",
  "room_type_id": "uuid",
  "floor": 1,
  "status": "available"
}
```

### PUT /rooms/:id (Receptionist+)
Update room details

### PUT /rooms/:id/status (Receptionist+)
Update room status
```json
{
  "status": "maintenance",
  "notes": "AC repair needed"
}
```

---

## 📋 Booking Management Endpoints

### POST /bookings (Protected)
Create new room booking
```json
{
  "room_type_id": "uuid",
  "check_in_date": "2024-12-25",
  "check_out_date": "2024-12-27",
  "adults": 2,
  "children": 0,
  "special_requests": "Late check-in"
}
```

### GET /bookings (Protected)
Get user's bookings (customers) or all bookings (staff)
Query params: `status`, `date_from`, `date_to`, `page`, `limit`

### GET /bookings/:id (Protected)
Get booking details

### PUT /bookings/:id (Protected)
Update booking (customers: before check-in, staff: all)

### POST /bookings/:id/check-in (Receptionist+)
Process check-in
```json
{
  "actual_check_in_time": "2024-12-25T15:30:00Z",
  "id_verification": true,
  "notes": "Guest arrived early"
}
```

### POST /bookings/:id/check-out (Receptionist+)
Process check-out
```json
{
  "actual_check_out_time": "2024-12-27T11:00:00Z",
  "room_condition": "good",
  "additional_charges": 0,
  "notes": "No damages"
}
```

### DELETE /bookings/:id (Protected)
Cancel booking

---

## 🍽️ Restaurant Management Endpoints

### GET /restaurant/tables
Get available restaurant tables
Query params: `date`, `time`, `party_size`, `location`

### GET /restaurant/menu
Get restaurant and bar menu
Query params: `type` (restaurant/bar), `category`

### POST /restaurant/reservations (Protected)
Make table reservation
```json
{
  "table_id": "uuid",
  "reservation_date": "2024-12-25",
  "reservation_time": "19:30",
  "party_size": 4,
  "special_requests": "Birthday celebration"
}
```

### GET /restaurant/reservations (Protected)
Get reservations (customers: own, staff: all)

### PUT /restaurant/reservations/:id (Protected)
Update table reservation

### DELETE /restaurant/reservations/:id (Protected)
Cancel table reservation

---

## 🍳 Menu Management Endpoints

### GET /menu/categories (Staff+)
Get all menu categories

### POST /menu/categories (Receptionist+)
Create menu category
```json
{
  "name": "Appetizers",
  "description": "Starter dishes",
  "type": "restaurant",
  "display_order": 1
}
```

### PUT /menu/categories/:id (Receptionist+)
Update menu category

### POST /menu/items (Receptionist+)
Create menu item
```json
{
  "category_id": "uuid",
  "name": "Butter Chicken",
  "description": "Creamy tomato-based curry",
  "price": 450.00,
  "ingredients": ["chicken", "tomato", "cream", "spices"],
  "allergens": ["dairy"],
  "is_vegetarian": false,
  "preparation_time": 25,
  "calories": 520
}
```

### PUT /menu/items/:id (Receptionist+)
Update menu item

### DELETE /menu/items/:id (Receptionist+)
Remove menu item

---

## 🛎️ Order Management Endpoints

### POST /orders (Protected)
Place order
```json
{
  "table_id": "uuid",
  "table_reservation_id": "uuid",
  "order_type": "restaurant",
  "items": [
    {
      "menu_item_id": "uuid",
      "quantity": 2,
      "special_instructions": "Extra spicy"
    }
  ],
  "special_instructions": "Rush order"
}
```

### GET /orders (Protected)
Get orders
- Customers: their own orders
- Waiters: orders assigned to them
- Chefs/Bartenders: orders by type
- Managers/Admins: all orders

### PUT /orders/:id/status (Staff+)
Update order status
```json
{
  "status": "preparing",
  "estimated_time": 20
}
```

### PUT /orders/:id/items/:item_id/status (Chef/Bartender)
Update individual item status
```json
{
  "status": "ready"
}
```

---

## 💳 Payment Endpoints

### POST /payments/create-intent (Protected)
Create payment intent
```json
{
  "booking_id": "uuid",
  "order_id": "uuid",
  "amount": 2500.00,
  "payment_method": "card"
}
```

### POST /payments/confirm (Protected)
Confirm payment
```json
{
  "payment_reference": "PAY_123456",
  "gateway_transaction_id": "txn_abc123"
}
```

### GET /payments (Protected)
Get payment history

### POST /payments/refund (Manager+)
Process refund
```json
{
  "payment_id": "uuid",
  "amount": 1000.00,
  "reason": "Booking cancellation"
}
```

---

## 🎯 Offers & Promotions

### GET /offers
Get active offers
Query params: `applicable_to` (rooms/restaurant/bar/all)

### POST /offers (Receptionist+)
Create new offer
```json
{
  "title": "Weekend Special",
  "description": "25% off on weekend bookings",
  "discount_type": "percentage",
  "discount_value": 25,
  "applicable_to": "rooms",
  "valid_from": "2024-12-01",
  "valid_until": "2024-12-31",
  "usage_limit": 100
}
```

### PUT /offers/:id (Receptionist+)
Update offer

### DELETE /offers/:id (Receptionist+)
Deactivate offer

---

## 🔗 Platform Integration Endpoints

### GET /integrations (Receptionist+)
Get integration status

### PUT /integrations/:platform (Receptionist+)
Update platform integration settings
```json
{
  "is_active": true,
  "api_credentials": {
    "api_key": "encrypted_key",
    "secret": "encrypted_secret"
  },
  "sync_settings": {
    "auto_sync": true,
    "sync_frequency": "hourly"
  }
}
```

### POST /integrations/:platform/sync (Receptionist+)
Trigger manual sync

### GET /integrations/:platform/pricing (Receptionist+)
Get platform pricing data

### PUT /integrations/:platform/pricing (Receptionist+)
Update platform pricing
```json
{
  "room_type_id": "uuid",
  "date": "2024-12-25",
  "price": 3000.00,
  "availability": 5
}
```

---

## 📊 Reporting Endpoints

### GET /reports/dashboard (Manager+)
Get dashboard summary

### GET /reports/revenue (Manager+)
Get revenue reports
Query params: `date_from`, `date_to`, `group_by` (day/week/month)

### GET /reports/bookings (Manager+)
Get booking statistics
Query params: `date_from`, `date_to`, `status`

### GET /reports/restaurant (Manager+)
Get restaurant performance
Query params: `date_from`, `date_to`

### GET /reports/occupancy (Manager+)
Get room occupancy rates
Query params: `date_from`, `date_to`

### GET /reports/staff-performance (Admin+)
Get staff performance metrics

### POST /reports/export (Manager+)
Export reports
```json
{
  "report_type": "revenue",
  "format": "csv",
  "date_from": "2024-12-01",
  "date_to": "2024-12-31",
  "filters": {
    "room_type": "deluxe"
  }
}
```

---

## 🔧 System Management

### GET /system/health
System health check (public)

### GET /system/settings (Admin)
Get system settings

### PUT /system/settings (Admin)
Update system settings
```json
{
  "hotel_name": "Mayfair Hotel",
  "check_in_time": "14:00",
  "check_out_time": "11:00",
  "tax_rate": 12.0,
  "currency": "INR"
}
```

### GET /system/audit-logs (Admin)
Get audit trail
Query params: `user_id`, `action`, `table_name`, `date_from`, `date_to`

---

## 📱 WebSocket Events

### Real-time Order Updates
- `order_created`: New order placed
- `order_status_changed`: Order status updated
- `order_ready`: Order ready for pickup/serving

### Real-time Booking Updates
- `booking_created`: New booking made
- `booking_checked_in`: Guest checked in
- `booking_checked_out`: Guest checked out

### Real-time Notifications
- `new_message`: System notifications
- `payment_completed`: Payment successful
- `payment_failed`: Payment failed

---

## 🚨 Error Responses

All errors follow this format:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Email is required"
      }
    ]
  }
}
```

### Common Error Codes
- `VALIDATION_ERROR`: Request validation failed
- `UNAUTHORIZED`: Authentication required
- `FORBIDDEN`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `CONFLICT`: Resource already exists
- `RATE_LIMITED`: Too many requests
- `SERVER_ERROR`: Internal server error

---

## 📄 Response Format

All successful responses follow this format:
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
```

## 🔐 Role-based Access Control

| Endpoint | Customer | Receptionist | Waiter | Chef | Bartender | Manager | Admin |
|----------|----------|--------------|---------|-------|-----------|---------|-------|
| Profile Management | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Room Booking | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Check-in/out | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Table Reservation | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ |
| Menu Management | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Order Management | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Payment Processing | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Reports | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| User Management | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| System Settings | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 📚 Additional Resources

- [Authentication Guide](./auth.md)
- [WebSocket Documentation](./websockets.md)
- [Rate Limiting](./rate-limiting.md)
- [API Testing Collection](./postman-collection.json)

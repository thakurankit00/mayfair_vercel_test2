# Mayfair Hotel Management System - Backend API

This is the Node.js/Express backend API for the Mayfair Hotel Management System.

## 🚀 Quick Start

### Prerequisites
- Node.js 18 or higher
- PostgreSQL 15 or higher
- npm 8 or higher

### Development Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials and other settings
   ```

3. **Set up PostgreSQL database**
   ```bash
   # Create database and user
   psql -d postgres -f ../database/setup.sql
   
   # Create schema and tables
   psql -d mayfair_hotel_db -U mayfair_user -f ../database/schemas/schema.sql
   
   # Seed with sample users (optional)
   psql -d mayfair_hotel_db -U mayfair_user -f ../database/seed_users.sql
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Test the API**
   Navigate to `http://localhost:3000/health` to verify the server is running.

## 🏗️ Architecture

### Technology Stack
- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.18
- **Database**: PostgreSQL 15 with Knex.js query builder
- **Authentication**: JWT tokens with bcryptjs password hashing
- **Security**: Helmet, CORS, rate limiting, input validation
- **Logging**: Morgan for request logging
- **Development**: Nodemon for hot reloading

### Project Structure
```
backend/src/
├── config/           # Configuration files
│   └── database.js   # Database connection setup
├── controllers/      # Route controllers
│   ├── authController.js      # Authentication logic
│   └── dashboardController.js # Dashboard metrics
├── middleware/       # Express middleware
│   ├── auth.js       # JWT authentication & authorization
│   ├── errorHandler.js # Global error handling
│   └── notFound.js   # 404 handler
├── routes/           # Express routes
│   ├── auth.js       # Authentication routes
│   ├── dashboard.js  # Dashboard routes
│   └── users.js      # User management routes
└── server.js         # Main application entry point
```

## 🔐 Authentication & Authorization

### JWT Authentication
- **Login**: POST `/api/v1/auth/login` with email/password
- **Register**: POST `/api/v1/auth/register` with user details
- **Token**: Include in requests as `Authorization: Bearer <token>`
- **Expiration**: 7 days (configurable via JWT_EXPIRES_IN)

### Role-Based Access Control
The system supports 7 user roles with different permission levels:

1. **customer** - Hotel guests, can make bookings and orders
2. **receptionist** - Front desk staff, manage bookings and check-ins
3. **waiter** - Restaurant staff, manage orders and table service
4. **chef** - Kitchen staff, view and update food orders
5. **bartender** - Bar staff, view and update drink orders
6. **manager** - Supervisors, access to reports and analytics
7. **admin** - Full system access, user management

### Sample Test Users
All users have password: `"password"`

- **Customer**: `john.customer@example.com`
- **Receptionist**: `sarah.receptionist@mayfairhotel.com`
- **Manager**: `mike.manager@mayfairhotel.com`
- **Chef**: `anna.chef@mayfairhotel.com`
- **Waiter**: `carlos.waiter@mayfairhotel.com`
- **Bartender**: `lisa.bartender@mayfairhotel.com`
- **Admin**: `david.admin@mayfairhotel.com`

## 📋 API Endpoints

### Authentication Endpoints
```
POST   /api/v1/auth/login       # User login
POST   /api/v1/auth/register    # User registration
POST   /api/v1/auth/logout      # User logout
GET    /api/v1/auth/profile     # Get current user profile
```

### Dashboard Endpoints
```
GET    /api/v1/dashboard/metrics      # Get dashboard metrics (role-based)
GET    /api/v1/dashboard/revenue-chart # Get revenue chart data
```

### User Management
```
GET    /api/v1/users            # Get all users (admin only)
PUT    /api/v1/users/profile    # Update user profile
```

### System Health
```
GET    /health                  # Health check endpoint
```

## 🔧 Development Scripts

```bash
# Development server with hot reload
npm run dev

# Start production server
npm start

# Run tests
npm test
npm run test:watch
npm run test:coverage

# Code linting
npm run lint
npm run lint:fix

# Database operations
npm run db:migrate
npm run db:rollback
npm run db:seed

# Build for production
npm run build

# Docker operations
npm run docker:build
npm run docker:run
```

## 🗄️ Database

### Connection Details (Supabase)
- **Provider**: Supabase (Cloud PostgreSQL)
- **Host**: aws-1-ap-southeast-1.pooler.supabase.com
- **Port**: 5432
- **Database**: postgres
- **User**: postgres.aglpkgpajcgjdlfunwyr
- **Region**: Asia Pacific (Singapore)
- **SSL**: Enabled

See [SUPABASE_MIGRATION.md](../SUPABASE_MIGRATION.md) for detailed migration information.

### Schema Overview
The database includes 17 tables:
- **Core**: users, rooms, room_types, room_bookings
- **Restaurant**: restaurant_tables, menu_categories, menu_items, table_reservations, orders, order_items
- **Financial**: payments, offers
- **System**: audit_logs, system_settings, report_cache
- **Integrations**: platform_integrations, platform_pricing

### Key Features
- **UUID primary keys** throughout the system
- **JSONB columns** for flexible data storage
- **Audit logging** with automatic triggers
- **Comprehensive indexing** for performance
- **Role-based enums** for data integrity

## 🚦 API Response Format

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message"
  }
}
```

### Common Error Codes
- `VALIDATION_ERROR` - Invalid input data
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `DUPLICATE_ENTRY` - Resource already exists
- `RATE_LIMITED` - Too many requests
- `SERVER_ERROR` - Internal server error

## 🔒 Security Features

### Authentication Security
- **bcryptjs** password hashing with 12 salt rounds
- **JWT tokens** with configurable expiration
- **Token validation** on every protected route
- **User account status** checking (active/inactive)

### API Security
- **Helmet.js** for security headers
- **CORS** properly configured for frontend origin
- **Rate limiting** to prevent abuse (100 req/15min default)
- **Input validation** and sanitization
- **SQL injection** protection via parameterized queries

### Authorization Security
- **Role-based middleware** for route protection
- **Permission checking** at controller level
- **User context** available in all protected routes
- **Database-level constraints** for data integrity

## 🚀 Deployment

### Environment Variables
Key environment variables to configure:

```bash
# Application
NODE_ENV=production
PORT=3000
APP_VERSION=1.0.0

# Database
DB_HOST=your_postgres_host
DB_PORT=5432
DB_NAME=mayfair_hotel_db
DB_USER=mayfair_user
DB_PASSWORD=your_secure_password
DB_SSL=true

# Authentication
JWT_SECRET=your_very_secure_jwt_secret
JWT_EXPIRES_IN=7d
BCRYPT_SALT_ROUNDS=12

# Security
CORS_ORIGIN=https://your-frontend-domain.com
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100
```

### Production Setup
1. **Build the application**: `npm run build`
2. **Set environment variables** for production
3. **Run database migrations**: `npm run db:migrate`
4. **Start the server**: `npm start`

## 🧪 Testing

The application is set up for testing with:
- **Jest** for unit and integration tests
- **Supertest** for API endpoint testing
- **Test database** isolation
- **Coverage reporting** available

Run tests:
```bash
npm test                # Run all tests
npm run test:watch      # Watch mode
npm run test:coverage   # With coverage report
```

## 📈 Performance & Monitoring

### Performance Features
- **Connection pooling** for database efficiency
- **Compression middleware** for response optimization
- **Indexing strategy** for database queries
- **Caching considerations** for future Redis integration

### Monitoring
- **Request logging** with Morgan
- **Error logging** with detailed stack traces
- **Health check endpoint** for monitoring systems
- **Graceful shutdown** handling for deployments

## 🔄 Next Steps

The foundation APIs are complete! You can now:

1. **Extend room management** - Add booking, availability checking
2. **Build restaurant APIs** - Menu management, orders, reservations
3. **Add payment integration** - Razorpay and Stripe implementations
4. **Implement real-time features** - Socket.io for live updates
5. **Add comprehensive testing** - Unit and integration test suites
6. **Set up CI/CD pipeline** - Automated testing and deployment
7. **Add API documentation** - Swagger/OpenAPI documentation
8. **Performance optimization** - Caching, query optimization

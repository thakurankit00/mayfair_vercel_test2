# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is the **Mayfair Hotel Management System**, a comprehensive full-stack application for managing hotel operations, restaurant services, and customer bookings across web, iOS, and Android platforms. The hotel is located near BSNL Exchange, Mandi, Himachal Pradesh.

## Architecture

### Multi-Component System
- **Backend**: Node.js/Express API server with PostgreSQL and Redis
- **Frontend**: React.js web application with Tailwind CSS
- **Mobile**: React Native/Expo cross-platform app
- **Database**: PostgreSQL with Redis caching
- **Infrastructure**: Docker containerization with Docker Compose

### Key Technologies
- **Backend**: Express.js, Knex.js (migrations), JWT auth, Socket.io, Passport.js
- **Frontend**: React 18, React Query, React Hook Form, Framer Motion, Headless UI
- **Mobile**: Expo SDK 49, React Navigation, React Native Elements
- **Database**: PostgreSQL 15, Redis 7
- **Payment**: Razorpay (primary), Stripe (backup)
- **Integrations**: MakeMyTrip, Airbnb, Booking.com, Yatra, EaseMyTrip, Trivago

### Role-Based Architecture
The system supports 7 user roles: customer, receptionist, waiter, chef, bartender, manager, admin. Each has specific permissions and workflows defined in the database schema and API endpoints.

## Common Development Commands

### Initial Setup
```bash
# Clone and install all dependencies
git clone <repository-url>
cd mayfair-hotel-management

# Backend setup
cd backend && npm install

# Frontend setup  
cd ../frontend && npm install

# Mobile setup
cd ../mobile && npm install

# Copy environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### Development Servers
```bash
# Start all services with Docker Compose (recommended)
docker-compose up -d

# Or start services individually:

# Backend server (port 3000)
cd backend && npm run dev

# Frontend server (port 3001) 
cd frontend && npm start

# Mobile development
cd mobile && npm start
```

### Database Operations
```bash
# Run database migrations
cd backend && npm run db:migrate

# Rollback migrations
npm run db:rollback

# Seed database
npm run db:seed
```

### Testing
```bash
# Backend tests
cd backend && npm test
cd backend && npm run test:coverage

# Frontend tests  
cd frontend && npm test

# Mobile tests
cd mobile && npm test
```

### Code Quality
```bash
# Lint and fix code
cd backend && npm run lint:fix
cd frontend && npm run lint:fix  
cd mobile && npm run lint:fix

# Format code
cd frontend && npm run format
```

### Building for Production
```bash
# Build backend
cd backend && npm run build

# Build frontend
cd frontend && npm run build

# Docker builds
npm run docker:build  # from backend/
docker-compose build  # all services
```

## Database Schema

The system uses PostgreSQL with comprehensive schema including:
- **Core Entities**: users, room_types, rooms, room_bookings
- **Restaurant**: restaurant_tables, menu_categories, menu_items, table_reservations, orders, order_items
- **Financial**: payments, offers
- **Integration**: platform_integrations, platform_pricing
- **System**: audit_logs, system_settings, report_cache

Key database features:
- UUID primary keys throughout
- Role-based access via enums
- JSONB columns for flexible data (preferences, amenities, credentials)
- Comprehensive indexing for performance
- Audit logging with triggers
- Materialized views for complex queries

## Third-Party Integration Architecture

The system heavily integrates with booking platforms and payment gateways:

### Booking Platforms
- **Real-time sync** for inventory and pricing across MakeMyTrip, Airbnb, Booking.com
- **Configurable sync frequencies** (30min to 6hr intervals)  
- **Platform-specific authentication** stored encrypted in database
- **Unified booking management** regardless of source platform

### Payment Processing
- **Primary**: Razorpay (optimized for Indian market, supports UPI/cards/netbanking)
- **Secondary**: Stripe (for international payments)
- **Features**: Auto-capture, partial payments, webhook handling, refund processing

## API Design Patterns

- **RESTful APIs** with `/api/v1` versioning
- **JWT-based authentication** with refresh tokens  
- **Role-based authorization** middleware
- **Comprehensive validation** using Joi/express-validator
- **Standardized responses** with success/error format
- **Real-time updates** via Socket.io for orders and bookings
- **Rate limiting** and security middleware (helmet, cors)

## Key Business Logic

### Room Management
- Dynamic pricing based on date/platform/demand
- Real-time availability calculation across platforms
- Check-in/check-out workflow with staff assignment
- Multi-platform inventory synchronization

### Restaurant Operations  
- Table reservation system with time-based availability
- Multi-location support (indoor/outdoor/sky bar)
- Order management with kitchen/bar workflow
- Integration with room service for hotel guests

### Reporting & Analytics
- Revenue tracking across rooms/restaurant/bar
- Occupancy rate calculations
- Staff performance metrics
- Cached reports for performance
- Export capabilities (CSV/PDF)

## Development Notes

### Environment Configuration
- The `.env.example` file contains 130+ configuration options
- Separate configs for development/production environments
- Encrypted credential storage for platform integrations
- Feature flags for enabling/disabling integrations

### Security Considerations
- All staff actions are audit logged
- Sensitive data encrypted in database
- Rate limiting on all public endpoints  
- CORS properly configured
- Input validation on all endpoints
- Secure file upload handling

### Performance Optimizations
- Redis caching for frequently accessed data
- Database query optimization with proper indexing
- Image optimization with Sharp
- Front-end code splitting and lazy loading
- Containerized services for scalability

### Testing Strategy
- Backend: Jest with Supertest for API testing
- Frontend: React Testing Library
- Mobile: React Native Testing Library  
- Test coverage reporting available
- Separate test databases for isolation

## Platform-Specific Notes

### Mobile Development
- Uses Expo managed workflow
- Cross-platform iOS/Android support
- Native features: Camera, Location, Notifications
- Offline capability for core features

### Frontend Features  
- Responsive design with Tailwind CSS
- Real-time updates via Socket.io
- Progressive Web App capabilities
- Image galleries and document generation
- Multi-language support ready

### Backend Scalability
- Horizontal scaling ready with Redis sessions
- Database connection pooling
- Background job processing with Agenda
- File storage abstraction (local/S3)
- Comprehensive logging with Winston

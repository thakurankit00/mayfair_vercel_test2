# Mayfair Hotel Management System

A comprehensive hotel management system for **Mayfair Hotel** located near BSNL Exchange, Mandi, Himachal Pradesh.

## 🏨 Hotel Information

**Name:** Mayfair  
**Location:** Near BSNL Exchange, Mandi, Himachal Pradesh  

### Amenities
- ✅ Free Parking
- 🍸 Sky Bar & Lounge  
- 📍 10 meters from main market
- 🚌 500 meters from bus stand

## 📋 Project Overview

This is a full-stack hotel management system that provides comprehensive solutions for hotel operations, restaurant management, and customer service across multiple platforms (Web, iOS, Android).

## 🎯 Functional Requirements

### Customer Features
- **Room Booking:** View and book available hotel rooms
- **Restaurant Reservation:** View and book restaurant tables
- **Multi-platform Access:** Web, iOS, and Android applications

### Receptionist Features
- **Room Management:** View, manage hotel room bookings
- **Check-in/Check-out:** Process guest arrivals and departures
- **Room Configuration:** Update room types, images, and offers
- **Restaurant Management:** Update menu, reserve tables, manage seating
- **Price Management:** Update prices across multiple booking platforms
- **Integration Management:** Manage listings on Google Maps, MakeMyTrip, Airbnb, Yatra, EaseMyTrip, Booking.com, Trivago

### Waiter Features
- **Order Management:** Access restaurant and bar menus
- **Customer Service:** Place orders for customers

### Chef Features
- **Order Processing:** View restaurant orders from customers and waiters
- **Status Updates:** Update order preparation status

### Bartender Features
- **Bar Orders:** View bar orders from customers and waiters
- **Order Status:** Update drink preparation status

### Manager Features
- **Reporting:** View comprehensive reports for hotel, restaurant, and bar operations

### Admin Features
- **Full Access:** All manager permissions plus staff management
- **User Management:** Manage staff members and their roles

## 🔧 Non-Functional Requirements

### Platform Support
- **iOS Application:** Native iOS app for mobile users
- **Android Application:** Native Android app for mobile users  
- **Web Application:** Responsive web interface

### Performance & Scalability
- Handle large number of concurrent users and requests
- Real-time updates for room availability and pricing
- Optimized database queries for reporting

### Third-Party Integrations
- **Booking Platforms:** MakeMyTrip, Airbnb, EaseMyTrip, Booking.com, Trivago
- **Payment Processing:** Integrated payment gateway with minimal commission
- **Maps Integration:** Google Maps for location services
- **Real-time Sync:** Automatic price and availability updates across all platforms

### Security & Reliability
- Secure user authentication and authorization
- Role-based access control
- Data encryption and secure API communications

## 🏗️ Architecture

### Technology Stack
- **Backend:** Node.js with Express.js
- **Database:** PostgreSQL with Redis for caching
- **Frontend:** React.js with modern UI components
- **Mobile:** React Native for cross-platform development
- **Authentication:** JWT-based authentication
- **API:** RESTful API design with comprehensive documentation

### Project Structure
```
mayfair-hotel-management/
├── backend/                 # Node.js API server
│   ├── src/
│   │   ├── controllers/     # Request handlers
│   │   ├── middleware/      # Authentication, validation
│   │   ├── models/          # Database models
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   └── utils/           # Helper functions
│   ├── config/              # Configuration files
│   └── tests/               # API tests
├── frontend/                # React.js web application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── services/        # API services
│   │   └── utils/           # Utility functions
│   └── public/              # Static assets
├── mobile/                  # React Native app
│   ├── src/
│   │   ├── components/      # Mobile UI components
│   │   ├── screens/         # Screen components
│   │   ├── navigation/      # Navigation setup
│   │   └── services/        # Mobile API services
│   └── assets/              # Mobile assets
├── database/                # Database related files
│   ├── migrations/          # Database migrations
│   ├── seeds/               # Sample data
│   └── schemas/             # Database schema definitions
├── docs/                    # Documentation
│   ├── api/                 # API documentation
│   ├── architecture/        # System architecture docs
│   └── deployment/          # Deployment guides
└── infrastructure/          # DevOps and deployment
    ├── docker/              # Docker configurations
    ├── kubernetes/          # K8s manifests
    └── terraform/           # Infrastructure as code
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL (v13 or higher)
- Redis (v6 or higher)
- Docker (optional, for containerized development)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd mayfair-hotel-management
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   ```

4. **Set up database**
   ```bash
   # Create database and run migrations
   cd database
   # Follow migration instructions in database/README.md
   ```

5. **Configure environment variables**
   ```bash
   # Copy example environment files
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

### Development

1. **Start backend server**
   ```bash
   cd backend
   npm run dev
   ```

2. **Start frontend development server**
   ```bash
   cd frontend
   npm start
   ```

3. **Start mobile development (React Native)**
   ```bash
   cd mobile
   npm start
   ```

## 📚 Documentation

- [API Documentation](docs/api/README.md)
- [Architecture Overview](docs/architecture/README.md)
- [Deployment Guide](docs/deployment/README.md)
- [Database Schema](database/schemas/README.md)

## 🤝 Contributing

Please read our contributing guidelines and ensure all pull requests follow our coding standards.

## 📄 License

This project is proprietary software for Mayfair Hotel Management.

## 📞 Support

For technical support or questions about the hotel management system, please contact the development team.

---

**Mayfair Hotel Management System** - Streamlining hotel operations with modern technology.

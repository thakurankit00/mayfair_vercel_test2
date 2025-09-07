# Mayfair Hotel Management System - Frontend

This is the React.js frontend application for the Mayfair Hotel Management System.

## 🚀 Quick Start

### Prerequisites
- Node.js 18 or higher
- npm 8 or higher

### Development Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

3. **Start development server**
   ```bash
   npm start
   ```

4. **Open your browser**
   Navigate to `http://localhost:3001`

## 🔐 Authentication

The application includes a complete authentication system with:
- **Role-based access control** (7 user roles: customer, receptionist, waiter, chef, bartender, manager, admin)
- **Protected routes** with automatic redirects
- **JWT token management** with localStorage persistence

### Quick Login (Testing)
Use the quick login buttons on the login page to test different user roles:
- **Customer**: `john.customer@example.com`
- **Receptionist**: `sarah.receptionist@mayfairhotel.com`
- **Manager**: `mike.manager@mayfairhotel.com`
- **Chef**: `anna.chef@mayfairhotel.com`

*Password can be anything for testing purposes*

## 🏗️ Architecture

### Key Features Implemented
- ✅ **Authentication System** - Login, logout, role-based access
- ✅ **Layout Components** - Header, sidebar, main layout with responsive design
- ✅ **Dashboard** - Role-based dashboards with metrics and quick actions
- ✅ **Navigation** - Dynamic sidebar navigation based on user roles
- ✅ **Mock Data Services** - Complete API simulation for all entities
- ✅ **Error Handling** - Error boundaries and user-friendly error messages
- ✅ **Loading States** - Consistent loading spinners throughout the app

### Technology Stack
- **React 18** with functional components and hooks
- **React Router 6** for navigation and protected routes
- **Tailwind CSS** for styling and responsive design
- **Context API** for state management (authentication)
- **Mock API Services** for development and testing

### Project Structure
```
frontend/src/
├── components/
│   ├── auth/              # Authentication components
│   ├── common/            # Reusable UI components
│   ├── dashboard/         # Dashboard components
│   └── layout/            # Layout components (header, sidebar)
├── contexts/              # React contexts (AuthContext)
├── data/                  # Mock data definitions
├── services/              # API services (mock implementation)
├── App.js                 # Main app component with routing
├── index.js               # Entry point
└── index.css              # Global styles and Tailwind config
```

## 🎨 UI Components

### Available Tailwind Classes
The project includes custom Tailwind component classes:
- `.btn-primary`, `.btn-secondary`, `.btn-danger` - Button styles
- `.form-input`, `.form-label` - Form element styles
- `.card`, `.card-header`, `.card-body` - Card layouts
- `.table`, `.table-header`, `.table-cell` - Table styles
- `.badge-*` - Status badges with different colors

### Role-Based Navigation
The sidebar dynamically shows menu items based on user roles:
- **All Users**: Dashboard, Restaurant, Bookings
- **Customers**: Rooms (booking view)
- **Staff**: Orders, specific management features
- **Managers/Admins**: Reports, Settings, User Management

## 📊 Mock Data

The application includes comprehensive mock data for:
- **Users** - Sample users across all roles
- **Room Types** - Different room categories with amenities
- **Bookings** - Sample hotel bookings with statuses
- **Menu Items** - Restaurant and bar menu with categories
- **Orders** - Sample restaurant and bar orders
- **Dashboard Metrics** - Revenue, occupancy, and performance data

## 🔄 Development Workflow

### Available Scripts
- `npm start` - Start development server on port 3001
- `npm build` - Build for production
- `npm test` - Run test suite
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues automatically
- `npm run format` - Format code with Prettier

### Next Steps for Development
The foundation is complete! You can now:

1. **Build specific pages** - Replace placeholder components with full implementations
2. **Add real API integration** - Replace mock services with actual backend calls
3. **Implement additional features** - Room booking flow, order management, reporting charts
4. **Add more components** - Forms, tables, modals specific to hotel operations
5. **Enhance styling** - Add animations, improve responsive design

## 🧪 Testing

The application is set up for testing with:
- **React Testing Library** for component testing
- **Jest** for unit testing
- **Mock API services** for isolated testing

## 📱 Responsive Design

The application is fully responsive and works on:
- **Desktop** - Full sidebar and header layout
- **Tablet** - Collapsible sidebar with overlay
- **Mobile** - Mobile-first responsive design with hamburger menu

## 🔒 Security Features

- **Role-based access control** with protected routes
- **JWT token management** with automatic cleanup
- **Input validation** on all forms
- **Error boundaries** for graceful error handling
- **XSS protection** with proper React practices

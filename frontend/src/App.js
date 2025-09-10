import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ErrorBoundary from './components/common/ErrorBoundary';
import Layout from './components/layout/Layout';
import LoginForm from './components/auth/LoginForm';
import Dashboard from './components/dashboard/Dashboard';
import RoomsPage from './components/rooms/RoomsPage';
import RestaurantPage from './components/restaurant/RestaurantPage';
import WaiterOrderInterface from './components/waiter/WaiterOrderInterface';

// Placeholder components for routes that aren't built yet
const PlaceholderPage = ({ title }) => (
  <div className="p-6">
    <div className="bg-white rounded-lg shadow p-8 text-center">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">{title}</h1>
      <p className="text-gray-600">This page is under development.</p>
      <div className="mt-4">
        <div className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
          🚧 Coming Soon
        </div>
      </div>
    </div>
  </div>
);

const App = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <SocketProvider>
          <Router>
            <div className="App">
            <Routes>
              {/* Public routes */}
              <Route 
                path="/login" 
                element={
                  <ProtectedRoute requireAuth={false}>
                    <LoginForm />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/register" 
                element={
                  <ProtectedRoute requireAuth={false}>
                    <PlaceholderPage title="Register" />
                  </ProtectedRoute>
                } 
              />

              {/* Protected routes with layout */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Dashboard />
                    </Layout>
                  </ProtectedRoute>
                } 
              />

              {/* Room management routes */}
              <Route 
                path="/rooms" 
                element={
                  <ProtectedRoute roles={['customer', 'receptionist', 'manager', 'admin']}>
                    <Layout>
                      <RoomsPage />
                    </Layout>
                  </ProtectedRoute>
                } 
              />

              {/* Restaurant routes */}
              <Route 
                path="/restaurant" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <RestaurantPage />
                    </Layout>
                  </ProtectedRoute>
                } 
              />

              {/* Orders routes */}
              <Route 
                path="/orders" 
                element={
                  <ProtectedRoute roles={['waiter', 'chef', 'bartender', 'manager', 'admin']}>
                    <Layout>
                      <PlaceholderPage title="Order Management" />
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              
              {/* Waiter Interface */}
              <Route 
                path="/waiter" 
                element={
                  <ProtectedRoute roles={['waiter', 'manager', 'admin']}>
                    <Layout>
                      <WaiterOrderInterface />
                    </Layout>
                  </ProtectedRoute>
                } 
              />

              {/* Bookings routes */}
              <Route 
                path="/bookings" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <PlaceholderPage title="Bookings" />
                    </Layout>
                  </ProtectedRoute>
                } 
              />

              {/* Reports routes */}
              <Route 
                path="/reports" 
                element={
                  <ProtectedRoute roles={['manager', 'admin']}>
                    <Layout>
                      <PlaceholderPage title="Reports & Analytics" />
                    </Layout>
                  </ProtectedRoute>
                } 
              />

              {/* User management routes */}
              <Route 
                path="/users" 
                element={
                  <ProtectedRoute roles={['admin']}>
                    <Layout>
                      <PlaceholderPage title="User Management" />
                    </Layout>
                  </ProtectedRoute>
                } 
              />

              {/* Settings routes */}
              <Route 
                path="/settings" 
                element={
                  <ProtectedRoute roles={['manager', 'admin']}>
                    <Layout>
                      <PlaceholderPage title="Settings" />
                    </Layout>
                  </ProtectedRoute>
                } 
              />

              {/* Profile route */}
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <PlaceholderPage title="User Profile" />
                    </Layout>
                  </ProtectedRoute>
                } 
              />

              {/* Unauthorized route */}
              <Route 
                path="/unauthorized" 
                element={
                  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6 text-center">
                      <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                        <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.19 2.5 1.732 2.5z" />
                        </svg>
                      </div>
                      <h2 className="text-lg font-semibold text-gray-900 mb-2">Access Denied</h2>
                      <p className="text-gray-600 mb-4">
                        You don't have permission to access this page.
                      </p>
                      <button
                        onClick={() => window.history.back()}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition duration-200"
                      >
                        Go Back
                      </button>
                    </div>
                  </div>
                } 
              />

              {/* Default redirect */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              
              {/* 404 route */}
              <Route 
                path="*" 
                element={
                  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6 text-center">
                      <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4">
                        <svg className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <h2 className="text-lg font-semibold text-gray-900 mb-2">Page Not Found</h2>
                      <p className="text-gray-600 mb-4">
                        The page you're looking for doesn't exist.
                      </p>
                      <button
                        onClick={() => window.location.href = '/dashboard'}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition duration-200"
                      >
                        Go to Dashboard
                      </button>
                    </div>
                  </div>
                } 
              />
            </Routes>
            </div>
          </Router>
        </SocketProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;

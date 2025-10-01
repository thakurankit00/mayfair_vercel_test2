import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user is already logged in
    const initializeAuth = () => {
      try {
        const currentUser = authApi.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
        // Clear invalid token
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await authApi.login(email, password);
      setUser(response.user);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await authApi.register(userData);
      setUser(response.user);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await authApi.logout();
      setUser(null);
    } catch (err) {
      setError(err.message);
      console.error('Logout error:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  const clearError = () => {
    setError(null);
  };

  const value = {
    user,
    login,
    register,
    logout,
    updateUser,
    loading,
    error,
    clearError,
    isAuthenticated: !!user,
    isCustomer: user?.role === 'customer',
    isStaff: user?.role && ['receptionist', 'waiter', 'chef', 'bartender', 'manager', 'admin'].includes(user.role),
    isManager: user?.role === 'manager',
    isAdmin: user?.role === 'admin',
    hasRole: (role) => user?.role === role,
    hasAnyRole: (roles) => user?.role && roles.includes(user.role)
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

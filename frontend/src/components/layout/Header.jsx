import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../contexts/SocketContext';
import NotificationDropdown from './NotificationDropdown';
const Header = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);
  const { notifications, unreadCount, clearNotifications, markNotificationAsRead, removeNotification } = useSocket();

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showNotifications]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Enhanced notification handlers
  const handleMarkAllAsRead = () => {
    notifications.forEach(notification => {
      if (!notification.read) {
        markNotificationAsRead(notification.id);
      }
    });
  };

  const handleClearNotification = (notificationId) => {
    // Remove specific notification completely
    removeNotification(notificationId);
  };

  const handleNotificationToggle = () => {
    setShowNotifications(!showNotifications);
  };

  const getRoleDisplay = (role) => {
    const roleMap = {
      customer: 'Customer',
      receptionist: 'Receptionist',
      waiter: 'Waiter',
      chef: 'Chef',
      bartender: 'Bartender',
      manager: 'Manager',
      admin: 'Administrator'
    };
    return roleMap[role] || role;
  };

  return (
    <header className="bg-white shadow-lg border-b border-gray-200">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side - Logo and hamburger menu */}
          <div className="flex items-center">
            {/* Hamburger menu button */}
            <button
              onClick={toggleSidebar}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 md:hidden"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            {/* Logo */}
            <div className="flex items-center ml-2 md:ml-0">
              <h1 className="text-xl font-bold font-hightower text-light-orange">MayFair Hotel</h1>
              <span className="ml-2 text-sm text-gray-500 hidden sm:inline">Management System</span>
            </div>
          </div>

          {/* Right side - Notifications and user menu */}
          <div className="flex items-center space-x-4">
            {/* Enhanced Notifications bell + dropdown */}
            <div className="relative" ref={notificationRef}>
              {/* Bell button with enhanced styling */}
              <button
                onClick={handleNotificationToggle}
                className={`
                  relative p-2 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500
                  ${showNotifications
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-500 hover:text-gray-600 hover:bg-gray-100'
                  }
                `}
              >
                {/* Enhanced Bell icon with animation */}
                <svg
                  className={`h-6 w-6 transition-transform duration-200 ${unreadCount > 0 ? 'animate-pulse' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>

                {/* Enhanced Badge with animation */}
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center h-5 w-5 text-xs font-bold text-white bg-red-500 rounded-full animate-bounce">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Enhanced Dropdown */}
              {showNotifications && (
                <NotificationDropdown
                  notifications={notifications}
                  onClose={() => setShowNotifications(false)}
                  onMarkAsRead={markNotificationAsRead}
                  onMarkAllAsRead={handleMarkAllAsRead}
                  onClearAll={() => {
                    clearNotifications();
                    setShowNotifications(false);
                  }}
                  onClearNotification={handleClearNotification}
                />
              )}
            </div>


            {/* User profile dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <div className="flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-gray-100">
                  {/* Avatar */}
                  <div className="h-8 w-8 rounded-full bg-light-orange flex items-center justify-center">
                    <span className="text-white font-medium text-sm">
                      {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                    </span>
                  </div>
                  
                  {/* User info */}
                  <div className="text-left hidden sm:block">
                    <div className="font-medium text-gray-900">
                      {user?.firstName} {user?.lastName}
                    </div>
                    <div className="text-xs text-gray-500">
                      {getRoleDisplay(user?.role)}
                    </div>
                  </div>
                  
                  {/* Dropdown arrow */}
                  <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {/* Dropdown menu */}
              {showProfileMenu && (
                <>
                  {/* Overlay to close dropdown */}
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowProfileMenu(false)}
                  />
                  
                  <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20">
                    <div className="py-1">
                      <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-200">
                        <div className="font-medium">{user?.firstName} {user?.lastName}</div>
                        <div className="text-xs text-gray-500">{user?.email}</div>
                      </div>
                      
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          navigate('/profile');
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Your Profile
                      </button>
                      
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          navigate('/settings');
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Settings
                      </button>
                      
                      <div className="border-t border-gray-200">
                        <button
                          onClick={() => {
                            setShowProfileMenu(false);
                            handleLogout();
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Sign out
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>    
    </header>
  );
};

export default Header;

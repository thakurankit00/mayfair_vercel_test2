import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';

/**
 * RouteChangeHandler - Handles route changes for cross-interface functionality
 * This component must be placed inside the Router context to access useLocation()
 */
const RouteChangeHandler = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { refreshNotifications } = useSocket();

  useEffect(() => {
    // Only handle route changes for managers/admins who can access multiple interfaces
    if (user && ['manager', 'admin'].includes(user.role)) {
      const currentPath = location.pathname;
      const isInterfaceSwitch = currentPath === '/waiter' || currentPath === '/kitchen';
      
      if (isInterfaceSwitch) {
        console.log('🔄 [ROUTE CHANGE] Detected interface switch to:', currentPath, '- refreshing notifications');
        
        // Small delay to ensure socket rooms are properly joined before refreshing notifications
        setTimeout(() => {
          refreshNotifications();
        }, 500);
      }
    }
  }, [location.pathname, user, refreshNotifications]);

  // This component doesn't render anything - it's just for handling side effects
  return null;
};

export default RouteChangeHandler;

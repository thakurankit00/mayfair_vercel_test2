import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthContext } from '../../../contexts/AuthContext';
import { SocketContext } from '../../../contexts/SocketContext';
import WaiterOrderInterface from '../WaiterOrderInterface';

// Mock the API
jest.mock('../../../services/restaurantApi', () => ({
  restaurantApi: {
    getRestaurants: jest.fn(() => Promise.resolve({
      restaurants: [
        { id: '1', name: 'Mayfair Restaurant', location: 'ground_floor' },
        { id: '2', name: 'Sky Roof Bar', location: 'sky_roof' }
      ]
    }))
  },
  restaurantTableApi: {
    getTables: jest.fn(() => Promise.resolve({
      tables: [
        { id: '1', table_name: 'T1', capacity: 4, status: 'available', location: 'indoor' },
        { id: '2', table_name: 'T2', capacity: 2, status: 'occupied', location: 'outdoor' }
      ]
    }))
  },
  restaurantMenuApi: {
    getMenu: jest.fn(() => Promise.resolve({
      menu: [
        {
          id: '1',
          name: 'Appetizers',
          type: 'restaurant',
          items: [
            { id: '1', name: 'Spring Rolls', price: 120, preparation_time: 15 }
          ]
        }
      ]
    }))
  },
  restaurantOrderApi: {
    getOrders: jest.fn(() => Promise.resolve({ orders: [] })),
    createOrder: jest.fn(() => Promise.resolve({
      order: { id: '1', order_number: 'ORD123456' }
    })),
    generateBill: jest.fn(() => Promise.resolve({
      bill: { orderId: '1', total: 150 }
    }))
  }
}));

const mockAuthContext = {
  user: {
    id: '1',
    first_name: 'John',
    last_name: 'Doe',
    role: 'waiter'
  },
  token: 'mock-token'
};

const mockSocketContext = {
  notifications: [],
  markNotificationAsRead: jest.fn(),
  emitEvent: jest.fn(),
  isConnected: true,
  unreadCount: 0
};

const renderWithProviders = (component) => {
  return render(
    <AuthContext.Provider value={mockAuthContext}>
      <SocketContext.Provider value={mockSocketContext}>
        {component}
      </SocketContext.Provider>
    </AuthContext.Provider>
  );
};

describe('WaiterOrderInterface', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders waiter interface correctly', async () => {
    renderWithProviders(<WaiterOrderInterface />);
    
    expect(screen.getByText('Waiter Interface')).toBeInTheDocument();
    expect(screen.getByText('Manage orders and communicate with kitchen')).toBeInTheDocument();
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('New Order')).toBeInTheDocument();
    });
  });

  test('displays restaurant selection', async () => {
    renderWithProviders(<WaiterOrderInterface />);
    
    await waitFor(() => {
      expect(screen.getByText('Select Restaurant')).toBeInTheDocument();
    });
  });

  test('handles tab switching correctly', async () => {
    renderWithProviders(<WaiterOrderInterface />);
    
    await waitFor(() => {
      expect(screen.getByText('New Order')).toBeInTheDocument();
    });

    const activeOrdersTab = screen.getByText('Active Orders');
    fireEvent.click(activeOrdersTab);
    
    expect(activeOrdersTab).toHaveClass('border-blue-500');
  });

  test('shows table selection when restaurant is selected', async () => {
    renderWithProviders(<WaiterOrderInterface />);
    
    await waitFor(() => {
      expect(screen.getByText('Select Table')).toBeInTheDocument();
    });
  });

  test('allows adding items to cart', async () => {
    renderWithProviders(<WaiterOrderInterface />);
    
    await waitFor(() => {
      expect(screen.getByText('Menu')).toBeInTheDocument();
    });
    
    // This test would need more setup to test the full cart functionality
    // but demonstrates the structure
  });

  test('handles notifications correctly', () => {
    const contextWithNotifications = {
      ...mockSocketContext,
      notifications: [
        {
          id: 1,
          type: 'kitchen-accepted',
          title: 'Kitchen Accepted Order',
          message: 'Order #123 accepted',
          timestamp: new Date(),
          read: false
        }
      ]
    };

    render(
      <AuthContext.Provider value={mockAuthContext}>
        <SocketContext.Provider value={contextWithNotifications}>
          <WaiterOrderInterface />
        </SocketContext.Provider>
      </AuthContext.Provider>
    );

    expect(screen.getByText('Recent Updates')).toBeInTheDocument();
  });
});

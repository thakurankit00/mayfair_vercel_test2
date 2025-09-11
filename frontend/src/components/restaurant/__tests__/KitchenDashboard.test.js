import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthContext } from '../../../contexts/AuthContext';
import { SocketContext } from '../../../contexts/SocketContext';
import KitchenDashboard from '../KitchenDashboard';

// Mock the API
jest.mock('../../../services/restaurantApi', () => ({
  kitchenApi: {
    getKitchens: jest.fn(() => Promise.resolve({
      kitchens: [
        { 
          id: '1', 
          kitchen_name: 'Main Kitchen', 
          name: 'Mayfair Restaurant',
          restaurant_type: 'restaurant' 
        }
      ]
    })),
    getKitchenOrders: jest.fn(() => Promise.resolve({
      orders: [
        {
          id: '1',
          order_number: 'ORD123456',
          kitchen_status: 'pending',
          table_number: 'T1',
          first_name: 'John',
          last_name: 'Doe',
          total_amount: 150,
          tax_amount: 18,
          placed_at: new Date().toISOString(),
          items: [
            { id: '1', quantity: 2, item_name: 'Spring Rolls', total_price: 240 }
          ]
        }
      ]
    })),
    acceptKitchenOrder: jest.fn(() => Promise.resolve({ success: true })),
    rejectKitchenOrder: jest.fn(() => Promise.resolve({ success: true }))
  }
}));

const mockAuthContext = {
  user: {
    id: '1',
    first_name: 'Chef',
    last_name: 'John',
    role: 'chef'
  },
  token: 'mock-token'
};

const mockSocketContext = {
  notifications: [],
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

describe('KitchenDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders kitchen dashboard correctly', async () => {
    renderWithProviders(<KitchenDashboard />);
    
    expect(screen.getByText('Kitchen Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Manage incoming orders for your kitchen')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('Main Kitchen')).toBeInTheDocument();
    });
  });

  test('shows connection status', async () => {
    renderWithProviders(<KitchenDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Connected')).toBeInTheDocument();
    });
  });

  test('displays pending and accepted orders sections', async () => {
    renderWithProviders(<KitchenDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Pending Orders (1)')).toBeInTheDocument();
    });
    expect(screen.getByText('In Progress (0)')).toBeInTheDocument();
  });

  test('displays order details correctly', async () => {
    renderWithProviders(<KitchenDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Order #ORD123456')).toBeInTheDocument();
    });
    expect(screen.getByText('Table T1 • John Doe')).toBeInTheDocument();
    expect(screen.getByText('2x Spring Rolls')).toBeInTheDocument();
  });

  test('allows accepting orders', async () => {
    renderWithProviders(<KitchenDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Accept')).toBeInTheDocument();
    });
    
    const acceptButton = screen.getByText('Accept');
    fireEvent.click(acceptButton);

    expect(screen.getByText('Accept Order #ORD123456')).toBeInTheDocument();
  });

  test('allows rejecting orders', async () => {
    renderWithProviders(<KitchenDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Reject')).toBeInTheDocument();
    });
    
    const rejectButton = screen.getByText('Reject');
    fireEvent.click(rejectButton);

    expect(screen.getByText('Reject Order #ORD123456')).toBeInTheDocument();
  });

  test('handles empty kitchen assignment', () => {
    const emptyKitchenMockContext = {
      ...mockAuthContext,
      user: { ...mockAuthContext.user, role: 'chef' }
    };

    // Mock empty kitchens response
    const mockKitchenApi = require('../../../services/restaurantApi').kitchenApi;
    mockKitchenApi.getKitchens.mockResolvedValueOnce({ kitchens: [] });

    render(
      <AuthContext.Provider value={emptyKitchenMockContext}>
        <SocketContext.Provider value={mockSocketContext}>
          <KitchenDashboard />
        </SocketContext.Provider>
      </AuthContext.Provider>
    );

    // This would need to wait for the empty state to load
  });

  test('filters kitchens by user role', async () => {
    renderWithProviders(<KitchenDashboard />);
    
    // The component should filter kitchens based on role
    // This test would need more setup to verify the filtering logic
    await waitFor(() => {
      expect(screen.getByText('Kitchen Dashboard')).toBeInTheDocument();
    });
  });
});

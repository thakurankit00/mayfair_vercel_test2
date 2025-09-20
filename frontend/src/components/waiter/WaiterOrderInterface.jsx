import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import {
  restaurantApi,
  restaurantTableApi,
  restaurantMenuApi,
  restaurantOrderApi
} from '../../services/restaurantApi';
import { roomApi } from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import BillModal from '../payment/BillModal';
import PaymentModal from '../payment/PaymentModal';
const WaiterOrderInterface = () => {
  const { user } = useAuth();
  const { notifications, markNotificationAsRead, emitEvent } = useSocket();
  
  // Core state
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [menu, setMenu] = useState([]);
  const [currentOrders, setCurrentOrders] = useState([]);
  const [occupiedRooms, setOccupiedRooms] = useState([]);
  
  // Order building state
  const [activeOrder, setActiveOrder] = useState(null);
  const [cart, setCart] = useState([]);
  const [orderType, setOrderType] = useState('restaurant'); // 'restaurant' or 'room-service'
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [customerInfo, setCustomerInfo] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: ''
  });
  const [specialInstructions, setSpecialInstructions] = useState('');
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('new-order'); // new-order, active-orders, history
  const [showBillModal, setShowBillModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedOrderForBill, setSelectedOrderForBill] = useState(null);
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState(null);

  // Order management states
  const [showEditOrderModal, setShowEditOrderModal] = useState(false);
  const [showEditItemModal, setShowEditItemModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Load occupied rooms
  const loadOccupiedRooms = async () => {
    try {
      console.log('🏨 [ROOMS] Fetching occupied rooms...');
      const roomsData = await roomApi.getOccupiedRooms();
      setOccupiedRooms(roomsData.rooms || []);
      console.log('🏨 [ROOMS] Occupied rooms loaded:', roomsData.rooms?.length || 0);
    } catch (err) {
      console.error('❌ [ROOMS] Failed to fetch occupied rooms:', err);
      alert('Failed to load occupied rooms. Room service may not be available.');
      setOccupiedRooms([]);
    }
  };

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        // Build order filters based on user role
        const orderFilters = {};
        // If user is a waiter, only show their orders
        // Admin and manager can see all orders
        if (user.role === 'waiter') {
          orderFilters.waiter_id = user.id;
        }
      const [restaurantsData, ordersData] = await Promise.all([
        restaurantApi.getRestaurants(),
        restaurantOrderApi.getOrders(orderFilters)
      ]);

      // Sort orders by latest activity (updated_at or created_at)
      const sortedOrders = (ordersData.orders || []).sort((a, b) => {
        const aTime = new Date(a.updated_at || a.created_at);
        const bTime = new Date(b.updated_at || b.created_at);
        return bTime - aTime; // Most recent first
      });

      setRestaurants(restaurantsData.restaurants || []);
      setCurrentOrders(sortedOrders);

      // Load occupied rooms separately
      await loadOccupiedRooms();

      // Refresh tables to update status (available -> has orders)
      if (selectedRestaurant) {
        const tablesData = await restaurantTableApi.getTables(selectedRestaurant);
        setTables(tablesData.tables || []);
      }

    } catch (err) {
      console.error('❌ [INIT] Failed to load initial data:', err);
      setError(err.message || 'Failed to load initial data');
    } finally {
      setLoading(false);
    }
  };

  loadInitialData();
}, [user.id, user.role]);

// Refresh occupied rooms periodically and on booking updates
useEffect(() => {
  const refreshInterval = setInterval(() => {
    if (orderType === 'room-service') {
      loadOccupiedRooms();
    }
  }, 30000); // Refresh every 30 seconds

  return () => clearInterval(refreshInterval);
}, [orderType]);

// Listen for booking calendar updates (if socket is available)
useEffect(() => {
  if (emitEvent && notifications) {
    const handleBookingUpdate = (notification) => {
      if (notification.type === 'booking-update' || notification.type === 'room-status-change') {
        console.log('📅 [BOOKING] Room status updated, refreshing occupied rooms...');
        loadOccupiedRooms();
      }
    };

    // Listen for booking-related notifications
    const bookingNotifications = notifications.filter(n => 
      ['booking-update', 'room-status-change', 'check-in', 'check-out'].includes(n.type)
    );
    
    if (bookingNotifications.length > 0) {
      loadOccupiedRooms();
    }
  }
}, [notifications, emitEvent]);

// Load restaurant-specific data when restaurant is selected
useEffect(() => {
  const loadRestaurantData = async () => {
    if (!selectedRestaurant) {
      setTables([]);
      setMenu([]);
      return;
    }

    try {
      setLoading(true);
      const [tablesData, menuData] = await Promise.all([
        restaurantTableApi.getTables(selectedRestaurant),
        restaurantMenuApi.getMenu(selectedRestaurant)
      ]);

      setTables(tablesData.tables || []);
      setMenu(menuData.menu || []);
    } catch (err) {
      setError(err.message || 'Failed to load restaurant data');
    } finally {
      setLoading(false);
    }
  };

  loadRestaurantData();
}, [selectedRestaurant]);

// Load orders function
const loadOrders = async () => {
  try {
    console.log('📝 [ORDERS] Refreshing orders...');
    const orderFilters = {};
    if (user.role === 'waiter') {
      orderFilters.waiter_id = user.id;
    }
    
    const ordersData = await restaurantOrderApi.getOrders(orderFilters);
    const sortedOrders = (ordersData.orders || []).sort((a, b) => {
      const aTime = new Date(a.updated_at || a.created_at);
      const bTime = new Date(b.updated_at || b.created_at);
      return bTime - aTime;
    });
    
    setCurrentOrders(sortedOrders);
    console.log('📝 [ORDERS] Orders refreshed:', sortedOrders.length);
  } catch (err) {
    console.error('❌ [ORDERS] Failed to load orders:', err);
    setError(err.message || 'Failed to load orders');
  }
};

// Start new order for a table
const startNewOrder = (table) => {
  setSelectedTable(table);
  setActiveOrder({
    tableId: table.id,
    tableName: table.table_name || `Table ${table.table_number}`,
    restaurantId: selectedRestaurant,
    orderType: 'restaurant',
    rounds: []
  });
  setCart([]);
};

// Start new room service order
const startRoomServiceOrder = (room) => {
  console.log('🏨 [ORDER] Starting room service order for room:', room.room_number);
  setSelectedRoom(room);
  setActiveOrder({
    roomId: room.id,
    roomNumber: room.room_number,
    guestName: `${room.guest_first_name} ${room.guest_last_name}`,
    restaurantId: selectedRestaurant,
    orderType: 'room-service',
    rounds: []
  });
  setCustomerInfo({
    firstName: room.guest_first_name || '',
    lastName: room.guest_last_name || '',
    phone: room.guest_phone || '',
    email: room.guest_email || ''
  });
  setCart([]);
};

// Add item to cart
const addItemToCart = (item) => {
  const existingItem = cart.find(cartItem => cartItem.id === item.id);
  if (existingItem) {
    updateCartItem(item.id, { quantity: existingItem.quantity + 1 });
  } else {
    setCart([...cart, { ...item, quantity: 1, specialInstructions: '' }]);
  }
};

// Update cart item
const updateCartItem = (itemId, updates) => {
  setCart(cart.map(item => 
    item.id === itemId ? { ...item, ...updates } : item
  ));
};

// Remove item from cart
const removeFromCart = (itemId) => {
  setCart(cart.filter(item => item.id !== itemId));
};

// Add new round to order
const addNewRound = () => {
  setCart([]);
  setSpecialInstructions('');
};

// Validate order before submission
const validateOrder = () => {
  if (activeOrder.orderType === 'restaurant' && !activeOrder.tableId) {
    throw new Error('Please select a table for restaurant order');
  }
  
  if (activeOrder.orderType === 'room-service') {
    if (!activeOrder.roomId) {
      throw new Error('Please select a room for room service order');
    }
    
    // Check if room is still occupied
    const roomStillOccupied = occupiedRooms.find(room => room.id === activeOrder.roomId);
    if (!roomStillOccupied) {
      throw new Error('Selected room is no longer occupied. Please refresh and select another room.');
    }
  }
};

// Submit order round
const submitOrderRound = async () => {
  if (cart.length === 0) return;

  try {
    setLoading(true);
    
    // Validate order before submission
    validateOrder();
    
    console.log(`📝 [ORDER] Submitting ${activeOrder.orderType} order:`, {
      type: activeOrder.orderType,
      location: activeOrder.orderType === 'restaurant' ? `Table ${activeOrder.tableId}` : `Room ${activeOrder.roomNumber}`,
      items: cart.length
    });
    
    const orderData = {
      restaurant_id: selectedRestaurant,
      order_type: activeOrder.orderType,
      customer_info: customerInfo,
      items: cart.map(item => ({
        menu_item_id: item.id,
        quantity: item.quantity,
        special_instructions: item.specialInstructions
      })),
      special_instructions: specialInstructions
    };

    // Add table or room specific data
    if (activeOrder.orderType === 'restaurant') {
      orderData.table_id = activeOrder.tableId;
    } else if (activeOrder.orderType === 'room-service') {
      orderData.room_id = activeOrder.roomId;
      orderData.guest_name = activeOrder.guestName;
    }

    let response;
    if (activeOrder.latestOrderId) {
      // Adding to existing order
      response = await restaurantOrderApi.addItemsToOrder(activeOrder.latestOrderId, {
        items: orderData.items,
        special_instructions: specialInstructions
      });
    } else {
      // Creating new order
      response = await restaurantOrderApi.createOrder(orderData);
    }

    // Update active order with new round
    const newRound = {
      id: activeOrder.rounds.length + 1,
      items: cart,
      timestamp: new Date(),
      status: 'submitted',
      orderId: response.order?.id || activeOrder.latestOrderId,
      orderNumber: response.order?.order_number
    };

    setActiveOrder({
      ...activeOrder,
      rounds: [...activeOrder.rounds, newRound],
      latestOrderId: response.order?.id || activeOrder.latestOrderId
    });

    setCart([]);
    setSpecialInstructions('');
    
    // Refresh orders and rooms if room service
    await loadOrders();
    if (activeOrder.orderType === 'room-service') {
      await loadOccupiedRooms();
    }
    
    console.log('✅ [ORDER] Order round submitted successfully');
  } catch (err) {
    console.error('❌ [ORDER] Failed to submit order:', err);
    setError(err.message || 'Failed to submit order');
  } finally {
    setLoading(false);
  }
};

  const finishOrderSession = () => {
    console.log('📝 [ORDER] Finishing order session');
    setActiveOrder(null);
    setSelectedTable(null);
    setSelectedRoom(null);
    setOrderType('restaurant');
    setCart([]);
    setCustomerInfo({ firstName: '', lastName: '', phone: '', email: '' });
    setSpecialInstructions('');
  };

  const generateBill = async (order) => {
    try {
      setLoading(true);
      console.log('🧾 [WAITER] Generating bill for order:', order.id);

      const billData = await restaurantOrderApi.generateBill(order.id);
      console.log('🧾 [WAITER] Bill generated successfully:', billData);

      // Set the order with the bill data for the modal
      setSelectedOrderForBill({
        ...order,
        bill: billData.bill || billData, // Handle both response formats
        status: 'billed' // Update status to reflect bill generation
      });
      setShowBillModal(true);

      // Refresh orders to show updated status
      await loadOrders();
      setError(''); // Clear any previous errors
    } catch (err) {
      console.error('🧾 [WAITER] Error generating bill:', err);
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to generate bill';

      // Handle specific error cases
      if (err.response?.data?.error?.code === 'ORDER_NOT_READY_FOR_BILLING') {
        setError('This order has already been billed or is not ready for billing.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const viewBill = async (order) => {
    try {
      setLoading(true);
      console.log('🧾 [WAITER] Viewing bill for order:', order.id);

      const billData = await restaurantOrderApi.getBill(order.id);
      console.log('🧾 [WAITER] Bill retrieved successfully:', billData);

      // Set the order with the bill data for the modal
      setSelectedOrderForBill({
        ...order,
        bill: billData.bill || billData, // Handle both response formats
      });
      setShowBillModal(true);

      setError(''); // Clear any previous errors
    } catch (err) {
      console.error('🧾 [WAITER] Error viewing bill:', err);
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to retrieve bill';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPayment = (order) => {
    setSelectedOrderForPayment(order);
    setShowPaymentModal(true);
  };

  const handlePaymentInitiated = async () => {
    // Refresh orders to show updated status
    await loadOrders();
    setShowPaymentModal(false);
    setSelectedOrderForPayment(null);
  };

  const handleCompleteOrder = async (order) => {
    try {
      setLoading(true);
      await restaurantOrderApi.completeOrder(order.id);
      await loadOrders();
      console.log('✅ Order completed successfully');
    } catch (err) {
      setError(err.message || 'Failed to complete order');
    } finally {
      setLoading(false);
    }
  };

  // Handle edit order details
  const handleEditOrder = (order) => {
    setEditingOrder(order);
    setShowEditOrderModal(true);
  };

  // Handle edit order item
  const handleEditItem = (order, item) => {
    setEditingOrder(order);
    setEditingItem(item);
    setShowEditItemModal(true);
  };

  // Handle delete order item - show confirmation modal
  const handleDeleteItem = (orderId, itemId, item, order) => {
    setItemToDelete({ orderId, itemId, item, order });
    setShowDeleteConfirmModal(true);
  };

  // Confirm delete order item
  const confirmDeleteItem = async () => {
    if (!itemToDelete) return;

    try {
      setLoading(true);
      await restaurantOrderApi.deleteOrderItem(itemToDelete.orderId, itemToDelete.itemId);
      await loadOrders();
      setError('');
      setShowDeleteConfirmModal(false);
      setItemToDelete(null);
    } catch (err) {
      setError(err.message || 'Failed to delete item');
    } finally {
      setLoading(false);
    }
  };

  // Cancel delete order item
  const cancelDeleteItem = () => {
    setShowDeleteConfirmModal(false);
    setItemToDelete(null);
  };

  // Handle update order details
  const handleUpdateOrderDetails = async (orderData) => {
    try {
      setLoading(true);
      await restaurantOrderApi.updateOrderDetails(editingOrder.id, orderData);
      await loadOrders();
      setShowEditOrderModal(false);
      setEditingOrder(null);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to update order');
    } finally {
      setLoading(false);
    }
  };

  // Handle update order item
  const handleUpdateOrderItem = async (itemData) => {
    try {
      setLoading(true);
      await restaurantOrderApi.updateOrderItem(editingOrder.id, editingItem.id, itemData);
      await loadOrders();
      setShowEditItemModal(false);
      setEditingOrder(null);
      setEditingItem(null);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to update item');
    } finally {
      setLoading(false);
    }
  };

  const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  const orderNotifications = notifications.filter(n => 
    ['kitchen-accepted', 'kitchen-rejected', 'order-update'].includes(n.type)
  );

  if (loading && restaurants.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner />
      </div>
    );
  }
  const handleAddOrderToExisting = async (order) => {
    try {
      setLoading(true);

      // Fetch full order details with items
      const fullOrderData = await restaurantOrderApi.getOrderById(order.id);
      const fullOrder = fullOrderData.order || fullOrderData;

      // Determine the restaurant ID for this order
      const orderRestaurantId = fullOrder.restaurant_id || order.restaurant_id;

      // Set the selected restaurant and load its data
      if (orderRestaurantId && orderRestaurantId !== selectedRestaurant) {
        setSelectedRestaurant(orderRestaurantId);

        // Load restaurant-specific data (tables and menu)
        try {
          const [tablesData, menuData] = await Promise.all([
            restaurantTableApi.getTables(orderRestaurantId),
            restaurantMenuApi.getMenu(orderRestaurantId)
          ]);

          setTables(tablesData.tables || []);
          setMenu(menuData.menu || []);
        } catch (err) {
          console.error('Failed to load restaurant data:', err);
        }
      }

      // Set up the active order with existing items
      setActiveOrder({
        ...fullOrder,
        tableId: fullOrder.table_id || order.table_id,
        tableName: `Table ${fullOrder.table_number || order.table_number}`,
        restaurantId: orderRestaurantId,
        latestOrderId: fullOrder.id || order.id,
        rounds: [{
          id: 1,
          items: fullOrder.items || order.items || [],
          timestamp: new Date(fullOrder.placed_at || order.placed_at),
          status: 'submitted',
          orderId: fullOrder.id || order.id,
          orderNumber: fullOrder.order_number || order.order_number
        }]
      });

      setSelectedTable({
        id: fullOrder.table_id || order.table_id,
        table_name: `Table ${fullOrder.table_number || order.table_number}`
      });

      // Start with empty cart for new items to be added
      setCart([]);

      // Pre-fill customer information
      setCustomerInfo({
        firstName: fullOrder.first_name || order.first_name || '',
        lastName: fullOrder.last_name || order.last_name || '',
        phone: fullOrder.phone || order.phone || '',
        email: fullOrder.email || order.email || ''
      });
      setSpecialInstructions('');

      // Switch to new-order tab to show the form
      setActiveTab('new-order');

    } catch (err) {
      setError(`Failed to load order details: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header with Notifications */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Waiter Interface</h1>
            <p className="mt-2 text-gray-600">
              Manage orders and communicate with kitchen
            </p>
          </div>
          
          {/* Real-time Notifications */}
          {orderNotifications.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md">
              <h3 className="font-semibold text-blue-900 mb-2">Recent Updates</h3>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {orderNotifications.slice(0, 3).map(notification => (
                  <div 
                    key={notification.id}
                    className="text-sm text-blue-800 cursor-pointer hover:text-blue-900"
                    onClick={() => markNotificationAsRead(notification.id)}
                  >
                    <span className={`${!notification.read ? 'font-medium' : ''}`}>
                      {notification.message}
                    </span>
                    <div className="text-xs text-blue-600">
                      {notification.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
          <button
            onClick={() => setError('')}
            className="mt-2 text-red-600 hover:text-red-700 text-sm font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'new-order', name: 'New Order', icon: '🆕' },
            { id: 'active-orders', name: 'Active Orders', icon: '📋', badge: currentOrders.filter(o => ['pending', 'preparing'].includes(o.status)).length },
            { id: 'history', name: 'History', icon: '📚' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center space-x-2 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.name}</span>
              {tab.badge > 0 && (
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'new-order' && (
        <NewOrderTab
          restaurants={restaurants}
          selectedRestaurant={selectedRestaurant}
          onRestaurantChange={setSelectedRestaurant}
          tables={tables}
          occupiedRooms={occupiedRooms}
          menu={menu}
          activeOrder={activeOrder}
          cart={cart}
          orderType={orderType}
          onOrderTypeChange={setOrderType}
          customerInfo={customerInfo}
          specialInstructions={specialInstructions}
          onStartNewOrder={startNewOrder}
          onStartRoomServiceOrder={startRoomServiceOrder}
          onAddItemToCart={addItemToCart}
          onUpdateCartItem={updateCartItem}
          onRemoveFromCart={removeFromCart}
          onAddNewRound={addNewRound}
          onSubmitOrderRound={submitOrderRound}
          onFinishOrderSession={finishOrderSession}
          onUpdateCustomerInfo={setCustomerInfo}
          onUpdateSpecialInstructions={setSpecialInstructions}
          cartTotal={cartTotal}
          loading={loading}
          selectedRoom={selectedRoom}
          setSelectedRoom={setSelectedRoom}
          setSelectedTable={setSelectedTable}
          setActiveOrder={setActiveOrder}
          setCart={setCart}
          loadOccupiedRooms={loadOccupiedRooms}
        />
      )}

      {activeTab === 'active-orders' && (
        <ActiveOrdersTab
          orders={currentOrders.filter(o => ['pending', 'preparing', 'ready', 'billed', 'payment_pending', 'paid'].includes(o.status))}
          onGenerateBill={generateBill}
          onViewBill={viewBill}
          onRequestPayment={handleRequestPayment}
          onCompleteOrder={handleCompleteOrder}
          onAddOrderToExisting={handleAddOrderToExisting}
          onEditOrder={handleEditOrder}
          onEditItem={handleEditItem}
          onDeleteItem={handleDeleteItem}
          loading={loading}
          tables={tables}
        />
      )}

      {activeTab === 'history' && (
        <OrderHistoryTab
          orders={currentOrders.filter(o => ['ready', 'served', 'completed', 'paid', 'cancelled'].includes(o.status))}
          loading={loading}
          userRole={user.role}
        />
      )}


      {/* Bill Generation Modal */}
      {showBillModal && selectedOrderForBill && (
        <BillModal
          isOpen={showBillModal}
          order={selectedOrderForBill}
          onClose={() => {
            setShowBillModal(false);
            setSelectedOrderForBill(null);
          }}
          onBillGenerated={(bill) => {
            console.log('📄 Bill generated:', bill);
          }}
        />
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedOrderForPayment && (
        <PaymentModal
          isOpen={showPaymentModal}
          order={selectedOrderForPayment}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedOrderForPayment(null);
          }}
          onPaymentInitiated={handlePaymentInitiated}
        />
      )}

      {/* Edit Order Modal */}
      {showEditOrderModal && editingOrder && (
        <EditOrderModal
          order={editingOrder}
          tables={tables}
          onClose={() => {
            setShowEditOrderModal(false);
            setEditingOrder(null);
          }}
          onSave={handleUpdateOrderDetails}
        />
      )}

      {/* Edit Item Modal */}
      {showEditItemModal && editingItem && editingOrder && (
        <EditItemModal
          order={editingOrder}
          item={editingItem}
          onClose={() => {
            setShowEditItemModal(false);
            setEditingItem(null);
            setEditingOrder(null);
          }}
          onSave={handleUpdateOrderItem}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmModal && itemToDelete && (
        <DeleteConfirmationModal
          item={itemToDelete.item}
          order={itemToDelete.order}
          onConfirm={confirmDeleteItem}
          onCancel={cancelDeleteItem}
        />
      )}
    </div>
  );
};

// New Order Tab Component
const NewOrderTab = ({ 
  restaurants, selectedRestaurant, onRestaurantChange,
  tables, occupiedRooms, menu, activeOrder, cart, orderType, onOrderTypeChange,
  customerInfo, specialInstructions, onStartNewOrder, onStartRoomServiceOrder,
  onAddItemToCart, onUpdateCartItem, onRemoveFromCart,
  onAddNewRound, onSubmitOrderRound, onFinishOrderSession,
  onUpdateCustomerInfo, onUpdateSpecialInstructions, cartTotal, loading,
  selectedRoom, setSelectedRoom, setSelectedTable, setActiveOrder, setCart, loadOccupiedRooms
}) => {
  const [menuFilter, setMenuFilter] = useState('all');
  
  const filteredMenu = menu.filter(category => 
    menuFilter === 'all' || category.type === menuFilter
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Panel - Restaurant & Table Selection */}
      <div className="lg:col-span-1 space-y-6">
        {/* Restaurant Selection */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Select Restaurant</h3>
          <select
            value={selectedRestaurant || ''}
            onChange={(e) => onRestaurantChange(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="">Choose Restaurant</option>
            {restaurants.map(restaurant => (
              <option key={restaurant.id} value={restaurant.id}>
                {restaurant.name} - {restaurant.location.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>

        {/* Order Type Selection */}
        {selectedRestaurant && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Order Type</h3>
            <select
              value={orderType}
              onChange={(e) => {
                onOrderTypeChange(e.target.value);
                // Reset selections when changing order type
                if (e.target.value === 'restaurant') {
                  setSelectedRoom(null);
                } else {
                  setSelectedTable(null);
                }
                setActiveOrder(null);
                setCart([]);
              }}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="restaurant">🍽️ Restaurant</option>
              <option value="room-service">🏨 Room Service</option>
            </select>
            
            {orderType === 'room-service' && occupiedRooms.length === 0 && (
              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                ⚠️ No occupied rooms available. Room service is currently unavailable.
              </div>
            )}
          </div>
        )}

        {/* Table Selection - restaurant */}
        {selectedRestaurant && orderType === 'restaurant' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Select Table</h3>
            <div className="grid grid-cols-2 gap-3">
              {tables.map(table => (
                <button
                  key={table.id}
                  onClick={() => onStartNewOrder(table)}
                  className={`p-3 rounded-lg text-sm font-medium transition-colors ${
                    activeOrder?.tableId === table.id
                      ? 'bg-blue-100 text-blue-800 border-2 border-blue-500'
                      : table.status === 'available'
                        ? 'bg-green-50 text-green-800 border border-green-200 hover:bg-green-100'
                        : table.status === 'occupied'
                        ? 'bg-orange-50 text-orange-800 border border-orange-200 hover:bg-orange-100'
                        : 'bg-gray-100 text-gray-500 border border-gray-200'
                  }`}
                >
                  <div className="font-medium">
                    {table.table_name || `Table ${table.table_number}`}
                  </div>
                  <div className="text-xs">{table.capacity} seats</div>
                  <div className="text-xs capitalize">{table.location}</div>
                  <div className="text-xs mt-1">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      table.status === 'available'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-orange-100 text-orange-700'
                    }`}>
                      {table.status === 'available' ? 'Available' : 'Has Orders'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Room Selection - Room Service */}
        {selectedRestaurant && orderType === 'room-service' && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Select Room</h3>
              <button
                onClick={loadOccupiedRooms}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                disabled={loading}
              >
                🔄 Refresh
              </button>
            </div>
            
            {/* Room Dropdown */}
            <select
              value={selectedRoom?.id || ''}
              onChange={(e) => {
                const room = occupiedRooms.find(r => r.id === e.target.value);
                if (room) onStartRoomServiceOrder(room);
              }}
              className="w-full border border-gray-300 rounded-md px-3 py-2 mb-4"
            >
              <option value="">Choose Occupied Room</option>
              {occupiedRooms.map(room => (
                <option key={room.id} value={room.id}>
                  Room {room.room_number} - {room.guest_first_name} {room.guest_last_name}
                </option>
              ))}
            </select>
            
            {/* Selected Room Details */}
            {selectedRoom && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="font-medium text-blue-900">
                  Room {selectedRoom.room_number}
                </div>
                <div className="text-sm text-blue-800">
                  Guest: {selectedRoom.guest_first_name} {selectedRoom.guest_last_name}
                </div>
                <div className="text-xs text-blue-600">
                  Check-in: {new Date(selectedRoom.check_in_date).toLocaleDateString()}
                </div>
                {selectedRoom.guest_phone && (
                  <div className="text-xs text-blue-600">
                    Phone: {selectedRoom.guest_phone}
                  </div>
                )}
              </div>
            )}
            
            {occupiedRooms.length === 0 && (
              <div className="text-center py-4 text-gray-500">
                <div className="text-2xl mb-2">🏨</div>
                <p>No occupied rooms available</p>
                <p className="text-xs mt-1">Room service is not available at this time</p>
              </div>
            )}
          </div>
        )}

        {/* Current Order Session */}
        {activeOrder && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Current Order Session</h3>
              <button
                onClick={onFinishOrderSession}
                className="text-red-600 hover:text-red-700 text-sm"
              >
                End Session
              </button>
            </div>
            
            <div className="space-y-2 text-sm">
              {activeOrder.orderType === 'restaurant' ? (
                <div>
                  <span className="font-medium">Table:</span> {activeOrder.tableName}
                </div>
              ) : (
                <>
                  <div>
                    <span className="font-medium">Room:</span> {activeOrder.roomNumber}
                  </div>
                  <div>
                    <span className="font-medium">Guest:</span> {activeOrder.guestName}
                  </div>
                </>
              )}
              <div>
                <span className="font-medium">Type:</span> {activeOrder.orderType === 'restaurant' ? 'Restaurant' : 'Room Service'}
              </div>
              <div>
                <span className="font-medium">Rounds:</span> {activeOrder.rounds.length}
              </div>
            </div>

            {/* Customer Info */}
            <div className="mt-4 space-y-3">
              <h4 className="font-medium text-gray-900">Customer Information</h4>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="First Name"
                  value={customerInfo.firstName}
                  onChange={(e) => onUpdateCustomerInfo({...customerInfo, firstName: e.target.value})}
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                />
                <input
                  type="text"
                  placeholder="Last Name"
                  value={customerInfo.lastName}
                  onChange={(e) => onUpdateCustomerInfo({...customerInfo, lastName: e.target.value})}
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                />
              </div>
              <input
                type="tel"
                placeholder="Phone"
                value={customerInfo.phone}
                onChange={(e) => onUpdateCustomerInfo({...customerInfo, phone: e.target.value})}
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
              />
            </div>
          </div>
        )}
      </div>

      {/* Middle Panel - Menu */}
      <div className="lg:col-span-1">
        {selectedRestaurant && activeOrder && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Menu</h3>
              <select
                value={menuFilter}
                onChange={(e) => setMenuFilter(e.target.value)}
                className="border border-gray-300 rounded px-2 py-1 text-sm"
              >
                <option value="all">All Items</option>
                <option value="restaurant">Restaurant</option>
                <option value="bar">Bar</option>
              </select>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {filteredMenu.map(category => (
                <div key={category.id}>
                  <h4 className="font-medium text-gray-900 mb-2">{category.name}</h4>
                  <div className="space-y-2">
                    {category.items?.map(item => (
                      <div key={item.id} className="flex items-center justify-between p-2 border border-gray-200 rounded">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{item.name}</div>
                          <div className="text-xs text-gray-600">₹{item.price}</div>
                          {item.preparation_time && (
                            <div className="text-xs text-gray-500">{item.preparation_time}min</div>
                          )}
                        </div>
                        <button
                          onClick={() => onAddItemToCart(item)}
                          className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700"
                        >
                          Add
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right Panel - Current Cart */}
      <div className="lg:col-span-1">
        {activeOrder && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Current Round</h3>
              {activeOrder.rounds.length > 1 && (
                <span className="text-sm text-gray-600">Round {activeOrder.rounds.length}</span>
              )}
            </div>

            {cart.length > 0 ? (
              <>
                <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                  {cart.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-2 border border-gray-200 rounded">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{item.name}</div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => onUpdateCartItem(item.id, { quantity: parseInt(e.target.value) || 1 })}
                            className="w-16 border border-gray-300 rounded px-1 py-1 text-xs"
                          />
                          <span className="text-xs text-gray-600">x ₹{item.price}</span>
                        </div>
                        <input
                          type="text"
                          placeholder="Special instructions..."
                          value={item.specialInstructions}
                          onChange={(e) => onUpdateCartItem(item.id, { specialInstructions: e.target.value })}
                          className="w-full mt-1 border border-gray-300 rounded px-2 py-1 text-xs"
                        />
                      </div>
                      <div className="ml-2 flex flex-col items-end">
                        <div className="font-medium text-sm">₹{(item.price * item.quantity).toFixed(2)}</div>
                        <button
                          onClick={() => onRemoveFromCart(item.id)}
                          className="text-red-600 hover:text-red-700 text-xs mt-1"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-semibold">Total: ₹{cartTotal.toFixed(2)}</span>
                  </div>

                  <textarea
                    placeholder="Special instructions for this round..."
                    value={specialInstructions}
                    onChange={(e) => onUpdateSpecialInstructions(e.target.value)}
                    rows="2"
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm mb-4"
                  />

                  <div className="space-y-2">
                    <button
                      onClick={onSubmitOrderRound}
                      disabled={loading || cart.length === 0}
                      className="w-full bg-green-600 text-white px-4 py-2 rounded font-medium hover:bg-green-700 disabled:opacity-50"
                    >
                      {loading ? 'Submitting...' : 
                        (activeOrder.rounds[0]?.orderId ? 'Add Items to Order' : 'Submit Round to Kitchen')
                      }
                    </button>
                    
                    <button
                      onClick={onAddNewRound}
                      className="w-full bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700"
                    >
                      Add Another Round
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-2xl mb-2">🛒</div>
                <p>No items in current round</p>
                <p className="text-sm">Add items from the menu</p>
              </div>
            )}

            {/* Previous Rounds / Existing Items Summary */}
            {activeOrder.rounds.length > 0 && activeOrder.rounds[0].status === 'submitted' && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <h4 className="font-medium text-gray-900 mb-2">
                  {activeOrder.rounds[0].orderId ? 'Existing Order Items' : 'Previous Rounds'}
                </h4>
                <div className="space-y-2">
                  {activeOrder.rounds.filter(round => round.status === 'submitted').map(round => (
                    <div key={round.id} className="text-sm p-3 bg-gray-50 rounded border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">
                          {round.orderId ? `Order #${round.orderNumber}` : `Round ${round.id}`}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          round.status === 'submitted' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {round.status}
                        </span>
                      </div>
                      
                      {/* Show items in this round/order */}
                      {round.items && round.items.length > 0 && (
                        <div className="space-y-1">
                          {round.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-xs text-gray-600 bg-white p-2 rounded">
                              <span>{item.quantity}x {item.item_name || item.name}</span>
                              <span>₹{((item.unit_price || item.price || 0) * item.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <div className="text-xs text-gray-500 mt-2">
                        {new Date(round.timestamp).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-3 p-2 bg-blue-50 rounded">
                  <p className="text-sm text-blue-800">
                    💡 You're adding items to an existing order. New items will be sent to the kitchen as a separate round.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Active Orders Tab Component
const ActiveOrdersTab = ({
  orders,
  onGenerateBill,
  onViewBill,
  onRequestPayment,
  onCompleteOrder,
  loading,
  onAddOrderToExisting,
  onEditOrder,
  onEditItem,
  onDeleteItem,
  tables
}) => {
  return (
    <div className="space-y-4">
      {orders.map(order => (
        <div key={order.id} className="bg-white rounded-lg shadow p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-4 mb-3">
                <h4 className="text-lg font-semibold text-gray-900">
                  Order #{order.order_number}
                </h4>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  order.status === 'preparing' ? 'bg-blue-100 text-blue-800' :
                  order.status ==='rejected' ? 'bg-red-100 text-red-800':
                  'bg-green-100 text-green-800'
                }`}>
                  {order.status}
                </span>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  order.status === 'preparing' ? 'bg-blue-100 text-blue-800' :
                  order.status === 'ready' ? 'bg-green-100 text-green-800' :
                  order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  Kitchen: {order.status}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-4">
                <div>
                  <span className="font-medium">Customer:</span> {order.first_name} {order.last_name}
                </div>
                <div>
                  <span className="font-medium">
                    {order.order_type === 'room-service' ? 'Room:' : 'Table:'}
                  </span>
                  {order.order_type === 'room-service'
                    ? (() => {
                        let guestName = 'Guest';
                        if (order.guest_info) {
                          try {
                            const guestInfo = typeof order.guest_info === 'string'
                              ? JSON.parse(order.guest_info)
                              : order.guest_info;
                            guestName = guestInfo?.first_name
                              ? `${guestInfo.first_name} ${guestInfo.last_name || ''}`.trim()
                              : 'Guest';
                          } catch (e) {
                            guestName = 'Guest';
                          }
                        }
                        return `${order.room_number} (${guestName})`;
                      })()
                    : order.table_number
                  }
                </div>
                <div>
                  <span className="font-medium">Type:</span> {order.order_type === 'room-service' ? 'Room Service' : 'Restaurant'}
                </div>
                <div>
                  <span className="font-medium">Total:</span> ₹{parseFloat(order.total_amount + order.tax_amount).toFixed(2)}
                </div>
              </div>

              {order.kitchen_notes && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <span className="font-medium text-blue-900">Kitchen Notes:</span>
                  <p className="text-blue-800">{order.kitchen_notes}</p>
                </div>
              )}
              
              {/* Order Items */}
              {order.items && order.items.length > 0 && (
                <div className="mb-4">
                  <h5 className="font-medium text-gray-900 mb-2">Order Items:</h5>
                  <div className="space-y-2">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm bg-gray-50 p-3 rounded">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{item.quantity}x {item.item_name || item.name}</span>
                            <span className={`px-2 py-1 text-xs rounded ${
                              item.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              item.status === 'preparing' ? 'bg-blue-100 text-blue-800' :
                              item.status === 'ready' ? 'bg-green-100 text-green-800' :
                              item.status === 'served' ? 'bg-gray-100 text-gray-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {item.status || 'pending'}
                            </span>
                          </div>
                          {item.special_instructions && (
                            <div className="text-xs text-gray-600 mt-1">
                              Note: {item.special_instructions}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">₹{(item.unit_price * item.quantity).toFixed(2)}</span>
                          {/* Edit/Delete buttons - only show for pending/accepted items */}
                          {['pending', 'accepted'].includes(item.status) && (
                            <div className="flex space-x-1">
                              <button
                                onClick={() => onEditItem(order, item)}
                                className="text-blue-600 hover:text-blue-800 text-xs px-2 py-1 rounded border border-blue-300 hover:bg-blue-50"
                                title="Edit item"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => onDeleteItem(order.id, item.id, item, order)}
                                className="text-red-600 hover:text-red-800 text-xs px-2 py-1 rounded border border-red-300 hover:bg-red-50"
                                title="Delete item"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="ml-4 space-y-2">
              {order.status === 'ready' && (
                <button
                  onClick={() => onGenerateBill(order)}
                  disabled={loading}
                  className="bg-green-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                >
                  📄 Generate Bill
                </button>
              )}

              {order.status === 'billed' && (
                <div className="space-y-2">
                  <button
                    onClick={() => onViewBill(order)}
                    disabled={loading}
                    className="bg-gray-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-gray-700 disabled:opacity-50 w-full"
                  >
                     View Bill
                  </button>
                  <button
                    onClick={() => onRequestPayment(order)}
                    disabled={loading}
                    className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50 w-full"
                  >
                    💳 Request Payment
                  </button>
                </div>
              )}

              {order.status === 'paid' && (
                <button
                  onClick={() => onCompleteOrder(order)}
                  disabled={loading}
                  className="bg-purple-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-purple-700 disabled:opacity-50"
                >
                  ✅ Complete Order
                </button>
              )}

              {['pending', 'preparing'].includes(order.status) && (
                <>
                  <button
                    onClick={() => onEditOrder(order)}
                    disabled={loading}
                    className="bg-gray-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-gray-700 disabled:opacity-50 mr-2"
                  >
                    ✏️ Edit Order
                  </button>
                  <button
                    onClick={() => onAddOrderToExisting(order)}
                    disabled={loading}
                    className="bg-green-600 text-white px-4 py-2 rounded font-medium hover:bg-green-700 disabled:opacity-50"
                  >
                    + Add Order
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      ))}
      
      {orders.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg">📋</div>
          <p className="text-gray-600 mt-2">No active orders</p>
        </div>
      )}
    </div>
  );
};

// Order History Tab Component  
const OrderHistoryTab = ({ orders, loading, userRole }) => {
  const [showBillModal, setShowBillModal] = useState(false);
  const [selectedOrderForBill, setSelectedOrderForBill] = useState(null);
  const [billLoading, setBillLoading] = useState(false);
  const [billError, setBillError] = useState('');

  const handleViewBill = async (order) => {
    try {
      setBillLoading(true);
      setBillError('');
      console.log('🧾 [HISTORY] Viewing bill for order:', order.id);

      const billData = await restaurantOrderApi.getBill(order.id);
      console.log('🧾 [HISTORY] Bill retrieved successfully:', billData);

      // Set the order with the bill data for the modal
      setSelectedOrderForBill({
        ...order,
        bill: billData.bill || billData, // Handle both response formats
      });
      setShowBillModal(true);
    } catch (err) {
      console.error('🧾 [HISTORY] Error viewing bill:', err);
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to retrieve bill';
      setBillError(errorMessage);
    } finally {
      setBillLoading(false);
    }
  };
  const handleMarkAsPaid = (order) => {
    alert('Mark as Paid: Implement backend call to update status to paid.');
  };
  return (
    <div className="space-y-4">
      {/* Header with context */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Order History</h3>
        <p className="text-sm text-gray-600">
          {userRole === 'waiter' 
            ? 'Showing your completed orders as a waiter.'
            : userRole === 'admin' 
            ? 'Showing all completed orders from all waiters.'
            : 'Showing completed orders you have access to.'
          }
        </p>
        <div className="flex items-center space-x-4 mt-2 text-sm">
          <span className="text-gray-600">Total: <strong>{orders.length}</strong> orders</span>
        </div>
      </div>
      {orders.map(order => (
        <div key={order.id} className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-lg font-semibold text-gray-900">
              Order #{order.order_number}
            </h4>
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
              order.status === 'served' ? 'bg-green-100 text-green-800' :
              order.status === 'paid' ? 'bg-blue-100 text-blue-800' :
              order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
              order.status === 'ready' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {order.status}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-sm text-gray-600 mb-4">
            <div>
              <span className="font-medium">Customer:</span> {order.first_name} {order.last_name}
            </div>
            <div>
              <span className="font-medium">Table:</span> {order.table_number || (order.order_type === 'room-service' ? order.room_number : 'N/A')}
            </div>
            <div>
              <span className="font-medium">Order Type:</span> {order.order_type}
            </div>
            <div>
              <span className="font-medium">Total:</span> ₹{parseFloat((order.total_amount || 0) + (order.tax_amount || 0)).toFixed(2)}
            </div>
            <div>
              <span className="font-medium">Billing:</span> {order.status === 'paid' ? 'Paid' : order.status === 'billed' ? 'Billed' : 'Not Billed'}
            </div>
          </div>
          {/* Waiter info for admin view */}
          {userRole === 'admin' && (order.waiter_first_name || order.waiter_last_name) && (
            <div className="mb-3 text-sm text-gray-600">
              <span className="font-medium">Served by:</span> {order.waiter_first_name} {order.waiter_last_name}
            </div>
          )}
          {/* Rejection/Cancellation Notes */}
          {order.status === 'cancelled' && order.special_instructions && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <span className="text-red-600 text-sm">⚠️</span>
                <div>
                  <p className="text-sm font-medium text-red-800">Order Cancelled</p>
                  <p className="text-sm text-red-700 mt-1">{order.special_instructions}</p>
                </div>
              </div>
            </div>
          )}
          {/* Special Instructions for other statuses */}
          {order.status !== 'cancelled' && order.special_instructions && (
            <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-medium text-blue-800">Special Instructions:</p>
              <p className="text-sm text-blue-700 mt-1">{order.special_instructions}</p>
            </div>
          )}
          {/* Order Items for History */}
          {order.items && order.items.length > 0 && (
            <div className="mt-3">
              <h5 className="font-medium text-gray-900 mb-2">Items Ordered:</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm bg-gray-50 p-2 rounded">
                    <span>{item.quantity}x {item.item_name || item.name}</span>
                    <span>₹{((item.unit_price || item.price) * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Billing column and View Bill button */}
          <div className="mt-4 flex items-center justify-between">
            <button
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-medium hover:bg-blue-700"
              onClick={() => handleViewBill(order)}
            >
              View Bill
            </button>
            {userRole === 'manager' && order.status === 'billed' && (
              <button
                className="bg-green-600 text-white px-3 py-1 rounded text-sm font-medium hover:bg-green-700"
                onClick={() => handleMarkAsPaid(order)}
              >
                Mark as Paid
              </button>
            )}
          </div>
        </div>
      ))}
      {showBillModal && selectedOrderForBill && (
        <BillModal
          order={selectedOrderForBill}
          onClose={() => {
            setShowBillModal(false);
            setSelectedOrderForBill(null);
          }}
          readOnly={true}
        />
      )}
      {orders.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg">📚</div>
          <p className="text-gray-600 mt-2">No order history</p>
        </div>
      )}
    </div>
  );
};

// Edit Order Modal Component
const EditOrderModal = ({ order, tables, onClose, onSave }) => {
  const [tableId, setTableId] = useState(order.table_id || '');
  const [specialInstructions, setSpecialInstructions] = useState(order.special_instructions || '');

  const handleSave = () => {
    const updateData = {};
    if (tableId !== order.table_id) updateData.table_id = tableId;
    if (specialInstructions !== order.special_instructions) updateData.special_instructions = specialInstructions;

    onSave(updateData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Edit Order #{order.order_number}
        </h2>

        <div className="space-y-4">
          {order.order_type === 'restaurant' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Table
              </label>
              <select
                value={tableId}
                onChange={(e) => setTableId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Table</option>
                {tables.map(table => (
                  <option key={table.id} value={table.id}>
                    Table {table.table_number} ({table.capacity} seats)
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Special Instructions
            </label>
            <textarea
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="Any special instructions for this order..."
            />
          </div>
        </div>

        <div className="flex space-x-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 text-gray-900 px-4 py-2 rounded-md font-medium hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

// Edit Item Modal Component
const EditItemModal = ({ order, item, onClose, onSave }) => {
  const [quantity, setQuantity] = useState(item.quantity || 1);
  const [specialInstructions, setSpecialInstructions] = useState(item.special_instructions || '');

  const handleSave = () => {
    onSave({
      quantity: parseInt(quantity),
      special_instructions: specialInstructions
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Edit Item: {item.item_name || item.name}
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantity
            </label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Special Instructions
            </label>
            <textarea
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="Any special instructions for this item..."
            />
          </div>

          <div className="text-sm text-gray-600">
            <p>Unit Price: ₹{item.unit_price}</p>
            <p className="font-medium">Total: ₹{(item.unit_price * quantity).toFixed(2)}</p>
          </div>
        </div>

        <div className="flex space-x-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 text-gray-900 px-4 py-2 rounded-md font-medium hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

// Delete Confirmation Modal Component
const DeleteConfirmationModal = ({ item, order, onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Confirm Delete Item
            </h3>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            Are you sure you want to delete this item from the order? This action cannot be undone.
          </p>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium text-gray-900">
                  {item.item_name || item.name}
                </h4>
                <p className="text-sm text-gray-600">
                  Quantity: {item.quantity}
                </p>
                {item.special_instructions && (
                  <p className="text-sm text-gray-600 mt-1">
                    Special instructions: {item.special_instructions}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-900">
                  ₹{(item.unit_price * item.quantity).toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-3 text-sm text-gray-600">
            <p>Order: #{order.order_number}</p>
            {order.table?.table_number && (
              <p>Table: {order.table.table_number}</p>
            )}
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-200 text-gray-900 px-4 py-2 rounded-md font-medium hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md font-medium hover:bg-red-700 transition-colors"
          >
            Delete Item
          </button>
        </div>
      </div>
    </div>
  );
};

export default WaiterOrderInterface;

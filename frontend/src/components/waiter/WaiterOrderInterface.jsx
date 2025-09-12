import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { 
  restaurantApi, 
  restaurantTableApi, 
  restaurantMenuApi, 
  restaurantOrderApi,
  kitchenApi
} from '../../services/restaurantApi';
import LoadingSpinner from '../common/LoadingSpinner';

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
  
  // Order building state
  const [activeOrder, setActiveOrder] = useState(null);
  const [cart, setCart] = useState([]);
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
  const [selectedOrderForBill, setSelectedOrderForBill] = useState(null);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        const [restaurantsData, ordersData] = await Promise.all([
          restaurantApi.getRestaurants(),
          restaurantOrderApi.getOrders()
        ]);
        
        setRestaurants(restaurantsData.restaurants || []);
        setCurrentOrders(ordersData.orders || []);
        
        if (restaurantsData.restaurants.length > 0) {
          setSelectedRestaurant(restaurantsData.restaurants[0].id);
        }
      } catch (err) {
        setError(err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Load restaurant-specific data
  useEffect(() => {
    const loadRestaurantData = async () => {
      if (!selectedRestaurant) return;
      
      try {
        const [tablesData, menuData] = await Promise.all([
          restaurantTableApi.getTables(selectedRestaurant),
          restaurantMenuApi.getMenu(selectedRestaurant)
        ]);
        
        setTables(tablesData.tables || []);
        setMenu(menuData.menu || []);
      } catch (err) {
        setError(err.message || 'Failed to load restaurant data');
      }
    };

    loadRestaurantData();
  }, [selectedRestaurant]);

  const startNewOrder = (table) => {
    setSelectedTable(table);
    setActiveOrder({
      tableId: table.id,
      tableName: table.table_name,
      restaurantId: selectedRestaurant,
      rounds: [{
        id: 1,
        items: [],
        timestamp: new Date(),
        status: 'building'
      }]
    });
    setCart([]);
    setCustomerInfo({ firstName: '', lastName: '', phone: '', email: '' });
    setSpecialInstructions('');
  };

  const addItemToCart = (item, quantity = 1) => {
    const cartItem = {
      id: Date.now(),
      menuItemId: item.id,
      name: item.name,
      price: item.price,
      quantity,
      specialInstructions: '',
      kitchenType: item.kitchen_type || (item.category_type === 'bar' ? 'bar' : 'restaurant')
    };
    
    setCart(prev => [...prev, cartItem]);
  };

  const updateCartItem = (cartItemId, updates) => {
    setCart(prev => 
      prev.map(item => 
        item.id === cartItemId ? { ...item, ...updates } : item
      )
    );
  };

  const removeFromCart = (cartItemId) => {
    setCart(prev => prev.filter(item => item.id !== cartItemId));
  };

  const addNewRound = () => {
    if (!activeOrder) return;
    
    const newRound = {
      id: activeOrder.rounds.length + 1,
      items: [],
      timestamp: new Date(),
      status: 'building'
    };
    
    setActiveOrder(prev => ({
      ...prev,
      rounds: [...prev.rounds, newRound]
    }));
    setCart([]);
  };

  const submitOrderRound = async () => {
    if (!activeOrder || cart.length === 0) return;
    
    try {
      setLoading(true);
      
      // Group items by kitchen type for proper routing
      const kitchenGroups = cart.reduce((groups, item) => {
        const kitchen = item.kitchenType;
        if (!groups[kitchen]) groups[kitchen] = [];
        groups[kitchen].push(item);
        return groups;
      }, {});

      const orderData = {
        restaurantId: selectedRestaurant,
        tableId: selectedTable.id,
        customerInfo,
        specialInstructions,
        items: cart.map(item => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          specialInstructions: item.specialInstructions,
          price: item.price
        })),
        kitchenRouting: Object.keys(kitchenGroups),
        roundNumber: activeOrder.rounds.length
      };

      const response = await restaurantOrderApi.createOrder(orderData);
      
      // Update active order with submitted round
      const submittedRound = {
        ...activeOrder.rounds[activeOrder.rounds.length - 1],
        items: cart,
        status: 'submitted',
        orderId: response.order.id,
        orderNumber: response.order.order_number
      };
      
      setActiveOrder(prev => ({
        ...prev,
        rounds: [
          ...prev.rounds.slice(0, -1),
          submittedRound
        ],
        latestOrderId: response.order.id
      }));

      // Clear current cart but keep order session active
      setCart([]);
      
      // Emit socket event for real-time updates
      emitEvent('new-order-submitted', {
        orderId: response.order.id,
        orderNumber: response.order.order_number,
        tableId: selectedTable.id,
        kitchenTypes: Object.keys(kitchenGroups)
      });

      // Refresh current orders list
      const ordersData = await restaurantOrderApi.getOrders();
      setCurrentOrders(ordersData.orders || []);

    } catch (err) {
      setError(err.message || 'Failed to submit order');
    } finally {
      setLoading(false);
    }
  };

  const finishOrderSession = () => {
    setActiveOrder(null);
    setSelectedTable(null);
    setCart([]);
    setCustomerInfo({ firstName: '', lastName: '', phone: '', email: '' });
    setSpecialInstructions('');
  };

  const generateBill = async (order) => {
    try {
      setLoading(true);
      const billData = await restaurantOrderApi.generateBill(order.id);
      setSelectedOrderForBill({ ...order, bill: billData.bill });
      setShowBillModal(true);
    } catch (err) {
      setError(err.message || 'Failed to generate bill');
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
          menu={menu}
          activeOrder={activeOrder}
          cart={cart}
          customerInfo={customerInfo}
          specialInstructions={specialInstructions}
          onStartNewOrder={startNewOrder}
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
        />
      )}

      {activeTab === 'active-orders' && (
        <ActiveOrdersTab
          orders={currentOrders.filter(o => ['pending', 'preparing'].includes(o.status))}
          onGenerateBill={generateBill}
          loading={loading}
        />
      )}

      {activeTab === 'history' && (
        <OrderHistoryTab
          orders={currentOrders.filter(o => ['ready', 'served', 'paid'].includes(o.status))}
          loading={loading}
        />
      )}

      {/* Bill Generation Modal */}
      {showBillModal && selectedOrderForBill && (
        <BillModal
          order={selectedOrderForBill}
          onClose={() => {
            setShowBillModal(false);
            setSelectedOrderForBill(null);
          }}
        />
      )}
    </div>
  );
};

// New Order Tab Component
const NewOrderTab = ({ 
  restaurants, selectedRestaurant, onRestaurantChange,
  tables, menu, activeOrder, cart, customerInfo, specialInstructions,
  onStartNewOrder, onAddItemToCart, onUpdateCartItem, onRemoveFromCart,
  onAddNewRound, onSubmitOrderRound, onFinishOrderSession,
  onUpdateCustomerInfo, onUpdateSpecialInstructions, cartTotal, loading
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

        {/* Table Selection */}
        {selectedRestaurant && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Select Table</h3>
            <div className="grid grid-cols-2 gap-3">
              {tables.map(table => (
                <button
                  key={table.id}
                  onClick={() => onStartNewOrder(table)}
                  disabled={table.status !== 'available'}
                  className={`p-3 rounded-lg text-sm font-medium transition-colors ${
                    activeOrder?.tableId === table.id
                      ? 'bg-blue-100 text-blue-800 border-2 border-blue-500'
                      : table.status === 'available'
                        ? 'bg-green-50 text-green-800 border border-green-200 hover:bg-green-100'
                        : 'bg-gray-100 text-gray-500 border border-gray-200 cursor-not-allowed'
                  }`}
                >
                  <div>{table.table_name}</div>
                  <div className="text-xs">{table.capacity} seats</div>
                  <div className="text-xs">{table.location}</div>
                </button>
              ))}
            </div>
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
              <div>
                <span className="font-medium">Table:</span> {activeOrder.tableName}
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
                      {loading ? 'Submitting...' : 'Submit Round to Kitchen'}
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

            {/* Previous Rounds Summary */}
            {activeOrder.rounds.length > 1 && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <h4 className="font-medium text-gray-900 mb-2">Previous Rounds</h4>
                <div className="space-y-2">
                  {activeOrder.rounds.slice(0, -1).map(round => (
                    <div key={round.id} className="text-sm p-2 bg-gray-50 rounded">
                      <div className="flex items-center justify-between">
                        <span>Round {round.id}</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          round.status === 'submitted' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {round.status}
                        </span>
                      </div>
                      {round.orderNumber && (
                        <div className="text-xs text-gray-600">Order #{round.orderNumber}</div>
                      )}
                    </div>
                  ))}
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
const ActiveOrdersTab = ({ orders, onGenerateBill, loading }) => {
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
                  'bg-green-100 text-green-800'
                }`}>
                  {order.status}
                </span>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  order.kitchen_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  order.kitchen_status === 'accepted' ? 'bg-blue-100 text-blue-800' :
                  order.kitchen_status === 'rejected' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  Kitchen: {order.kitchen_status}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-4">
                <div>
                  <span className="font-medium">Customer:</span> {order.first_name} {order.last_name}
                </div>
                <div>
                  <span className="font-medium">Table:</span> {order.table_number}
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
            </div>

            <div className="ml-4 space-y-2">
              {order.status === 'ready' && (
                <button
                  onClick={() => onGenerateBill(order)}
                  disabled={loading}
                  className="bg-green-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                >
                  Generate Bill
                </button>
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
const OrderHistoryTab = ({ orders, loading }) => {
  return (
    <div className="space-y-4">
      {orders.map(order => (
        <div key={order.id} className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-lg font-semibold text-gray-900">
              Order #{order.order_number}
            </h4>
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
              order.status === 'served' ? 'bg-green-100 text-green-800' :
              order.status === 'paid' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {order.status}
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600">
            <div>
              <span className="font-medium">Customer:</span> {order.first_name} {order.last_name}
            </div>
            <div>
              <span className="font-medium">Table:</span> {order.table_number}
            </div>
            <div>
              <span className="font-medium">Total:</span> ₹{parseFloat(order.total_amount + order.tax_amount).toFixed(2)}
            </div>
            <div>
              <span className="font-medium">Date:</span> {new Date(order.placed_at).toLocaleDateString()}
            </div>
          </div>
        </div>
      ))}
      
      {orders.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg">📚</div>
          <p className="text-gray-600 mt-2">No order history</p>
        </div>
      )}
    </div>
  );
};

// Bill Modal Component
const BillModal = ({ order, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-96 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Bill - Order #{order.order_number}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
        
        <div className="space-y-4">
          <div className="text-center border-b pb-4">
            <h2 className="text-xl font-bold">Mayfair Hotel</h2>
            <p className="text-sm text-gray-600">BSNL Exchange, Mandi, HP</p>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Order Number:</span>
              <span className="font-medium">{order.order_number}</span>
            </div>
            <div className="flex justify-between">
              <span>Table:</span>
              <span className="font-medium">{order.table_number}</span>
            </div>
            <div className="flex justify-between">
              <span>Customer:</span>
              <span className="font-medium">{order.first_name} {order.last_name}</span>
            </div>
            <div className="flex justify-between">
              <span>Date:</span>
              <span className="font-medium">{new Date(order.placed_at).toLocaleString()}</span>
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-2">Items:</h4>
            <div className="space-y-1 text-sm">
              {order.items?.map(item => (
                <div key={item.id} className="flex justify-between">
                  <span>{item.quantity}x {item.item_name}</span>
                  <span>₹{parseFloat(item.total_price).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t pt-4 space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>₹{parseFloat(order.total_amount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax:</span>
              <span>₹{parseFloat(order.tax_amount || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t pt-2">
              <span>Total:</span>
              <span>₹{parseFloat(order.total_amount + (order.tax_amount || 0)).toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="mt-6 flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 text-gray-900 px-4 py-2 rounded-md font-medium hover:bg-gray-300"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700"
          >
            Print Bill
          </button>
        </div>
      </div>
    </div>
  );
};

export default WaiterOrderInterface;

import React, { useState, useEffect } from 'react';
import { restaurantMenuApi, restaurantTableApi, restaurantOrderApi } from '../../services/restaurantApi';
import { roomApi } from '../../services/api';

const PlaceOrderModal = ({ onClose, onSave, selectedRestaurant, restaurants, userRole, existingOrder }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [menu, setMenu] = useState({ menu: [], totalCategories: 0, totalItems: 0 });
  const [tables, setTables] = useState([]);
  const [occupiedRooms, setOccupiedRooms] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [orderForm, setOrderForm] = useState({
    order_type: 'dine_in',
    table_id: '',
    room_booking_id: '',
    room_number: '',
    customer_name: '',
    customer_phone: '',
    special_instructions: '',
    payment_method: 'cash'
  });

  // Initialize with existing order data if provided
  useEffect(() => {
    if (existingOrder) {
      setOrderForm({
        order_type: 'dine_in',
        table_id: existingOrder.tableId || '',
        room_booking_id: '',
        room_number: '',
        customer_name: `${existingOrder.first_name || ''} ${existingOrder.last_name || ''}`.trim(),
        customer_phone: existingOrder.phone || '',
        special_instructions: existingOrder.special_instructions || '',
        payment_method: 'cash'
      });
    }
  }, [existingOrder]);
  // Load menu and tables on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load menu
        const menuData = await restaurantMenuApi.getMenu(selectedRestaurant);
        setMenu(menuData);

        // Load tables for dine-in orders
        const tableData = await restaurantTableApi.getTables(selectedRestaurant);
        setTables(tableData.tables || []);
      } catch (err) {
        setError('Failed to load menu and tables');
        console.error('Load error:', err);
      }
    };
    loadData();
  }, [selectedRestaurant]);

  // Load occupied rooms when room service is selected
  useEffect(() => {
    if (orderForm.order_type === 'room_service') {
      loadOccupiedRooms();
    }
  }, [orderForm.order_type]);

  const loadOccupiedRooms = async () => {
    try {
      const roomsData = await roomApi.getOccupiedRooms();
      setOccupiedRooms(roomsData.rooms || []);
    } catch (err) {
      setError('Failed to load occupied rooms');
      console.error('Load occupied rooms error:', err);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setOrderForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddItem = (item, categoryId) => {
    const existingItem = selectedItems.find(selected => selected.id === item.id);
    if (existingItem) {
      setSelectedItems(prev => 
        prev.map(selected => 
          selected.id === item.id 
            ? { ...selected, quantity: selected.quantity + 1 }
            : selected
        )
      );
    } else {
      setSelectedItems(prev => [...prev, {
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: 1,
        category_id: categoryId,
        preparation_time: item.preparation_time || 0
      }]);
    }
  };

  const handleUpdateQuantity = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      setSelectedItems(prev => prev.filter(item => item.id !== itemId));
    } else {
      setSelectedItems(prev => 
        prev.map(item => 
          item.id === itemId 
            ? { ...item, quantity: newQuantity }
            : item
        )
      );
    }
  };

  const calculateTotal = () => {
    return selectedItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleSubmitOrder = async () => {
    setLoading(true);
    setError('');

    try {
      // Validate form
      if (selectedItems.length === 0) {
        throw new Error('Please add at least one item to the order');
      }

      if (existingOrder) {
        // Adding items to existing order - skip form validation
        const orderData = {
          items: selectedItems.map(item => ({
            menu_item_id: item.id,
            quantity: item.quantity,
            price: item.price,
            special_instructions: ''
          }))
        };

        // Call onSave with the new items data
        if (onSave) {
          await onSave(orderData);
        }
      } else {
        // Creating new order
        if (orderForm.order_type === 'dine_in' && !orderForm.table_id) {
          throw new Error('Please select a table for dine-in orders');
        }

        if (orderForm.order_type === 'room_service' && !orderForm.room_booking_id) {
          throw new Error('Please select a room for room service');
        }

        if (!orderForm.customer_name.trim()) {
          throw new Error('Please enter customer name');
        }

        // Prepare order data
        const orderData = {
          ...orderForm,
          restaurant_id: selectedRestaurant,
          items: selectedItems.map(item => ({
            menu_item_id: item.id,
            quantity: item.quantity,
            price: item.price,
            special_instructions: ''
          })),
          total_amount: calculateTotal(),
          estimated_time: Math.max(...selectedItems.map(item => item.preparation_time || 0))
        };

        // Remove table_id for takeaway orders
        if (orderForm.order_type === 'takeaway') {
          delete orderData.table_id;
        }

        // Create the order
        await restaurantOrderApi.createOrder(orderData);

        // Call onSave to refresh orders list
        if (onSave) {
          await onSave();
        }
      }

      onClose();
    } catch (err) {
      setError(err.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  const selectedRestaurantData = restaurants.find(r => r.id === selectedRestaurant);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl p-6 m-4 max-h-screen overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {existingOrder ? `Add Items to Order #${existingOrder.order_number || existingOrder.rounds?.[0]?.orderNumber}` : 'Place New Order'}
            </h2>
            {selectedRestaurantData && (
              <p className="text-sm text-gray-600 mt-1">
                {selectedRestaurantData.name} ({selectedRestaurantData.restaurant_type})
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 focus:outline-none"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Menu Selection */}
          <div className="lg:col-span-2">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Select Items</h3>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {menu.menu?.map((category) => (
                <div key={category.id} className="border rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-3">{category.name}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {category.items?.map((item) => (
                      <div key={item.id} className="border rounded-md p-3 hover:bg-gray-50">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h5 className="font-medium text-gray-900">{item.name}</h5>
                            <p className="text-sm text-gray-600">{item.description}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <span
                            className={`text-lg font-semibold ${
                              item.is_vegetarian || item.is_vegan
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            ₹{item.price}
                          </span>
                              {item.is_vegetarian && <span className="text-green-500">🌱</span>}
                              {item.is_vegan && <span className="text-green-600">🌿</span>}
                             {!item.is_vegan && !item.is_vegetarian && <span className="text-lg font-semibold text-red-600"> 🍗</span>}
                            </div>
                            {item.preparation_time && (
                              <span className="text-xs text-gray-500">
                                {item.preparation_time} mins
                              </span>
                            )}
                          </div>
                         <button
  onClick={() => handleAddItem(item, category.id)}
  className={`ml-3 px-3 py-1 text-sm rounded text-white relative overflow-hidden ${
    selectedItems.find(i => i.id === item.id) ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
  }`}
>
  <span
    className={`absolute inset-0 flex items-center justify-center transition-transform duration-200 ${
      selectedItems.find(i => i.id === item.id) ? 'scale-100 opacity-100' : 'scale-0 opacity-0 '
    }`}
  >
    ✔
  </span>
  <span
    className={`flex items-center justify-center transition-transform duration-200 ${
      selectedItems.find(i => i.id === item.id) ? 'scale-0 opacity-0' : 'scale-100 opacity-100'
    }`}
  >
    +
  </span>
</button>

                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary & Details */}
          <div className="space-y-6">
            {/* Order Details Form - Only show for new orders */}
            {!existingOrder && (
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Order Details</h3>
              <div className="space-y-4">
                {/* Order Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Order Type *
                  </label>
                  <select
                    name="order_type"
                    value={orderForm.order_type}
                    onChange={handleFormChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="dine_in">Dine In</option>
                    <option value="takeaway">Takeaway</option>
                    <option value="room_service">Room Service</option>
                  </select>
                </div>

                {/* Table Selection (for dine-in) */}
                {orderForm.order_type === 'dine_in' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Table *
                    </label>
                    <select
                      name="table_id"
                      value={orderForm.table_id}
                      onChange={handleFormChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Table</option>
                      {tables.map(table => (
                        <option key={table.id} value={table.id}>
                          Table {table.table_number} ({table.location.replace('_', ' ')})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Room Selection (for room service) */}
                {orderForm.order_type === 'room_service' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Room *
                    </label>
                    <select
                      name="room_booking_id"
                      value={orderForm.room_booking_id}
                      onChange={(e) => {
                        const selectedRoom = occupiedRooms.find(room => room.id === e.target.value);
                        setOrderForm(prev => ({
                          ...prev,
                          room_booking_id: e.target.value,
                          room_number: selectedRoom?.room_number || '',
                          customer_name: selectedRoom ? `${selectedRoom.guest_first_name} ${selectedRoom.guest_last_name}` : '',
                          customer_phone: selectedRoom?.guest_phone || ''
                        }));
                      }}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Room</option>
                      {occupiedRooms.map(room => (
                        <option key={room.id} value={room.id}>
                          Room {room.room_number} - {room.guest_first_name} {room.guest_last_name}
                        </option>
                      ))}
                    </select>
                    {occupiedRooms.length === 0 && (
                      <p className="text-sm text-gray-500 mt-1">No occupied rooms available</p>
                    )}
                  </div>
                )}

                {/* Customer Details */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    name="customer_name"
                    value={orderForm.customer_name}
                    onChange={handleFormChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer Phone
                  </label>
                  <input
                    type="tel"
                    name="customer_phone"
                    value={orderForm.customer_phone}
                    onChange={handleFormChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+91 XXXXXXXXXX"
                  />
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Method
                  </label>
                  <select
                    name="payment_method"
                    value={orderForm.payment_method}
                    onChange={handleFormChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="upi">UPI</option>
                    <option value="room_charge">Room Charge</option>
                  </select>
                </div>

                {/* Special Instructions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Special Instructions
                  </label>
                  <textarea
                    name="special_instructions"
                    value={orderForm.special_instructions}
                    onChange={handleFormChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    placeholder="Any special requirements..."
                  />
                </div>
              </div>
            </div>
            )}

            {/* Existing Order Items (if adding to existing order) */}
            {existingOrder && existingOrder.rounds?.[0]?.items?.length > 0 && (
              <div className="border rounded-lg p-4 mb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Existing Order Items</h3>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {existingOrder.rounds[0].items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-sm">
                      <div className="flex-1">
                        <p className="font-medium text-gray-700">{item.item_name || item.name}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-600">{item.quantity}x</span>
                        <span className="font-medium">₹{parseFloat(item.total_price || item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Order Summary */}
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">{existingOrder ? 'New Items to Add' : 'Order Summary'}</h3>
              <div className="space-y-3 max-h-40 overflow-y-auto">
                {selectedItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-600">₹{item.price} each</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                        className="w-6 h-6 bg-gray-200 text-gray-600 rounded text-sm hover:bg-gray-300"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-sm">{item.quantity}</span>
                      <button
                        onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                        className="w-6 h-6 bg-gray-200 text-gray-600 rounded text-sm hover:bg-gray-300"
                      >
                        +
                      </button>
                    </div>
                    <div className="w-16 text-right">
                      <p className="text-sm font-medium">₹{item.price * item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>

              {selectedItems.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-4">No items selected</p>
              )}

              {selectedItems.length > 0 && (
                <div className="border-t mt-4 pt-4">
                  <div className="flex justify-between items-center text-lg font-semibold">
                    <span>Total:</span>
                    <span>₹{calculateTotal()}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitOrder}
                className="px-4 py-2 bg-light-orange text-white rounded hover:bg-blue-700"
                disabled={loading || selectedItems.length === 0}
              >
                {loading ? (existingOrder ? 'Adding...' : 'Placing...') : (existingOrder ? 'Add Items' : 'Place Order')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaceOrderModal;

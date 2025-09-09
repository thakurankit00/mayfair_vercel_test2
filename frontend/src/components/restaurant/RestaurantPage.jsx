import React, { useState, useEffect } from 'react';
import EditCategoryModal from './EditCategoryModal';
import ReservationModal from './ReservationModal';
import { useAuth } from '../../contexts/AuthContext';


import { 
  restaurantTableApi, 
  restaurantMenuApi, 
  restaurantReservationApi, 
  restaurantOrderApi 
} from '../../services/restaurantApi';
import LoadingSpinner from '../common/LoadingSpinner';


const RestaurantPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('menu');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Data states
  const [tables, setTables] = useState([]);
  const [menu, setMenu] = useState({ menu: [], totalCategories: 0, totalItems: 0 });
  const [reservations, setReservations] = useState([]);
  const [orders, setOrders] = useState([]);

  // Form states
  const [showAddTableModal, setShowAddTableModal] = useState(false);
  const [showAddMenuItemModal, setShowAddMenuItemModal] = useState(false);
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [editingReservation, setEditingReservation] = useState(null);
 //  Hooks must be inside the component
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);

  // Load data based on user role and active tab
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        switch (activeTab) {
          case 'tables':
            if (['admin', 'manager', 'receptionist', 'waiter'].includes(user.role)) {
              const tableData = await restaurantTableApi.getTables();
              setTables(tableData.tables || []);
            }
            break;
          case 'menu':
            const menuData = await restaurantMenuApi.getMenu();
            setMenu(menuData);
            break;
          case 'reservations':
            const reservationData = await restaurantReservationApi.getReservations();
            setReservations(reservationData.reservations || []);
            break;
          case 'orders':
            const orderData = await restaurantOrderApi.getOrders();
            setOrders(orderData.orders || []);
            break;
        }
      } catch (err) {
        setError(err.message || 'Failed to load data');
      }
      setLoading(false);
    };

    loadData();
  }, [activeTab, user.role]);

  const handleTableAdded = (newTable) => {
    setTables((prevTables) => [...prevTables, newTable]);
  };

  const tabs = [
    { id: 'menu', name: 'Menu', icon: '📋', roles: ['customer', 'receptionist', 'waiter', 'chef', 'bartender', 'manager', 'admin'] },
    { id: 'reservations', name: 'Reservations', icon: '📅', roles: ['customer', 'receptionist', 'waiter', 'manager', 'admin'] },
    { id: 'orders', name: 'Orders', icon: '🍽️', roles: ['customer', 'receptionist', 'waiter', 'chef', 'bartender', 'manager', 'admin'] },
    { id: 'tables', name: 'Tables', icon: '🪑', roles: ['receptionist', 'waiter', 'manager', 'admin'] }
  ].filter(tab => tab.roles.includes(user.role));

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl  font-hightower font-bold text-gray-900">Restaurant Management</h1>
            <p className="mt-2 text-gray-600">
              Manage restaurant operations, bookings, and orders
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="bg-blue-50 px-4 py-2 rounded-lg">
              <div className="text-sm font-medium text-blue-900">
                Role: {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center space-x-2 ${
                activeTab === tab.id
                  ? 'border-light-orange text-light-orange'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner />
        </div>
      )}

      {/* Tab Content */}
      {!loading && (
        <div className="min-h-96">
          {/* Menu Tab */}
          {activeTab === 'menu' && (

            <MenuTab 

              menu={menu} 

              userRole={user.role} 

              onEditCategory={(category) => {

                setSelectedCategory(category);

                setShowEditCategoryModal(true);

              }}

            />

          )}

          {/* Reservations Tab */}
          {activeTab === 'reservations' && (
            <>
              <ReservationsTab 
                reservations={reservations} 
                userRole={user.role}
                onCreateReservation={() => {
                  setEditingReservation(null);
                  setShowReservationModal(true);
                }}
                onEditReservation={(reservation) => {
                  setEditingReservation(reservation);
                  setShowReservationModal(true);
                }}
                onCancelReservation={async (id) => {
                  try {
                    await restaurantReservationApi.cancelReservation(id);
                    const reservationData = await restaurantReservationApi.getReservations();
                    setReservations(reservationData.reservations || []);
                  } catch (err) {
                    setError(err.message || 'Failed to cancel reservation');
                  }
                }}
              />
              {showReservationModal && (
                <ReservationModal
                  reservation={editingReservation}
                  onClose={() => setShowReservationModal(false)}
                  onSave={async () => {
                    try {
                      const reservationData = await restaurantReservationApi.getReservations();
                      setReservations(reservationData.reservations || []);
                      setShowReservationModal(false);
                      setEditingReservation(null);
                    } catch (err) {
                      setError(err.message || 'Failed to refresh reservations');
                    }
                  }}
                />
              )}
            </>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && <OrdersTab orders={orders} userRole={user.role} />}

          {/* Tables Tab */}
          {activeTab === 'tables' && (
            <TablesTab 
              tables={tables} 
              userRole={user.role}
              onAddTable={() => setShowAddTableModal(true)}
            />
          )}
        </div>
      )}
       {/* 🔹 Edit Category Modal */}

      {showEditCategoryModal && selectedCategory && (
        <EditCategoryModal
          category={selectedCategory}
          onClose={() => setShowEditCategoryModal(false)}
          onSave={async (updatedData) => {
            try {
              await restaurantMenuApi.updateCategory(selectedCategory.id, updatedData);
              const updatedMenu = await restaurantMenuApi.getMenu();
              setMenu(updatedMenu);
              setShowEditCategoryModal(false);
            } catch (err) {
              setError(err.message || "Failed to update category");
            }
          }}
        />
      )}
       
       {/*  Reservation Modal */}
          {showReservationModal && (
        <ReservationModal
        onClose={() => setShowReservationModal(false)}
       onSave={async () => {
       try {
        const reservationData = await restaurantReservationApi.getReservations();
         setReservations(reservationData.reservations || []);
      } catch (err) {
        setError(err.message || 'Failed to reload reservations');
      }
    }}
  />
)}
    </div>
  );
};

// Menu Tab Component
const MenuTab = ({ menu, userRole, onEditCategory  }) => {
  const [selectedType, setSelectedType] = useState('all');
  
  const filteredMenu = menu.menu?.filter(category => 
    selectedType === 'all' || category.type === selectedType
  ) || [];

  return (
    <div className="space-y-6">
      {/* Menu Controls */}
      <div className="flex items-center justify-between">
          <select

          value={selectedType}

          onChange={(e) => setSelectedType(e.target.value)}

          className="border border-gray-300 rounded-md px-3 py-2"

        >

          <option value="all">All Items</option>

          <option value="restaurant">Restaurant</option>

          <option value="bar">Bar</option>

        </select>
        {['admin', 'manager'].includes(userRole) && (
          <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
            Add Menu Item
          </button>
        )}
      </div>

      {/* Menu Categories */}
      <div className="space-y-6">
        {filteredMenu.map((category) => (
          <div key={category.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {category.name}
                </h3>
                <p className="text-sm text-gray-600">{category.description}</p>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {category.type}
                </span>
              </div>
              {['admin', 'manager'].includes(userRole) && (
                <button 

                  onClick={() => onEditCategory(category)}

                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"

                >
                  Edit Category
                </button>
              )}
            </div>

            {/* Menu Items */}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {category.items?.map((item) => (
                <div
                  key={item.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between">
                    {item.image_url && (
                    <img
                      src={item.image_url}
                     alt={item.name}
                      className="w-40 h-40 object-cover rounded-md mr-4"
                     />
                      )}
                      <div className="flex justify-between items-start">
                    <div className='flex-1'>
                      <h4 className="font-semibold text-lg text-gray-900">{item.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {item.description}
                      </p>
                      <div className="mt-3 flex items-center space-x-2">
                         <span
    className={`text-lg font-semibold ${
      item.is_vegetarian || item.is_vegan
        ? "text-green-600"
        : "text-red-600"
    }`}
  >
    ₹{item.price}
  </span>
                        {item.is_vegetarian && (
                          <span className="text-green-500">🌱</span>
                        )}
                        {item.is_vegan && <span className="text-green-600">🌿</span>}
                        {!item.is_vegan && !item.is_vegetarian && <span className="text-lg font-semibold text-red-600"> 🍗</span>}
                      </div>
                      {item.preparation_time && (
                        <p className="text-xs text-gray-500 mt-2">
                          Prep time: {item.preparation_time} mins
                        </p>
                      )}
                    </div>
                    </div>
                    {["admin", "manager"].includes(userRole) && (
                      <MenuItemActions item={item} />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {(!category.items || category.items.length === 0) && (
              <div className="text-center py-8 text-gray-500">
                No items in this category
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredMenu.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg">🍽️</div>
          <p className="text-gray-600 mt-2">No menu items found</p>
        </div>
      )}

      {/* Modal for Add Menu Item */}
      {showAddForm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
           
            <div className="flex items-center justify-between mb-4">
                 <h2 className="text-xl font-semibold mb-4 bg-light-orange text-white p-2 rounded">
        {editingItem ? "Edit Menu Item" : "Add Menu Item"}
        </h2>
     
       <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          </div>
            <form onSubmit={handleAddItem} className="space-y-4">
             <div>
    <label className="block text-sm font-medium">Category</label>
    <select
      name="category_id"
      value={newItem.category_id}
      onChange={handleInputChange}
      className="w-full border rounded-md px-3 py-2"
      required
    >
      <option value="">Select Category</option>
      {menu.menu?.map((cat) => (
        <option key={cat.id} value={cat.id}>
          {cat.name}
        </option>
      ))}
    </select>
  </div>
              <div>
                <label className="block text-sm font-medium">Name</label>
                <input
                name='name'
                  type="text"
                  value={newItem.name}
                  onChange={handleInputChange}
                  className="w-full border rounded-md px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Description</label>
                <textarea
                name='description'
                  value={newItem.description}
                  onChange={handleInputChange }
                  className="w-full border rounded-md px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Price (₹)</label>
                <input
                name='price'
                  type="number"
                  value={newItem.price}
                  onChange={handleInputChange }
                  className="w-full border rounded-md px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium">
                  Preparation Time (mins)
                </label>
                <input
                 name='preparation_time'
                  type="number"
                  value={newItem.preparation_time}
                  onChange={handleInputChange}
                  className="w-full border rounded-md px-3 py-2"
                />
              </div>
              <div className="flex space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                     name="is_vegetarian"
                    checked={newItem.is_vegetarian}
                    onChange={handleInputChange }
                  />
                  <span>Vegetarian</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                   name="is_vegan"
                    type="checkbox"
                    checked={newItem.is_vegan}
                    onChange={handleInputChange}
                  />
                  <span>Vegan</span>
                </label>
              </div>
              <div>
  <label className="block text-sm font-medium">Upload Image</label>
  <input
    type="file"
    accept="image/*"
    onChange={(e) => {
      const file = e.target.files[0];
      if (file) {
        setNewItem((prev) => ({
          ...prev,
          image_url: URL.createObjectURL(file), // preview only
        }));
      }
    }}
    className="w-full border rounded-md px-3 py-2"
  />

  {/* Preview Image */}
  {newItem.image_url && (
    <img
      src={newItem.image_url}
      alt="Preview"
      className="w-32 h-32 object-cover rounded mt-2 border"
    />
  )}
</div>

              
              <div className="flex justify-end space-x-3 mt-4">
                <button
              
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                
                <button
                  type="submit"
                 
                  className="px-4 py-2 text-sm font-medium text-white bg-light-orange rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {editingItem ? "Update Item" : "Save Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};




// Reservations Tab Component
const ReservationsTab = ({ reservations, userRole, onCreateReservation, onEditReservation, onCancelReservation }) => {
  const [deletingId, setDeletingId] = React.useState(null);
  const [deleteError, setDeleteError] = React.useState(null);

  const handleDelete = async (id) => {
    setDeleteError(null);
    setDeletingId(id);
    if (window.confirm('Are you sure you want to delete this reservation?')) {
      try {
        await onCancelReservation(id);
      } catch (err) {
        setDeleteError(err.message || 'Failed to delete reservation');
      }
    }
    setDeletingId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Table Reservations</h3>
        <button
          onClick={onCreateReservation}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          New Reservation
        </button>
      </div>

      {deleteError && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3 text-red-700">
          {deleteError}
        </div>
      )}

      {/* Reservations List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reference
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Table
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Party Size
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reservations.map((reservation) => (
                <tr key={reservation.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {reservation.reservation_reference}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {reservation.first_name} {reservation.last_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    Table {reservation.table_number} ({reservation.location})
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(reservation.reservation_date).toLocaleDateString()} at{' '}
                    {reservation.reservation_time?.slice(0, 5)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {reservation.party_size}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      reservation.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                      reservation.status === 'seated' ? 'bg-blue-100 text-blue-800' :
                      reservation.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {reservation.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex gap-2">
                    <button
                      className="text-blue-600 hover:text-blue-700 mr-2"
                      onClick={() => onEditReservation(reservation)}
                    >
                      Edit
                    </button>
                    <button
                      className="text-red-600 hover:text-white bg-red-100 hover:bg-red-600 border border-red-200 rounded px-2 py-1 transition-colors duration-150"
                      onClick={() => handleDelete(reservation.id)}
                      disabled={deletingId === reservation.id}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const OrdersTab = ({ orders, userRole }) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Orders</h3>

      {/* Orders List */}
      <div className="space-y-4">
        {orders.map((order) => (
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
                    order.status === 'ready' ? 'bg-green-100 text-green-800' :
                    order.status === 'served' ? 'bg-gray-100 text-gray-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {order.status}
                  </span>
                  <span className="inline-flex px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                    {order.order_type}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-4">
                  <div>
                    <span className="font-medium">Customer:</span> {order.first_name} {order.last_name}
                  </div>
                  <div>
                    <span className="font-medium">Table:</span> {order.table_number} ({order.table_location})
                  </div>
                  <div>
                    <span className="font-medium">Total:</span> ₹{parseFloat(order.total_amount + order.tax_amount).toFixed(2)}
                  </div>
                </div>

                {/* Order Items */}
                <div className="border-t border-gray-200 pt-4">
                  <h5 className="font-medium text-gray-900 mb-2">Items:</h5>
                  <div className="space-y-2">
                    {order.items?.map((item) => (
                      <div key={item.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                        <div className="flex-1">
                          <span className="font-medium">{item.quantity}x {item.item_name}</span>
                          {item.special_instructions && (
                            <p className="text-xs text-gray-600">Note: {item.special_instructions}</p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm">₹{parseFloat(item.total_price).toFixed(2)}</span>
                          <span className={`inline-flex px-2 py-1 text-xs rounded ${
                            item.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            item.status === 'preparing' ? 'bg-blue-100 text-blue-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {item.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Order Actions */}
              {['chef', 'bartender', 'waiter', 'manager', 'admin'].includes(userRole) && (
                <div className="ml-4">
                  <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                    Update Status
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {orders.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg">🍽️</div>
          <p className="text-gray-600 mt-2">No orders found</p>
        </div>
      )}
    </div>
  );
};

// Tables Tab Component
const TablesTab = ({ tables, userRole, onAddTable }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Restaurant Tables</h3>
        {['admin', 'manager'].includes(userRole) && (
          <button
            onClick={onAddTable}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Add Table
          </button>
        )}
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tables.map((table) => (
          <div key={table.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-lg font-semibold text-gray-900">
                Table {table.table_number}
              </h4>
              {['admin', 'manager'].includes(userRole) && (
                <button className="text-gray-400 hover:text-gray-600">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                  </svg>
                </button>
              )}
            </div>
            
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center justify-between">
                <span>Capacity:</span>
                <span className="font-medium">{table.capacity} guests</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Location:</span>
                <span className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                  {table.location.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {tables.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg">🪑</div>
          <p className="text-gray-600 mt-2">No tables configured</p>
          {['admin', 'manager'].includes(userRole) && (
            <button
              onClick={onAddTable}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Add First Table
            </button>
          )}
        </div>
      )}

    </div>
  );
}

export default RestaurantPage;
import React, { useState, useEffect } from 'react';
import MenuItemActions from './MenuItemActions';
import EditCategoryModal from './EditCategoryModal';
import AddCategoryModal from './AddCategoryModal';
import ReservationModal from './ReservationModal';
import PlaceOrderModal from './PlaceOrderModal';
import { useAuth } from '../../contexts/AuthContext';
import AddTableForm from './AddTableForm';
import EditTableModal from './EditTableModal';
import {
  restaurantApi,
  restaurantTableApi,
  restaurantMenuApi, 
  restaurantReservationApi, 
  restaurantOrderApi 
} from '../../services/restaurantApi';
import { uploadApi } from '../../services/restaurantApi';
import LoadingSpinner from '../common/LoadingSpinner';
import RestaurantSelector from './RestaurantSelector';
import KitchenDashboard from './KitchenDashboard';

const RestaurantPage = () => {
  // Custom cancel confirmation modal state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReservationId, setCancelReservationId] = useState(null);
  const [cancelingId, setCancelingId] = useState(null);
  const [cancelError, setCancelError] = useState(null);

  // Called by ReservationsTab when cancel is requested
  const handleCancelRequest = (id) => {
    setCancelReservationId(id);
    setShowCancelModal(true);
  };

  // Called by modal when confirmed
  const confirmCancel = async () => {
    setCancelError(null);
    setCancelingId(cancelReservationId);
    try {
      await restaurantReservationApi.cancelReservation(cancelReservationId);
      const reservationData = await restaurantReservationApi.getReservations();
      setReservations(reservationData.reservations || []);
    } catch (err) {
      setCancelError(err.message || 'Failed to cancel reservation');
    }
    setCancelingId(null);
    setShowCancelModal(false);
    setCancelReservationId(null);
  };

  // Called by modal when cancelled
  const closeCancelModal = () => {
    setShowCancelModal(false);
    setCancelReservationId(null);
  };
  // Custom cancel confirmation modal state
  // ...existing code...
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('menu');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);

  // Data states
  const [restaurants, setRestaurants] = useState([]);
  const [tables, setTables] = useState([]);
  const [menu, setMenu] = useState({ menu: [], totalCategories: 0, totalItems: 0 });
  const [reservations, setReservations] = useState([]);
  const [orders, setOrders] = useState([]);

  // Form states
  const [showAddTableModal, setShowAddTableModal] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [showAddMenuItemModal, setShowAddMenuItemModal] = useState(false);
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [editingReservation, setEditingReservation] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [showPlaceOrderModal, setShowPlaceOrderModal] = useState(false);

  // Load restaurants on component mount
  useEffect(() => {
    const loadRestaurants = async () => {
      try {
        const data = await restaurantApi.getRestaurants();
        setRestaurants(data.restaurants || []);
      } catch (err) {
        setError(err.message || 'Failed to load restaurants');
      }
    };

    loadRestaurants();
  }, []);

  // Load data based on user role, active tab, and selected restaurant
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        switch (activeTab) {
          case 'tables':
            if (['admin', 'manager', 'receptionist', 'waiter'].includes(user.role)) {
              const tableData = await restaurantTableApi.getTables(selectedRestaurant);
              setTables(tableData.tables || []);
            }
            break;
          case 'menu':
            const menuData = await restaurantMenuApi.getMenu(selectedRestaurant);
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
          case 'kitchen':
            // Kitchen data is loaded within KitchenDashboard component
            break;
          default:
            break;
        }
      } catch (err) {
        setError(err.message || 'Failed to load data');
      }
      setLoading(false);
    };

    if (activeTab !== 'kitchen') {
      loadData();
    }
  }, [activeTab, user.role, selectedRestaurant]);

  const handleTableSaved = async () => {
    // Refresh tables data after add/update
    try {
      const tableData = await restaurantTableApi.getTables(selectedRestaurant);
      setTables(tableData.tables || []);
    } catch (err) {
      setError(err.message || 'Failed to refresh tables');
    }
  };

  const handleDeleteTable = async (tableId) => {
    if (!window.confirm('Are you sure you want to delete this table?')) return;
    
    try {
      await restaurantTableApi.deleteTable(tableId);
      const tableData = await restaurantTableApi.getTables(selectedRestaurant);
      setTables(tableData.tables || []);
    } catch (err) {
      setError(err.message || 'Failed to delete table');
    }
  };

  const handleOrderPlaced = async () => {
    // Refresh orders data after placing new order
    try {
      const orderData = await restaurantOrderApi.getOrders();
      setOrders(orderData.orders || []);
    } catch (err) {
      setError(err.message || 'Failed to refresh orders');
    }
  };

  const tabs = [
    { id: 'menu', name: 'Menu', icon: '📋', roles: ['customer', 'receptionist', 'waiter', 'chef', 'bartender', 'manager', 'admin'] },
    { id: 'reservations', name: 'Reservations', icon: '📅', roles: ['customer', 'receptionist', 'waiter', 'manager', 'admin'] },
    { id: 'orders', name: 'Orders', icon: '🍽️', roles: ['customer', 'receptionist', 'waiter', 'chef', 'bartender', 'manager', 'admin'] },
    { id: 'tables', name: 'Tables', icon: '🪑', roles: ['receptionist', 'waiter', 'manager', 'admin'] },
    { id: 'kitchen', name: 'Kitchen', icon: '🍳', roles: ['chef', 'bartender', 'manager', 'admin'] }
  ].filter(tab => tab.roles.includes(user.role));

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-hightower font-bold text-gray-900">Restaurant Management</h1>
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

        {/* Restaurant Selector */}
        {activeTab !== 'kitchen' && (
          <div className="mt-4">
            <RestaurantSelector
              selectedRestaurant={selectedRestaurant}
              onRestaurantChange={setSelectedRestaurant}
              showAll={true}
            />
          </div>
        )}
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
              setMenu={setMenu}
              
              userRole={user.role}
              selectedRestaurant={selectedRestaurant}
              restaurants={restaurants}
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
                onCancelRequest={handleCancelRequest}
                cancelingId={cancelingId}
                cancelError={cancelError}
              />
          {showCancelModal && (
            <div className="fixed inset-0 z-50 flex items-start justify-center bg-black bg-opacity-30">
              <div className="bg-white rounded-lg shadow-lg mt-16 p-6 w-full max-w-xs text-center">
                <h3 className="text-lg font-semibold mb-4">Cancel Reservation</h3>
                <p className="mb-6 text-gray-700">Are you sure you want to cancel this reservation?</p>
                <div className="flex justify-center space-x-4">
                  <button
                    className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                    onClick={closeCancelModal}
                  >
                    No
                  </button>
                  <button
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    onClick={confirmCancel}
                    disabled={cancelingId === cancelReservationId}
                  >
                    {cancelingId === cancelReservationId ? 'Cancelling...' : 'Yes, Cancel'}
                  </button>
                </div>
                {cancelError && (
                  <div className="mt-4 text-red-600 text-sm">{cancelError}</div>
                )}
              </div>
            </div>
          )}
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
          {activeTab === 'orders' && (
            <OrdersTab
              orders={orders}
              userRole={user.role}
              selectedRestaurant={selectedRestaurant}
              restaurants={restaurants}
              onPlaceOrder={() => setShowPlaceOrderModal(true)}
            />
          )}

          {/* Tables Tab */}
          {activeTab === 'tables' && (
            <TablesTab 
              tables={tables} 
              userRole={user.role}
              selectedRestaurant={selectedRestaurant}
              restaurants={restaurants}
              onAddTable={() => {
                setEditingTable(null);
                setShowAddTableModal(true);
              }}
              onEditTable={(table) => {
                setEditingTable(table);
                setShowAddTableModal(true);
              }}
              onDeleteTable={handleDeleteTable}
            />
          )}

          {/* Kitchen Tab */}
          {activeTab === 'kitchen' && <KitchenDashboard />}
        </div>
      )}

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

      {/* Place Order Modal */}
      {showPlaceOrderModal && (
        <PlaceOrderModal
          selectedRestaurant={selectedRestaurant}
          restaurants={restaurants}
          userRole={user.role}
          onClose={() => setShowPlaceOrderModal(false)}
          onSave={handleOrderPlaced}
        />
      )}

      {/* Add Category Modal */}
      {showAddCategoryModal && (
        <AddCategoryModal
          selectedRestaurant={selectedRestaurant}
          onClose={() => setShowAddCategoryModal(false)}
          onSave={async () => {
            try {
              const updatedMenu = await restaurantMenuApi.getMenu();
              setMenu(updatedMenu);
            } catch (err) {
              setError(err.message || "Failed to refresh menu");
            }
          }}
        />
      )}

      {/* Add/Edit Table Modal */}
      {showAddTableModal && (
        <AddTableForm
          table={editingTable}
          selectedRestaurant={selectedRestaurant}
          onClose={() => {
            setShowAddTableModal(false);
            setEditingTable(null);
          }}
          onSave={handleTableSaved}
        />
      )}
    </div>
  );
};

const MenuTab = ({ menu, setMenu, userRole, onClose, onEditCategory, selectedRestaurant, restaurants }) => {
  const [selectedType, setSelectedType] = useState("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState("");
  const [error, setError] = useState(""); // Added error state
  const [newItem, setNewItem] = useState({
    category_id: "",
    category_id: "",
    name: "",
    description: "",
    price: "",
    preparation_time: "",
    is_vegetarian: false,
    is_vegan: false,
    image_url: "",
    image_url: "",
  });

  const filteredMenu =
    menu.menu?.filter(
      (category) => selectedType === "all" || category.type === selectedType
    ) || [];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewItem((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    
    // Clear error when user starts typing
    if (error) setError("");
  };

  // Enhanced image upload handler with better error handling
  const handleImageUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }

    // Local preview
    const localUrl = URL.createObjectURL(file);
    setImagePreview(localUrl);

    // Upload to server
    setImageUploading(true);
    setError(""); // Clear any previous errors

    try {
      const toBase64 = (f) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(f);
      });

      const base64 = await toBase64(file);
      console.log('Uploading image...');
      
      const res = await uploadApi.uploadImage(base64);
      console.log('Upload response:', res);

      if (res?.success && res?.url) {
        setNewItem((prev) => ({ ...prev, image_url: res.url }));
        console.log('Image uploaded successfully:', res.url);
      } else {
        throw new Error(res?.message || 'Upload failed - invalid response');
      }
    } catch (err) {
      console.error('Image upload failed:', err);
      setError(`Upload failed: ${err.message || 'Unknown error'}`);
      // Clear the preview on error
     
    } finally {
      setImageUploading(false);
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Validate required fields
      if (!newItem.category_id) {
        throw new Error("Please select a category");
      }
      if (!newItem.name.trim()) {
        throw new Error("Item name is required");
      }
      if (!newItem.description.trim()) {
        throw new Error("Description is required");
      }
      if (!newItem.price || parseFloat(newItem.price) <= 0) {
        throw new Error("Valid price is required");
      }

      console.log("Submitting menu item:", newItem);

      // Prepare data for API
      const submitData = {
        ...newItem,
        price: parseFloat(newItem.price),
        preparation_time: newItem.preparation_time ? parseInt(newItem.preparation_time) : null,
      };

      let response;
      if (editingItem) {
        response = await restaurantMenuApi.updateItem(editingItem.id, submitData);
        console.log("Update response:", response);
      } else {
        response = await restaurantMenuApi.createItem(submitData);
        console.log("Create response:", response);
      }

      // Reset form and close modal on success
      setNewItem({
        category_id: "",
        name: "",
        description: "",
        price: "",
        preparation_time: "",
        is_vegetarian: false,
        is_vegan: false,
        image_url: "",
      });
      setImagePreview("");
      
      setImagePreview("");
      setEditingItem(null);
      setShowAddForm(false);
      
      // Refresh menu after successful operation
      await refreshMenu();
      
    } catch (error) {
      console.error("Error with menu item operation:", error);
      setError(error.response?.data?.message || error.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };


  const handleEditClick = (item) => {
    setEditingItem(item);
    setNewItem({
      category_id: item.category_id,
      name: item.name,
      description: item.description,
      price: item.price.toString(),
      preparation_time: item.preparation_time?.toString() || "",
      is_vegetarian: item.is_vegetarian,
      is_vegan: item.is_vegan,
      image_url: item.image_url || "",
    });
    setImagePreview(""); // Clear preview, use existing image_url
    setError(""); // Clear any errors
    setShowAddForm(true);
  };

  const handleDeleteClick = async (id) => {
    if (typeof window !== "undefined" && !window.confirm("Are you sure you want to delete this item?")) return;
    
    try {
      setError(""); // Clear errors
      console.log("Deleting item:", id);
      
      await restaurantMenuApi.deleteItem(id);
      await refreshMenu(); // Refresh the menu after deletion
      
    } catch (err) {
      console.error("Delete error:", err);
      setError(err.response?.data?.message || err.message || "Failed to delete item");
    }
  };

  const refreshMenu = async () => {
    try {
      console.log("Refreshing menu...");
      const menuData = await restaurantMenuApi.getMenu();
      setMenu(menuData);
    } catch (err) {
      console.error("Refresh menu error:", err);
      setError("Failed to refresh menu");
    }
  };

  const handleClose = () => {
    setShowAddForm(false);
    setEditingItem(null);
    setError(""); // Clear errors
    setNewItem({
      category_id: "",
      name: "",
      description: "",
      price: "",
      preparation_time: "",
      is_vegetarian: false,
      is_vegan: false,
      image_url: "",
    });
    setImagePreview("");
  };

  const selectedRestaurantData = restaurants.find(r => r.id === selectedRestaurant);

  return (
    <div className="space-y-6">
      {/* Global error display */}
      {error && !showAddForm && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-700 text-sm">{error}</p>
          <button 
            onClick={() => setError("")}
            className="text-red-500 text-xs underline mt-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Menu Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="all">All Items</option>
            <option value="restaurant">Restaurant</option>
            <option value="bar">Bar</option>
          </select>
        </div>
        {['admin', 'manager'].includes(userRole) && selectedRestaurant && (
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-light-orange text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Add Menu Item
          </button>
        )}
      </div>

      {/* Restaurant Info */}
      {selectedRestaurantData && (
        <div className="mb-4 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <h3 className="font-semibold text-blue-900">{selectedRestaurantData.name}</h3>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {selectedRestaurantData.restaurant_type}
              </span>
            </div>
            <div className="text-sm text-blue-700">
              📍 {selectedRestaurantData.location.replace('_', ' ')}
            </div>
          </div>
        </div>
      )}

      {!selectedRestaurant && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800 text-sm">
            💡 Select a specific restaurant above to view its menu and add items.
          </p>
        </div>
      )}

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

            {/* Menu Items Grid */}
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
                        onError={(e) => {
                          // Handle broken image
                          e.target.style.display = 'none';
                        }}
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
                      <MenuItemActions 
                        item={item} 
                        onEdit={handleEditClick}
                        onDelete={handleDeleteClick}  
                      />
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

      {/* Enhanced Modal for Add/Edit Menu Item */}
      {showAddForm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-light-orange outline-4 p-2 rounded">
                {editingItem ? "Edit Menu Item" : "Add Menu Item"}
              </h2>

              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600"
                disabled={loading || imageUploading}
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Error display in modal */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleAddItem} className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Category *</label>
                <select
                  name="category_id"
                  value={newItem.category_id}
                  onChange={handleInputChange}
                  className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={loading}
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
                <label className="block text-sm font-medium">Name *</label>
                <input
                  name='name'
                 
                  type="text"
                  value={newItem.name}
                  onChange={handleInputChange}
                  className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Description *</label>
                <textarea
                  name='description'
                 
                  value={newItem.description}
                  onChange={handleInputChange}
                  className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={loading}
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Price (₹) *</label>
                <input
                  name='price'
                 
                  type="number"
                  step="0.01"
                  min="0"
                  value={newItem.price}
                  onChange={handleInputChange}
                  className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium">
                  Preparation Time (mins)
                </label>
                <input
                  name='preparation_time'
                
                  type="number"
                  min="0"
                  value={newItem.preparation_time}
                  onChange={handleInputChange}
                  className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                />
              </div>

              <div className="flex space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="is_vegetarian"
                    
                    checked={newItem.is_vegetarian}
                    onChange={handleInputChange}
                    disabled={loading}
                  />
                  <span>Vegetarian</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    name="is_vegan"
                   
                    type="checkbox"
                    checked={newItem.is_vegan}
                    onChange={handleInputChange}
                    disabled={loading}
                  />
                  <span>Vegan</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium">Upload Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="w-full border rounded-md px-3 py-2"
                  disabled={loading || imageUploading}
                />

                {/* Preview Image */}
                {(imagePreview || newItem.image_url) && (
                  <div className="mt-2">
                    <img
                      src={imagePreview || newItem.image_url}
                      alt="Preview"
                      className="w-32 h-32 object-cover rounded border"
                    />
                    {newItem.image_url && !imagePreview && (
                      <p className="text-xs text-green-600 mt-1">
                        ✓ Current image
                      </p>
                    )}
                  </div>
                )}
                
                {imageUploading && (
                  <p className="text-xs text-blue-500 mt-1">Uploading image...</p>
                )}
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
                  disabled={loading || imageUploading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-light-orange rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading || imageUploading}
                >
                  {loading ? (editingItem ? "Updating..." : "Saving...") : 
                   editingItem ? "Update Item" : "Save Item"}
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
const ReservationsTab = ({ reservations, userRole, onCreateReservation, onEditReservation, onCancelRequest, cancelingId, cancelError }) => {

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Table Reservations</h3>
        <button
          onClick={onCreateReservation}
          className="bg-light-orange text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          New Reservation
        </button>
      </div>

      {cancelError  && (
        <div className="mb-4 bg-red-50 border border-white rounded-md p-3 text-red-700">
          {cancelError }
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
                      className="text-yellow-600 hover:text-white bg-yellow-100 hover:bg-yellow-600 border border-yellow-200 rounded px-2 py-1 transition-colors duration-150"
                      onClick={() => onCancelRequest(reservation.id)}
                      disabled={cancelingId === reservation.id}
                    >
                      {cancelingId === reservation.id ? 'Cancelling...' : 'Cancel'}
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
};

// Orders Tab Component
const OrdersTab = ({ orders, userRole, selectedRestaurant, restaurants }) => {
  const [cancelingId, setCancelingId] = React.useState(null);
  const [cancelError, setCancelError] = React.useState(null);
  const [transferReason, setTransferReason] = React.useState('');
  const [targetKitchen, setTargetKitchen] = React.useState('');
  const [kitchens, setKitchens] = React.useState([]);
  const [showTransferModal, setShowTransferModal] = React.useState(false);
  const [selectedOrder, setSelectedOrder] = React.useState(null);

  useEffect(() => {
    // Load available kitchens for transfer functionality
    const loadKitchens = async () => {
      try {
        const { kitchenApi } = require('../../services/restaurantApi');
        const data = await kitchenApi.getKitchens();
        setKitchens(data.kitchens || []);
      } catch (err) {
        console.error('Failed to load kitchens:', err);
      }
    };

    if (['waiter', 'manager', 'admin'].includes(userRole)) {
      loadKitchens();
    }
  }, [userRole]);

  const handleTransferOrder = async () => {
    if (!selectedOrder || !targetKitchen || !transferReason.trim()) return;

    try {
      const { kitchenApi } = require('../../services/restaurantApi');
      await kitchenApi.transferOrderToKitchen(selectedOrder.id, targetKitchen, transferReason);

      // Refresh orders would go here - for now just close modal
      setShowTransferModal(false);
      setSelectedOrder(null);
      setTransferReason('');
      setTargetKitchen('');
    } catch (err) {
      console.error('Failed to transfer order:', err);
    }
  };
  const onPlaceOrder = () => {
    if (!selectedRestaurant) {
      alert("Please select a restaurant before placing an order");
      return;
    }
    // TODO: integrate with API
    console.log(`Placing new order for restaurant ${selectedRestaurant}`);
    // Example: open a modal or redirect to order form
  };

  return (
  <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Orders</h3>
        <div className="flex items-center space-x-4">
          {selectedRestaurant && (
            <div className="text-sm text-gray-600">
              Showing orders for: {restaurants.find(r => r.id === selectedRestaurant)?.name || 'All restaurants'}
            </div>
          )}
          {['admin', 'manager', 'waiter'].includes(userRole) && selectedRestaurant && (
            <button
              onClick={onPlaceOrder}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              Place Order
            </button>
          )}
        </div>
      </div>

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
                
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Table:</span> {order.table_number || 'Room Service'}
                  </div>
                  <div>
                    <span className="font-medium">Total:</span> ₹{order.total_amount}
                  </div>
                  <div>
                    <span className="font-medium">Created:</span> {new Date(order.created_at).toLocaleString()}
                  </div>
                  <div>
                    <span className="font-medium">Staff:</span> {order.staff_name}
                  </div>
                </div>

                {/* Order Items */}
                <div className="mt-4">
                  <h5 className="font-medium text-gray-900 mb-2">Items:</h5>
                  <div className="space-y-1">
                    {order.items?.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{item.quantity}x {item.name}</span>
                        <span>₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions */}
              {['waiter', 'manager', 'admin'].includes(userRole) && (
                <div className="flex flex-col space-y-2">
                  <button
                    onClick={() => {
                      setSelectedOrder(order);
                      setShowTransferModal(true);
                    }}
                    className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                  >
                    Transfer
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {!selectedRestaurant && (
        <div className="text-center py-12 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="text-yellow-600 text-lg">🏨</div>
          <p className="text-yellow-800 mt-2 font-medium">Please select a restaurant to view and place orders</p>
          <p className="text-yellow-700 text-sm mt-1">Use the restaurant selector above to choose a specific restaurant.</p>
        </div>
      )}

      {selectedRestaurant && orders.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg">🍽️</div>
          <p className="text-gray-600 mt-2">No orders found</p>
          <p className="text-gray-500 text-sm mt-1">Place your first order using the button above.</p>
        </div>
      )}

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Transfer Order</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Transfer to Kitchen</label>
                <select
                  value={targetKitchen}
                  onChange={(e) => setTargetKitchen(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">Select Kitchen</option>
                  {kitchens.map((kitchen) => (
                    <option key={kitchen.id} value={kitchen.id}>
                      {kitchen.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Reason for Transfer</label>
                <textarea
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  rows={3}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="Explain why this order is being transferred..."
                />
              </div>
            </div>
            
            <div className="mt-6 flex space-x-3">
              <button
                onClick={() => {
                  setShowTransferModal(false);
                  setSelectedOrder(null);
                  setTransferReason('');
                  setTargetKitchen('');
                }}
                className="flex-1 bg-gray-200 text-gray-900 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleTransferOrder}
                disabled={!targetKitchen || !transferReason.trim()}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                Transfer Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Table Actions Component
const TableActions = ({ table, onEdit, onDelete }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setOpen(!open)}
        className="text-gray-400 hover:text-gray-600 focus:outline-none"
      >
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded-md shadow-lg z-10">
          <button
            onClick={() => {
              onEdit(table);
              setOpen(false);
            }}
            className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-100 hover:text-blue-800 rounded-t-md"
          >
            Edit
          </button>
          <button
            onClick={() => {
              onDelete(table.id);
              setOpen(false);
            }}
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-100 hover:text-red-800 rounded-b-md"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
};

// Tables Tab Component
const TablesTab = ({ tables, userRole, selectedRestaurant, restaurants }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tableList, setTableList] = useState(tables || []);

  useEffect(() => {
    setTableList(tables || []);
  }, [tables]);

  const selectedRestaurantData = restaurants.find(
    (r) => r.id === selectedRestaurant
  );

  const handleTableAdded = (newTable) => {
    console.log("New table added:", newTable);
    if (newTable) {
      setTableList((prev) => [...prev, newTable]);
    }
  };

  const handleTableEdited = (updatedTable) => {
    console.log("Table updated:", updatedTable);
    setTableList((prev) =>
      prev.map((t) => (t.id === updatedTable.id ? updatedTable : t))
    );
  };

  const handleTableDeleted = (tableId) => {
    console.log("Table deleted:", tableId);
    setTableList((prev) => prev.filter((t) => t.id !== tableId));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Restaurant Tables
        </h3>
        {["admin", "manager"].includes(userRole) && selectedRestaurant && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-light-orange text-white px-4 py-2 rounded-md hover:bg-orange-500"
          >
            Add Table
          </button>
        )}
      </div>

      {selectedRestaurantData && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <h4 className="font-semibold text-blue-900">
                {selectedRestaurantData.name}
              </h4>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {selectedRestaurantData.restaurant_type}
              </span>
            </div>
            <div className="text-sm text-blue-700">
              Total Tables: {tableList.length} | Max Capacity:{" "}
              {selectedRestaurantData.max_capacity}
            </div>
          </div>
        </div>
      )}

      {!selectedRestaurant && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800 text-sm">
            💡 Select a specific restaurant above to view and manage its tables.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tableList.map((tableItem) => (
          <div key={tableItem.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-lg font-semibold text-gray-900">
                Table {tableItem.table_number}
              </h4>
              {["admin", "manager"].includes(userRole) && (
                <EditTableModal
                  item={tableItem}
                  onEdit={handleTableEdited}
                  onDelete={handleTableDeleted}
                />
              )}
            </div>

            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center justify-between">
                <span>Capacity:</span>
                <span className="font-medium">{tableItem.capacity} guests</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Location:</span>
                <span className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                  {tableItem.location?.replace("_", " ") || "N/A"}
                </span>
              </div>
              {tableItem.restaurant_name && (
                <div className="flex items-center justify-between">
                  <span>Restaurant:</span>
                  <span className="text-xs font-medium text-gray-700">
                    {tableItem.restaurant_name}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {tableList.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg">🪑</div>
          <p className="text-gray-600 mt-2">No tables configured</p>
          {["admin", "manager"].includes(userRole) && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Add First Table
            </button>
          )}
        </div>
      )}

      <AddTableForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onTableAdded={handleTableAdded}
        restaurantId={selectedRestaurant}
      />
    </div>
  );
};
 
export default RestaurantPage;

import React, { useState, useEffect } from 'react';
import { roomApi, dashboardApi } from '../../services/api';
import AvailabilityChecker from './AvailabilityChecker';
import RoomResults from './RoomResults';
import PlatformIntegration from './PlatformIntegration';
import LoadingSpinner from '../common/LoadingSpinner';

const RoomsPage = () => {
  const [availableRooms, setAvailableRooms] = useState([]);
  const [searchCriteria, setSearchCriteria] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('search');
  const [roomTypes, setRoomTypes] = useState([]);
  
  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedRoomType, setSelectedRoomType] = useState(null);

  // Load room types on component mount
  useEffect(() => {
    loadRoomTypes();
  }, []);

  const loadRoomTypes = async () => {
    try {
      const types = await roomApi.getRoomTypes();
      setRoomTypes(types);
    } catch (err) {
      console.error('Failed to load room types:', err);
    }
  };

  const handleAvailabilityCheck = (rooms, criteria) => {
    setAvailableRooms(rooms);
    setSearchCriteria(criteria);
    setError('');
    
    // Switch to results tab if rooms found
    if (rooms && rooms.length > 0) {
      setActiveTab('results');
    }
  };

  const handleSearchError = (errorMessage) => {
    setError(errorMessage);
    setAvailableRooms([]);
  };

  const handleEditRoomType = async (roomType) => {
    try {
      const fullRoomType = await roomApi.getRoomTypeById(roomType.id);
      setSelectedRoomType(fullRoomType);
      setShowEditModal(true);
    } catch (err) {
      setError('Failed to load room type details: ' + err.message);
    }
  };

  const handleViewRoomType = async (roomType) => {
    try {
      const fullRoomType = await roomApi.getRoomTypeById(roomType.id);
      setSelectedRoomType(fullRoomType);
      setShowViewModal(true);
    } catch (err) {
      setError('Failed to load room type details: ' + err.message);
    }
  };

  const handleSaveRoomType = async (updatedData) => {
    try {
      await roomApi.updateRoomType(selectedRoomType.id, updatedData);
      setShowEditModal(false);
      setSelectedRoomType(null);
      await loadRoomTypes(); // Reload data
    } catch (err) {
      setError('Failed to update room type: ' + err.message);
    }
  };

  const tabs = [
    { id: 'search', name: 'Check Availability', icon: '🔍' },
    { id: 'results', name: 'Available Rooms', icon: '🏨', badge: availableRooms.length },
    { id: 'management', name: 'Room Management', icon: '⚙️' },
    { id: 'integrations', name: 'Platform Sync', icon: '🔗' }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Room Management</h1>
            <p className="mt-2 text-gray-600">
              Manage room availability, bookings, and platform integrations
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="bg-blue-50 px-4 py-2 rounded-lg">
              <div className="text-sm font-medium text-blue-900">
                Total Room Types: {roomTypes.length}
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
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.name}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-96">
        {activeTab === 'search' && (
          <div className="space-y-6">
            <AvailabilityChecker
              onAvailabilityCheck={handleAvailabilityCheck}
              selectedDates={searchCriteria}
              onDateChange={setSearchCriteria}
            />
            
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Search Error</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{error}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Stats */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Room Status</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="text-2xl font-bold text-blue-600">
                    {roomTypes.reduce((sum, type) => sum + (type.totalRooms || 0), 0)}
                  </div>
                  <div className="text-sm text-gray-600">Total Rooms</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="text-2xl font-bold text-green-600">
                    <RoomAvailabilityCounter type="available" />
                  </div>
                  <div className="text-sm text-gray-600">Available Today</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="text-2xl font-bold text-orange-600">
                    <RoomAvailabilityCounter type="booked" />
                  </div>
                  <div className="text-sm text-gray-600">Booked Today</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'results' && (
          <RoomResults 
            rooms={availableRooms}
            searchCriteria={searchCriteria}
            onNewSearch={() => setActiveTab('search')}
          />
        )}

        {activeTab === 'management' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Room Type Management</h3>
              
              <div className="space-y-4">
                {roomTypes.map((roomType) => (
                  <div key={roomType.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{roomType.name}</h4>
                        <p className="text-sm text-gray-600">{roomType.description}</p>
                        <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                          <span>Capacity: {roomType.max_occupancy || roomType.capacity} guests</span>
                          <span>Rooms: {roomType.totalRooms}</span>
                          <span>Base Price: ₹{roomType.base_price}/night</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => handleEditRoomType(roomType)}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleViewRoomType(roomType)}
                          className="text-gray-600 hover:text-gray-700 text-sm font-medium"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {roomTypes.length === 0 && (
                  <div className="text-center py-8">
                    <div className="text-gray-400 text-lg">🏨</div>
                    <p className="text-gray-600 mt-2">No room types configured</p>
                    <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                      Add Room Type
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'integrations' && (
          <PlatformIntegration roomTypes={roomTypes} />
        )}
      </div>

      {/* Edit Room Type Modal */}
      {showEditModal && selectedRoomType && (
        <EditRoomTypeModal
          roomType={selectedRoomType}
          onSave={handleSaveRoomType}
          onClose={() => {
            setShowEditModal(false);
            setSelectedRoomType(null);
          }}
        />
      )}

      {/* View Room Type Modal */}
      {showViewModal && selectedRoomType && (
        <ViewRoomTypeModal
          roomType={selectedRoomType}
          onClose={() => {
            setShowViewModal(false);
            setSelectedRoomType(null);
          }}
        />
      )}
    </div>
  );
};

// Edit Room Type Modal Component
const EditRoomTypeModal = ({ roomType, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: roomType.name || '',
    description: roomType.description || '',
    base_price: roomType.base_price || '',
    max_occupancy: roomType.max_occupancy || '',
    amenities: roomType.amenities || [],
    is_active: roomType.is_active !== undefined ? roomType.is_active : true,
    room_size: roomType.room_size || '',
    bed_type: roomType.bed_type || '',
    view_type: roomType.view_type || ''
  });
  const [loading, setLoading] = useState(false);
  const [newAmenity, setNewAmenity] = useState('');
  const [errors, setErrors] = useState({});

  // Common amenities for quick selection
  const commonAmenities = [
    'Wi-Fi', 'Air Conditioning', 'TV', 'Mini Bar', 'Room Service',
    'Balcony', 'Sea View', 'Mountain View', 'Safe', 'Hair Dryer',
    'Coffee/Tea Maker', 'Bathtub', 'Shower', 'Telephone', 'Desk',
    'Wardrobe', 'Iron/Ironing Board', 'Refrigerator', 'Microwave'
  ];

  const bedTypes = ['Single', 'Double', 'Queen', 'King', 'Twin Beds', 'Sofa Bed'];
  const viewTypes = ['City View', 'Garden View', 'Mountain View', 'Pool View', 'No View'];

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name?.trim()) newErrors.name = 'Name is required';
    if (!formData.base_price || parseFloat(formData.base_price) <= 0) {
      newErrors.base_price = 'Base price must be greater than 0';
    }
    if (!formData.max_occupancy || parseInt(formData.max_occupancy) <= 0) {
      newErrors.max_occupancy = 'Max occupancy must be greater than 0';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      await onSave({
        ...formData,
        base_price: parseFloat(formData.base_price),
        max_occupancy: parseInt(formData.max_occupancy),
        room_size: formData.room_size ? parseFloat(formData.room_size) : null
      });
    } catch (error) {
      console.error('Error saving room type:', error);
      setErrors({ general: error.message });
    } finally {
      setLoading(false);
    }
  };

  const addAmenity = (amenity) => {
    if (amenity && !formData.amenities.includes(amenity)) {
      setFormData({
        ...formData,
        amenities: [...formData.amenities, amenity]
      });
    }
    setNewAmenity('');
  };

  const removeAmenity = (amenityToRemove) => {
    setFormData({
      ...formData,
      amenities: formData.amenities.filter(amenity => amenity !== amenityToRemove)
    });
  };

  const addCustomAmenity = () => {
    if (newAmenity.trim()) {
      addAmenity(newAmenity.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Edit Room Type</h3>
            <p className="text-sm text-gray-600 mt-1">Update room type details and amenities</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {errors.general && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{errors.general}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h4 className="text-lg font-medium text-gray-900 border-b pb-2">Basic Information</h4>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Room Type Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Deluxe Suite, Standard Room"
                />
                {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe the room type, its features, and what makes it special..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Base Price (₹) *
                  </label>
                  <input
                    type="number"
                    value={formData.base_price}
                    onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                    className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.base_price ? 'border-red-300' : 'border-gray-300'
                    }`}
                    min="0"
                    step="0.01"
                    placeholder="2500"
                  />
                  {errors.base_price && <p className="text-xs text-red-600 mt-1">{errors.base_price}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Occupancy *
                  </label>
                  <input
                    type="number"
                    value={formData.max_occupancy}
                    onChange={(e) => setFormData({ ...formData, max_occupancy: e.target.value })}
                    className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.max_occupancy ? 'border-red-300' : 'border-gray-300'
                    }`}
                    min="1"
                    placeholder="2"
                  />
                  {errors.max_occupancy && <p className="text-xs text-red-600 mt-1">{errors.max_occupancy}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bed Type
                  </label>
                  <select
                    value={formData.bed_type}
                    onChange={(e) => setFormData({ ...formData, bed_type: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select bed type</option>
                    {bedTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    View Type
                  </label>
                  <select
                    value={formData.view_type}
                    onChange={(e) => setFormData({ ...formData, view_type: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select view type</option>
                    {viewTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Room Size (sq ft)
                </label>
                <input
                  type="number"
                  value={formData.room_size}
                  onChange={(e) => setFormData({ ...formData, room_size: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  placeholder="350"
                />
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">Active (available for booking)</span>
                </label>
              </div>
            </div>

            {/* Amenities Management */}
            <div className="space-y-4">
              <h4 className="text-lg font-medium text-gray-900 border-b pb-2">Amenities & Features</h4>
              
              {/* Quick Select Common Amenities */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quick Select
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border border-gray-200 rounded-md p-2">
                  {commonAmenities.map(amenity => (
                    <button
                      key={amenity}
                      type="button"
                      onClick={() => addAmenity(amenity)}
                      disabled={formData.amenities.includes(amenity)}
                      className={`text-xs px-2 py-1 rounded text-left ${
                        formData.amenities.includes(amenity)
                          ? 'bg-green-100 text-green-800 cursor-not-allowed'
                          : 'bg-gray-100 text-gray-700 hover:bg-blue-100 hover:text-blue-800'
                      }`}
                    >
                      {formData.amenities.includes(amenity) ? '✓ ' : ''}{amenity}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Amenity Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Add Custom Amenity
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newAmenity}
                    onChange={(e) => setNewAmenity(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomAmenity())}
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Type custom amenity..."
                  />
                  <button
                    type="button"
                    onClick={addCustomAmenity}
                    className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Selected Amenities */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selected Amenities ({formData.amenities.length})
                </label>
                {formData.amenities.length > 0 ? (
                  <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-md p-3">
                    <div className="flex flex-wrap gap-2">
                      {formData.amenities.map((amenity, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {amenity}
                          <button
                            type="button"
                            onClick={() => removeAmenity(amenity)}
                            className="ml-2 text-blue-600 hover:text-blue-800"
                          >
                            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-md p-3 text-center text-gray-500 text-sm">
                    No amenities selected
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {loading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </div>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// View Room Type Modal Component
const ViewRoomTypeModal = ({ roomType, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Room Type Details</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Basic Information</h4>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">Name:</span> {roomType.name}</div>
                <div><span className="font-medium">Capacity:</span> {roomType.max_occupancy || roomType.capacity} guests</div>
                <div><span className="font-medium">Base Price:</span> ₹{roomType.base_price}/night</div>
                <div><span className="font-medium">Total Rooms:</span> {roomType.totalRooms || 0}</div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Status</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Active:</span>
                  <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                    roomType.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {roomType.is_active ? 'Yes' : 'No'}
                  </span>
                </div>
                <div><span className="font-medium">Created:</span> {new Date(roomType.created_at).toLocaleDateString()}</div>
                <div><span className="font-medium">Updated:</span> {new Date(roomType.updated_at).toLocaleDateString()}</div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2">Description</h4>
            <p className="text-sm text-gray-600">
              {roomType.description || 'No description available'}
            </p>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2">Amenities</h4>
            <div className="flex flex-wrap gap-2">
              {roomType.amenities && roomType.amenities.length > 0 ? (
                roomType.amenities.map((amenity, index) => (
                  <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    {amenity}
                  </span>
                ))
              ) : (
                <span className="text-sm text-gray-500">No amenities listed</span>
              )}
            </div>
          </div>

          {roomType.images && roomType.images.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Images</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {roomType.images.map((image, index) => (
                  <div key={index} className="aspect-video bg-gray-200 rounded-md flex items-center justify-center">
                    <span className="text-xs text-gray-500">Image {index + 1}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Room Availability Counter Component
const RoomAvailabilityCounter = ({ type }) => {
  const [count, setCount] = useState('--');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoomMetrics = async () => {
      try {
        const metrics = await dashboardApi.getMetrics();
        if (metrics.rooms) {
          setCount(type === 'available' ? metrics.rooms.available : metrics.rooms.booked);
        }
      } catch (error) {
        console.error('Failed to fetch room metrics:', error);
        setCount('--');
      } finally {
        setLoading(false);
      }
    };

    fetchRoomMetrics();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchRoomMetrics, 30000);
    return () => clearInterval(interval);
  }, [type]);

  if (loading) {
    return (
      <div className="flex items-center justify-center">
        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  return <span>{count}</span>;
};

export default RoomsPage;

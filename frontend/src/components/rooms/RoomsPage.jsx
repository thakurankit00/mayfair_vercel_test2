import React, { useState, useEffect } from 'react';
import { roomApi } from '../../services/api';
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
                  <div className="text-2xl font-bold text-green-600">--</div>
                  <div className="text-sm text-gray-600">Available Today</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="text-2xl font-bold text-orange-600">--</div>
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
    amenities: roomType.amenities || []
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave({
        ...formData,
        base_price: parseFloat(formData.base_price),
        max_occupancy: parseInt(formData.max_occupancy)
      });
    } catch (error) {
      console.error('Error saving room type:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Edit Room Type</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Base Price (₹)
            </label>
            <input
              type="number"
              value={formData.base_price}
              onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              required
              min="0"
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Occupancy (guests)
            </label>
            <input
              type="number"
              value={formData.max_occupancy}
              onChange={(e) => setFormData({ ...formData, max_occupancy: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              required
              min="1"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
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

export default RoomsPage;

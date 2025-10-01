import React, { useState, useEffect } from 'react';
import { roomApi } from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';

const RoomTypes = ({ onSelectRoomType, selectedRoomType }) => {
  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    loadRoomTypes();
  }, []);

  const loadRoomTypes = async () => {
    try {
      setLoading(true);
      const data = await roomApi.getRoomTypes();
      setRoomTypes(data);
    } catch (err) {
      setError('Failed to load room types');
      console.error('Error loading room types:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(price);
  };

  const getAmenityIcon = (amenity) => {
    const icons = {
      'AC': '❄️',
      'TV': '📺',
      'WiFi': '📶',
      'Mini Bar': '🍷',
      'Mountain View': '🏔️',
      'Room Service': '🍽️',
      'Living Area': '🛋️',
      'Balcony': '🌅',
      'Premium Toiletries': '🧴',
      'Bunk Beds': '🛏️',
      'Extra Bedding': '🛌',
      'Children Amenities': '🧸',
      'Complimentary Breakfast': '🍳'
    };
    return icons[amenity] || '✨';
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading room types..." />;
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
              <div className="mt-2">
                <button
                  onClick={loadRoomTypes}
                  className="text-sm bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Room Types</h2>
        <p className="mt-2 text-gray-600">
          Choose from our carefully designed accommodations at Mayfair Hotel
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {roomTypes.map((roomType) => (
          <div
            key={roomType.id}
            className={`bg-white rounded-lg shadow-md overflow-hidden border-2 transition-all duration-200 hover:shadow-lg ${
              selectedRoomType?.id === roomType.id
                ? 'border-blue-500 ring-2 ring-blue-200'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            {/* Room Image */}
            <div className="h-48 bg-gradient-to-r from-blue-500 to-blue-600 relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-white text-center">
                  <div className="text-4xl mb-2">🏨</div>
                  <div className="text-sm font-medium">{roomType.name}</div>
                </div>
              </div>
              {roomType.images && roomType.images.length > 0 && (
                <img
                  src={roomType.images[0]}
                  alt={roomType.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              )}
            </div>

            {/* Room Details */}
            <div className="p-6">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-xl font-semibold text-gray-900">
                  {roomType.name}
                </h3>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatPrice(roomType.basePrice)}
                  </div>
                  <div className="text-sm text-gray-500">per night</div>
                </div>
              </div>

              <p className="text-gray-600 mb-4 line-clamp-2">
                {roomType.description}
              </p>

              {/* Occupancy */}
              <div className="flex items-center mb-4 text-sm text-gray-600">
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Up to {roomType.maxOccupancy} guests
              </div>

              {/* Amenities */}
              {roomType.amenities && roomType.amenities.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Amenities</h4>
                  <div className="flex flex-wrap gap-2">
                    {roomType.amenities.slice(0, 4).map((amenity, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        <span className="mr-1">{getAmenityIcon(amenity)}</span>
                        {amenity}
                      </span>
                    ))}
                    {roomType.amenities.length > 4 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        +{roomType.amenities.length - 4} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Action Button */}
              {user?.role === 'customer' && onSelectRoomType && (
                <button
                  onClick={() => onSelectRoomType(roomType)}
                  className={`w-full py-2 px-4 rounded-md font-medium transition duration-200 ${
                    selectedRoomType?.id === roomType.id
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200'
                  }`}
                >
                  {selectedRoomType?.id === roomType.id ? 'Selected' : 'Select Room'}
                </button>
              )}

              {user?.role !== 'customer' && (
                <div className="flex space-x-2">
                  <button className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-md font-medium transition duration-200">
                    View Details
                  </button>
                  {['manager', 'admin', 'receptionist'].includes(user?.role) && (
                    <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md font-medium transition duration-200">
                      Manage
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {roomTypes.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">🏨</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No room types available</h3>
          <p className="text-gray-600">Room types will appear here once they're added to the system.</p>
        </div>
      )}
    </div>
  );
};

export default RoomTypes;

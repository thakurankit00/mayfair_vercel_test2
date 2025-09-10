import React, { useState, useEffect } from 'react';
import { restaurantApi } from '../../services/restaurantApi';
import LoadingSpinner from '../common/LoadingSpinner';

const RestaurantSelector = ({ selectedRestaurant, onRestaurantChange, showAll = true }) => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        setLoading(true);
        const data = await restaurantApi.getRestaurants();
        setRestaurants(data.restaurants || []);
      } catch (err) {
        setError(err.message || 'Failed to fetch restaurants');
        console.error('Error fetching restaurants:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, []);

  if (loading) return <LoadingSpinner size="sm" />;
  
  if (error) {
    return (
      <div className="text-red-600 text-sm">
        Error loading restaurants: {error}
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-2">
      <label className="text-sm font-medium text-gray-700">
        Select Restaurant
      </label>
      <select
        value={selectedRestaurant || 'all'}
        onChange={(e) => onRestaurantChange(e.target.value === 'all' ? null : e.target.value)}
        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
      >
        {showAll && <option value="all">All Restaurants</option>}
        {restaurants.map((restaurant) => (
          <option key={restaurant.id} value={restaurant.id}>
            {restaurant.name} ({restaurant.restaurant_type})
          </option>
        ))}
      </select>
      
      {/* Restaurant Info */}
      {selectedRestaurant && selectedRestaurant !== 'all' && (
        <div className="mt-2 p-3 bg-blue-50 rounded-md">
          {(() => {
            const restaurant = restaurants.find(r => r.id === selectedRestaurant);
            if (!restaurant) return null;
            
            return (
              <div className="space-y-1 text-sm">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-blue-900">{restaurant.name}</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                    {restaurant.restaurant_type}
                  </span>
                </div>
                <p className="text-blue-700">{restaurant.description}</p>
                <div className="flex items-center justify-between text-blue-600">
                  <span>📍 {restaurant.location.replace('_', ' ')}</span>
                  <span>👥 Capacity: {restaurant.max_capacity}</span>
                </div>
                {restaurant.has_kitchen && (
                  <div className="flex items-center space-x-1 text-blue-600">
                    <span>🍳</span>
                    <span>{restaurant.kitchen_name}</span>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default RestaurantSelector;

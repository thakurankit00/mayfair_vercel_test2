import React, { useState } from 'react';
import { roomApi } from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';

const AvailabilityChecker = ({ onAvailabilityCheck, selectedDates, onDateChange }) => {
  const [formData, setFormData] = useState({
    checkInDate: selectedDates?.checkInDate || '',
    checkOutDate: selectedDates?.checkOutDate || '',
    adults: selectedDates?.adults || 1,
    children: selectedDates?.children || 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];
  
  // Get tomorrow's date as default checkout
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowString = tomorrow.toISOString().split('T')[0];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      
      // Auto-adjust checkout date if checkin is changed
      if (name === 'checkInDate' && value) {
        const checkIn = new Date(value);
        const checkOut = new Date(newData.checkOutDate);
        
        if (!newData.checkOutDate || checkOut <= checkIn) {
          const nextDay = new Date(checkIn);
          nextDay.setDate(nextDay.getDate() + 1);
          newData.checkOutDate = nextDay.toISOString().split('T')[0];
        }
      }
      
      return newData;
    });
    
    setError('');
  };

  const validateDates = () => {
    if (!formData.checkInDate || !formData.checkOutDate) {
      setError('Please select both check-in and check-out dates');
      return false;
    }

    const checkIn = new Date(formData.checkInDate);
    const checkOut = new Date(formData.checkOutDate);
    const todayDate = new Date(today);

    if (checkIn < todayDate) {
      setError('Check-in date cannot be in the past');
      return false;
    }

    if (checkOut <= checkIn) {
      setError('Check-out date must be after check-in date');
      return false;
    }

    const timeDiff = checkOut - checkIn;
    const dayDiff = timeDiff / (1000 * 3600 * 24);
    
    if (dayDiff > 30) {
      setError('Maximum stay is 30 days');
      return false;
    }

    if (formData.adults < 1) {
      setError('At least one adult is required');
      return false;
    }

    if (formData.adults > 10) {
      setError('Maximum 10 adults allowed');
      return false;
    }

    if (formData.children > 8) {
      setError('Maximum 8 children allowed');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateDates()) return;

    setLoading(true);
    try {
      const availableRooms = await roomApi.checkAvailability(
        formData.checkInDate,
        formData.checkOutDate,
        parseInt(formData.adults),
        parseInt(formData.children)
      );
      
      // Update parent component with search data
      if (onDateChange) {
        onDateChange(formData);
      }
      
      if (onAvailabilityCheck) {
        onAvailabilityCheck(availableRooms, formData);
      }
      
    } catch (err) {
      setError(err.message || 'Failed to check availability');
    } finally {
      setLoading(false);
    }
  };

  const calculateNights = () => {
    if (formData.checkInDate && formData.checkOutDate) {
      const checkIn = new Date(formData.checkInDate);
      const checkOut = new Date(formData.checkOutDate);
      const timeDiff = checkOut - checkIn;
      const nights = Math.ceil(timeDiff / (1000 * 3600 * 24));
      return nights > 0 ? nights : 0;
    }
    return 0;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Check Availability</h3>
        <p className="text-sm text-gray-600">
          Find the perfect room for your stay at Mayfair Hotel
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Date Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="checkInDate" className="block text-sm font-medium text-gray-700 mb-1">
              Check-in Date
            </label>
            <input
              type="date"
              id="checkInDate"
              name="checkInDate"
              value={formData.checkInDate}
              onChange={handleInputChange}
              min={today}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="checkOutDate" className="block text-sm font-medium text-gray-700 mb-1">
              Check-out Date
            </label>
            <input
              type="date"
              id="checkOutDate"
              name="checkOutDate"
              value={formData.checkOutDate}
              onChange={handleInputChange}
              min={formData.checkInDate || tomorrowString}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
        </div>

        {/* Guest Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="adults" className="block text-sm font-medium text-gray-700 mb-1">
              Adults
            </label>
            <select
              id="adults"
              name="adults"
              value={formData.adults}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              {[...Array(10)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1} Adult{i === 0 ? '' : 's'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="children" className="block text-sm font-medium text-gray-700 mb-1">
              Children
            </label>
            <select
              id="children"
              name="children"
              value={formData.children}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              {[...Array(9)].map((_, i) => (
                <option key={i} value={i}>
                  {i} {i === 1 ? 'Child' : 'Children'}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Summary */}
        {formData.checkInDate && formData.checkOutDate && (
          <div className="bg-blue-50 rounded-md p-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-4">
                <div>
                  <span className="font-medium text-blue-900">Check-in:</span>
                  <span className="text-blue-700 ml-1">{formatDate(formData.checkInDate)}</span>
                </div>
                <div>
                  <span className="font-medium text-blue-900">Check-out:</span>
                  <span className="text-blue-700 ml-1">{formatDate(formData.checkOutDate)}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium text-blue-900">
                  {calculateNights()} night{calculateNights() === 1 ? '' : 's'}
                </div>
                <div className="text-blue-700">
                  {formData.adults} adult{formData.adults === 1 ? '' : 's'}
                  {formData.children > 0 && `, ${formData.children} child${formData.children === 1 ? '' : 'ren'}`}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-md transition duration-200 flex items-center justify-center"
        >
          {loading ? (
            <>
              <LoadingSpinner size="sm" text="" />
              <span className="ml-2">Checking Availability...</span>
            </>
          ) : (
            <>
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Search Available Rooms
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default AvailabilityChecker;

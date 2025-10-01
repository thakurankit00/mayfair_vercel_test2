import api from './api';

export const roomApi = {
  // Get all occupied rooms for room service
  getOccupiedRooms: async () => {
    try {
      console.log('🏨 [API] Fetching occupied rooms...');
      const token = localStorage.getItem('token');
      console.log('🏨 [API] Auth token present:', !!token);
      console.log('🏨 [API] Token preview:', token ? token.substring(0, 20) + '...' : 'No token');

      const response = await api.get('/rooms/occupied');
      console.log('🏨 [API] Occupied rooms response:', response);
      return response;
    } catch (error) {
      console.error('❌ [API] Failed to fetch occupied rooms:', error);
      console.error('❌ [API] Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      throw new Error(error.response?.data?.message || 'Failed to fetch occupied rooms');
    }
  },

  // Get room details by ID
  getRoomById: async (roomId) => {
    try {
      console.log(`🏨 [API] Fetching room details for ID: ${roomId}`);
      const response = await api.get(`/rooms/${roomId}`);
      return response.data;
    } catch (error) {
      console.error(`❌ [API] Failed to fetch room ${roomId}:`, error);
      throw new Error(error.response?.data?.message || 'Failed to fetch room details');
    }
  },

  // Validate room occupancy status
  validateRoomOccupancy: async (roomId) => {
    try {
      const response = await api.get(`/rooms/${roomId}/occupancy`);
      return response.data.isOccupied;
    } catch (error) {
      console.error(`❌ [API] Failed to validate room occupancy:`, error);
      return false;
    }
  }
};

export default roomApi;
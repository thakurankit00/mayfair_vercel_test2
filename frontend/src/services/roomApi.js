import api from './api';

export const roomApi = {
  // Get all occupied rooms for room service
  getOccupiedRooms: async () => {
    try {
      console.log('🏨 [API] Fetching occupied rooms...');
      const response = await api.get('/rooms/occupied');
      console.log('🏨 [API] Occupied rooms response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [API] Failed to fetch occupied rooms:', error);
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
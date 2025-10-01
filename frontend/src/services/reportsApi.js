import axios from 'axios';

// Base API configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

// Create axios instance with default config
const reportsApi = axios.create({
  baseURL: `${API_BASE_URL}/api/v1/reports`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
reportsApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
reportsApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Reports API functions
export const reportsApiService = {
  // Reservation Reports
  getReservationReports: async (params = {}) => {
    try {
      const response = await reportsApi.get('/reservation', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching reservation reports:', error);
      throw error;
    }
  },

  // Front Office Reports
  getFrontOfficeReports: async (params = {}) => {
    try {
      const response = await reportsApi.get('/front-office', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching front office reports:', error);
      throw error;
    }
  },

  // Back Office Reports
  getBackOfficeReports: async (params = {}) => {
    try {
      const response = await reportsApi.get('/back-office', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching back office reports:', error);
      throw error;
    }
  },

  // Audit Reports
  getAuditReports: async (params = {}) => {
    try {
      const response = await reportsApi.get('/audit', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching audit reports:', error);
      throw error;
    }
  },

  // Statistical Reports
  getStatisticalReports: async (params = {}) => {
    try {
      const response = await reportsApi.get('/statistical', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching statistical reports:', error);
      throw error;
    }
  },

  // Charts Reports
  getChartsReports: async (params = {}) => {
    try {
      const response = await reportsApi.get('/charts', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching charts reports:', error);
      throw error;
    }
  },

  // Export functionality
  exportReport: async (reportType, subSection, format = 'pdf', params = {}) => {
    try {
      const response = await reportsApi.get(`/${reportType}/export`, {
        params: { subSection, format, ...params },
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${reportType}-${subSection}-report.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return response.data;
    } catch (error) {
      console.error('Error exporting report:', error);
      throw error;
    }
  }
};

// Custom hooks for React Query integration
export const useReportsQuery = (reportType, params = {}) => {
  const queryKey = ['reports', reportType, params];
  
  const queryFn = async () => {
    switch (reportType) {
      case 'reservation':
        return reportsApiService.getReservationReports(params);
      case 'front-office':
        return reportsApiService.getFrontOfficeReports(params);
      case 'back-office':
        return reportsApiService.getBackOfficeReports(params);
      case 'audit':
        return reportsApiService.getAuditReports(params);
      case 'statistical':
        return reportsApiService.getStatisticalReports(params);
      case 'charts':
        return reportsApiService.getChartsReports(params);
      default:
        throw new Error(`Unknown report type: ${reportType}`);
    }
  };

  return { queryKey, queryFn };
};

// Utility functions
export const formatReportData = (data, reportType, subSection) => {
  if (!data || !data.data) return [];
  
  // Apply any necessary data transformations based on report type
  switch (reportType) {
    case 'back-office':
      return formatBackOfficeData(data.data, subSection);
    case 'audit':
      return formatAuditData(data.data, subSection);
    case 'reservation':
      return formatReservationData(data.data, subSection);
    case 'front-office':
      return formatFrontOfficeData(data.data, subSection);
    case 'statistical':
      return formatStatisticalData(data.data, subSection);
    case 'charts':
      return formatChartsData(data.data, subSection);
    default:
      return data.data;
  }
};

// Data formatting functions
const formatBackOfficeData = (data, subSection) => {
  // Add any specific formatting for back office data
  return data;
};

const formatAuditData = (data, subSection) => {
  // Add any specific formatting for audit data
  return data;
};

const formatReservationData = (data, subSection) => {
  // Add any specific formatting for reservation data
  return data;
};

const formatFrontOfficeData = (data, subSection) => {
  // Add any specific formatting for front office data
  return data;
};

const formatStatisticalData = (data, subSection) => {
  // Add any specific formatting for statistical data
  return data;
};

const formatChartsData = (data, subSection) => {
  // Add any specific formatting for charts data
  return data;
};

// Error handling utilities
export const handleReportError = (error, reportType) => {
  console.error(`Error in ${reportType} report:`, error);
  
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;
    switch (status) {
      case 401:
        return 'Unauthorized access. Please login again.';
      case 403:
        return 'Access denied. You do not have permission to view this report.';
      case 404:
        return 'Report not found.';
      case 500:
        return 'Server error. Please try again later.';
      default:
        return data?.message || 'An error occurred while fetching the report.';
    }
  } else if (error.request) {
    // Network error
    return 'Network error. Please check your connection and try again.';
  } else {
    // Other error
    return error.message || 'An unexpected error occurred.';
  }
};

export default reportsApiService;

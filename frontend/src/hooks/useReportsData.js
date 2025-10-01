import { useState, useEffect, useCallback } from 'react';
import { reportsApiService, formatReportData, handleReportError } from '../services/reportsApi';

/**
 * Custom hook for managing reports data with API integration
 * @param {string} reportType - Type of report (reservation, front-office, etc.)
 * @param {string} subSection - Active sub-section
 * @param {object} filters - Filter parameters
 * @returns {object} - Hook state and functions
 */
export const useReportsData = (reportType, subSection, filters = {}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

  // Fetch data function
  const fetchData = useCallback(async (forceRefresh = false) => {
    // Skip if already loading or if we have recent data (unless forced)
    if (loading || (!forceRefresh && lastFetch && Date.now() - lastFetch < 30000)) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = {
        subSection,
        ...filters,
        timestamp: Date.now() // Cache busting
      };

      let response;
      switch (reportType) {
        case 'reservation':
          response = await reportsApiService.getReservationReports(params);
          break;
        case 'front-office':
          response = await reportsApiService.getFrontOfficeReports(params);
          break;
        case 'back-office':
          response = await reportsApiService.getBackOfficeReports(params);
          break;
        case 'audit':
          response = await reportsApiService.getAuditReports(params);
          break;
        case 'statistical':
          response = await reportsApiService.getStatisticalReports(params);
          break;
        case 'charts':
          response = await reportsApiService.getChartsReports(params);
          break;
        default:
          throw new Error(`Unknown report type: ${reportType}`);
      }

      // Format the data based on report type and sub-section
      const formattedData = formatReportData(response, reportType, subSection);
      setData(formattedData);
      setLastFetch(Date.now());
    } catch (err) {
      const errorMessage = handleReportError(err, reportType);
      setError(errorMessage);
      console.error(`Error fetching ${reportType} report:`, err);
    } finally {
      setLoading(false);
    }
  }, [reportType, subSection, filters, loading, lastFetch]);

  // Auto-fetch when dependencies change
  useEffect(() => {
    if (reportType && subSection) {
      fetchData();
    }
  }, [reportType, subSection, filters, fetchData]);

  // Refresh function
  const refresh = useCallback(() => {
    fetchData(true);
  }, [fetchData]);

  // Export function
  const exportReport = useCallback(async (format = 'pdf') => {
    try {
      setLoading(true);
      await reportsApiService.exportReport(reportType, subSection, format, filters);
    } catch (err) {
      const errorMessage = handleReportError(err, reportType);
      setError(errorMessage);
      console.error(`Error exporting ${reportType} report:`, err);
    } finally {
      setLoading(false);
    }
  }, [reportType, subSection, filters]);

  return {
    data,
    loading,
    error,
    refresh,
    exportReport,
    lastFetch
  };
};

/**
 * Hook for managing multiple report types data
 * @param {Array} reportConfigs - Array of {reportType, subSection, filters}
 * @returns {object} - Combined hook state
 */
export const useMultipleReportsData = (reportConfigs = []) => {
  const [combinedData, setCombinedData] = useState({});
  const [combinedLoading, setCombinedLoading] = useState(false);
  const [combinedError, setCombinedError] = useState(null);

  const fetchAllReports = useCallback(async () => {
    if (reportConfigs.length === 0) return;

    setCombinedLoading(true);
    setCombinedError(null);

    try {
      const promises = reportConfigs.map(async (config) => {
        const { reportType, subSection, filters = {} } = config;
        const params = { subSection, ...filters };

        let response;
        switch (reportType) {
          case 'reservation':
            response = await reportsApiService.getReservationReports(params);
            break;
          case 'front-office':
            response = await reportsApiService.getFrontOfficeReports(params);
            break;
          case 'back-office':
            response = await reportsApiService.getBackOfficeReports(params);
            break;
          case 'audit':
            response = await reportsApiService.getAuditReports(params);
            break;
          case 'statistical':
            response = await reportsApiService.getStatisticalReports(params);
            break;
          case 'charts':
            response = await reportsApiService.getChartsReports(params);
            break;
          default:
            throw new Error(`Unknown report type: ${reportType}`);
        }

        return {
          reportType,
          subSection,
          data: formatReportData(response, reportType, subSection)
        };
      });

      const results = await Promise.all(promises);
      const dataMap = {};
      
      results.forEach(result => {
        const key = `${result.reportType}-${result.subSection}`;
        dataMap[key] = result.data;
      });

      setCombinedData(dataMap);
    } catch (err) {
      const errorMessage = handleReportError(err, 'multiple reports');
      setCombinedError(errorMessage);
      console.error('Error fetching multiple reports:', err);
    } finally {
      setCombinedLoading(false);
    }
  }, [reportConfigs]);

  useEffect(() => {
    fetchAllReports();
  }, [fetchAllReports]);

  return {
    data: combinedData,
    loading: combinedLoading,
    error: combinedError,
    refresh: fetchAllReports
  };
};

/**
 * Hook for real-time report updates
 * @param {string} reportType - Type of report
 * @param {string} subSection - Active sub-section
 * @param {object} filters - Filter parameters
 * @param {number} interval - Refresh interval in milliseconds (default: 5 minutes)
 * @returns {object} - Hook state and functions
 */
export const useRealTimeReports = (reportType, subSection, filters = {}, interval = 300000) => {
  const baseHook = useReportsData(reportType, subSection, filters);
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(false);

  useEffect(() => {
    if (!isRealTimeEnabled) return;

    const intervalId = setInterval(() => {
      baseHook.refresh();
    }, interval);

    return () => clearInterval(intervalId);
  }, [isRealTimeEnabled, interval, baseHook]);

  const toggleRealTime = useCallback(() => {
    setIsRealTimeEnabled(prev => !prev);
  }, []);

  return {
    ...baseHook,
    isRealTimeEnabled,
    toggleRealTime
  };
};

/**
 * Hook for caching report data
 * @param {string} reportType - Type of report
 * @param {string} subSection - Active sub-section
 * @param {object} filters - Filter parameters
 * @param {number} cacheTime - Cache time in milliseconds (default: 10 minutes)
 * @returns {object} - Hook state and functions
 */
export const useCachedReportsData = (reportType, subSection, filters = {}, cacheTime = 600000) => {
  const [cache, setCache] = useState(new Map());
  
  const getCacheKey = useCallback(() => {
    return `${reportType}-${subSection}-${JSON.stringify(filters)}`;
  }, [reportType, subSection, filters]);

  const getCachedData = useCallback(() => {
    const key = getCacheKey();
    const cached = cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < cacheTime) {
      return cached.data;
    }
    
    return null;
  }, [cache, getCacheKey, cacheTime]);

  const setCachedData = useCallback((data) => {
    const key = getCacheKey();
    setCache(prev => new Map(prev).set(key, {
      data,
      timestamp: Date.now()
    }));
  }, [getCacheKey]);

  const baseHook = useReportsData(reportType, subSection, filters);

  // Override data with cached version if available
  const cachedData = getCachedData();
  const finalData = cachedData || baseHook.data;

  // Cache new data when it arrives
  useEffect(() => {
    if (baseHook.data && baseHook.data.length > 0 && !cachedData) {
      setCachedData(baseHook.data);
    }
  }, [baseHook.data, cachedData, setCachedData]);

  const clearCache = useCallback(() => {
    setCache(new Map());
  }, []);

  return {
    ...baseHook,
    data: finalData,
    isCached: !!cachedData,
    clearCache
  };
};

export default useReportsData;

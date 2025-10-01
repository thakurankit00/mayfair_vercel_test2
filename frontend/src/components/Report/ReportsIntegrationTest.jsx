import React, { useState } from 'react';
import { useReportsData, useMultipleReportsData } from '../../hooks/useReportsData';
import { reportsApiService } from '../../services/reportsApi';
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Play } from 'lucide-react';

const ReportsIntegrationTest = () => {
  const [testResults, setTestResults] = useState({});
  const [isRunning, setIsRunning] = useState(false);
  const [selectedTest, setSelectedTest] = useState('single-report');

  // Test configurations
  const testConfigs = {
    'single-report': {
      name: 'Single Report Test',
      description: 'Test fetching a single back office report',
      reportType: 'back-office',
      subSection: 'daily-sales-report'
    },
    'multiple-reports': {
      name: 'Multiple Reports Test',
      description: 'Test fetching multiple reports simultaneously',
      configs: [
        { reportType: 'back-office', subSection: 'daily-sales-report' },
        { reportType: 'audit', subSection: 'night-audit-report' },
        { reportType: 'reservation', subSection: 'new-reservations' }
      ]
    },
    'api-endpoints': {
      name: 'API Endpoints Test',
      description: 'Test all API endpoints directly'
    }
  };

  // Single report test hook
  const singleReportHook = useReportsData(
    selectedTest === 'single-report' ? testConfigs['single-report'].reportType : null,
    selectedTest === 'single-report' ? testConfigs['single-report'].subSection : null,
    { dateRange: '2024-01-01 - 2024-01-31' }
  );

  // Multiple reports test hook
  const multipleReportsHook = useMultipleReportsData(
    selectedTest === 'multiple-reports' ? testConfigs['multiple-reports'].configs : []
  );

  // Run API endpoints test
  const runApiEndpointsTest = async () => {
    const results = {};
    const endpoints = [
      { name: 'Reservation Reports', fn: () => reportsApiService.getReservationReports({ subSection: 'new-reservations' }) },
      { name: 'Front Office Reports', fn: () => reportsApiService.getFrontOfficeReports({ subSection: 'check-in-reports' }) },
      { name: 'Back Office Reports', fn: () => reportsApiService.getBackOfficeReports({ subSection: 'daily-sales-report' }) },
      { name: 'Audit Reports', fn: () => reportsApiService.getAuditReports({ subSection: 'night-audit-report' }) },
      { name: 'Statistical Reports', fn: () => reportsApiService.getStatisticalReports({ subSection: 'revenue-analytics' }) },
      { name: 'Charts Reports', fn: () => reportsApiService.getChartsReports({ subSection: 'revenue-charts' }) }
    ];

    for (const endpoint of endpoints) {
      try {
        const startTime = Date.now();
        const response = await endpoint.fn();
        const endTime = Date.now();
        
        results[endpoint.name] = {
          status: 'success',
          responseTime: endTime - startTime,
          dataLength: response?.data?.length || 0,
          message: `Success - ${response?.data?.length || 0} records`
        };
      } catch (error) {
        results[endpoint.name] = {
          status: 'error',
          error: error.message,
          message: `Error: ${error.message}`
        };
      }
    }

    return results;
  };

  // Run comprehensive test
  const runTest = async () => {
    setIsRunning(true);
    setTestResults({});

    try {
      let results = {};

      switch (selectedTest) {
        case 'single-report':
          // Test single report hook
          results = {
            'Hook Data': {
              status: singleReportHook.data && singleReportHook.data.length > 0 ? 'success' : 'warning',
              message: `${singleReportHook.data?.length || 0} records loaded`,
              loading: singleReportHook.loading,
              error: singleReportHook.error
            },
            'Hook Loading State': {
              status: singleReportHook.loading !== undefined ? 'success' : 'error',
              message: `Loading state: ${singleReportHook.loading}`
            },
            'Hook Error Handling': {
              status: singleReportHook.error !== undefined ? 'success' : 'error',
              message: singleReportHook.error || 'No errors'
            }
          };
          break;

        case 'multiple-reports':
          // Test multiple reports hook
          const dataKeys = Object.keys(multipleReportsHook.data || {});
          results = {
            'Multiple Reports Data': {
              status: dataKeys.length > 0 ? 'success' : 'warning',
              message: `${dataKeys.length} report types loaded`,
              loading: multipleReportsHook.loading,
              error: multipleReportsHook.error
            },
            'Data Structure': {
              status: dataKeys.length > 0 ? 'success' : 'error',
              message: `Keys: ${dataKeys.join(', ')}`
            }
          };
          break;

        case 'api-endpoints':
          // Test API endpoints directly
          results = await runApiEndpointsTest();
          break;

        default:
          results = { 'Unknown Test': { status: 'error', message: 'Unknown test type' } };
      }

      setTestResults(results);
    } catch (error) {
      setTestResults({
        'Test Error': {
          status: 'error',
          message: error.message
        }
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Reports Integration Test</h1>
        <p className="text-gray-600">Test the integration between frontend components and backend API endpoints.</p>
      </div>

      {/* Test Selection */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Select Test Type</h2>
        <div className="space-y-3">
          {Object.entries(testConfigs).map(([key, config]) => (
            <label key={key} className="flex items-center">
              <input
                type="radio"
                name="testType"
                value={key}
                checked={selectedTest === key}
                onChange={(e) => setSelectedTest(e.target.value)}
                className="mr-3"
              />
              <div>
                <div className="font-medium text-gray-900">{config.name}</div>
                <div className="text-sm text-gray-600">{config.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Test Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">Test Controls</h2>
          <button
            onClick={runTest}
            disabled={isRunning}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isRunning ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Play className="w-4 h-4 mr-2" />
            )}
            {isRunning ? 'Running Test...' : 'Run Test'}
          </button>
        </div>
      </div>

      {/* Test Results */}
      {Object.keys(testResults).length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Test Results</h2>
          <div className="space-y-3">
            {Object.entries(testResults).map(([testName, result]) => (
              <div
                key={testName}
                className={`p-4 rounded-lg border ${getStatusColor(result.status)}`}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-3">
                    {getStatusIcon(result.status)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{testName}</h3>
                    <p className="text-sm text-gray-600 mt-1">{result.message}</p>
                    {result.responseTime && (
                      <p className="text-xs text-gray-500 mt-1">Response time: {result.responseTime}ms</p>
                    )}
                    {result.error && (
                      <p className="text-xs text-red-600 mt-1">Error: {result.error}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Current Hook States (for debugging) */}
      {selectedTest === 'single-report' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Current Hook State</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm font-medium text-gray-700">Loading</div>
              <div className="text-lg font-bold text-gray-900">{singleReportHook.loading ? 'Yes' : 'No'}</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm font-medium text-gray-700">Data Count</div>
              <div className="text-lg font-bold text-gray-900">{singleReportHook.data?.length || 0}</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm font-medium text-gray-700">Error</div>
              <div className="text-lg font-bold text-gray-900">{singleReportHook.error ? 'Yes' : 'No'}</div>
            </div>
          </div>
        </div>
      )}

      {/* API Status */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">API Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-sm font-medium text-gray-700">Base URL</div>
            <div className="text-sm text-gray-900">{process.env.REACT_APP_API_URL || 'http://localhost:3000'}</div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-sm font-medium text-gray-700">Auth Token</div>
            <div className="text-sm text-gray-900">{localStorage.getItem('token') ? 'Present' : 'Missing'}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsIntegrationTest;

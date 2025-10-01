import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Calendar, Filter, Download, FileText, BarChart3, TrendingUp, Users, DollarSign, ChevronDown } from 'lucide-react';

const StatisticalReportComplete = () => {
  const [searchParams] = useSearchParams();
  const [activeSubSection, setActiveSubSection] = useState('occupancy-stats');
  const [filters, setFilters] = useState({
    startDate: '2024-01-30',
    endDate: '2024-02-08',
    period: 'Daily',
    roomType: 'All Room Types',
    metric: 'All Metrics'
  });

  const subSections = [
    { id: 'occupancy-stats', label: 'Occupancy Statistics', icon: '📊' },
    { id: 'revenue-stats', label: 'Revenue Statistics', icon: '💰' },
    { id: 'guest-stats', label: 'Guest Statistics', icon: '👥' },
    { id: 'performance-stats', label: 'Performance Statistics', icon: '📈' },
    { id: 'comparative-stats', label: 'Comparative Statistics', icon: '📋' }
  ];

  useEffect(() => {
    const subSection = searchParams.get('subSection');
    if (subSection && subSections.find(s => s.id === subSection)) {
      setActiveSubSection(subSection);
    }
  }, [searchParams]);

  const getStatisticalData = () => {
    switch (activeSubSection) {
      case 'occupancy-stats':
        return [
          { period: '2024-01-17', totalRooms: 105, occupiedRooms: 89, occupancyRate: '84.8%', adr: '₹185.50', revpar: '₹157.35', noShows: 2 },
          { period: '2024-01-16', totalRooms: 105, occupiedRooms: 86, occupancyRate: '81.9%', adr: '₹182.25', revpar: '₹149.22', noShows: 1 },
          { period: '2024-01-15', totalRooms: 105, occupiedRooms: 92, occupancyRate: '87.6%', adr: '₹184.09', revpar: '₹161.23', noShows: 0 }
        ];
      case 'revenue-stats':
        return [
          { period: '2024-01-17', roomRevenue: '₹16,500.00', fbRevenue: '₹4,250.00', totalRevenue: '₹20,750.00', growth: '+5.2%', variance: '₹1,025.00' },
          { period: '2024-01-16', roomRevenue: '₹15,675.00', fbRevenue: '₹4,050.00', totalRevenue: '₹19,725.00', growth: '+2.8%', variance: '₹540.00' },
          { period: '2024-01-15', roomRevenue: '₹16,936.00', fbRevenue: '₹4,184.00', totalRevenue: '₹21,120.00', growth: '+7.1%', variance: '₹1,395.00' }
        ];
      case 'guest-stats':
        return [
          { period: '2024-01-17', totalGuests: 156, newGuests: 45, returningGuests: 111, avgStay: '2.3 days', satisfaction: '4.6/5', complaints: 2 },
          { period: '2024-01-16', totalGuests: 148, newGuests: 38, returningGuests: 110, avgStay: '2.1 days', satisfaction: '4.5/5', complaints: 1 },
          { period: '2024-01-15', totalGuests: 162, newGuests: 52, returningGuests: 110, avgStay: '2.4 days', satisfaction: '4.7/5', complaints: 0 }
        ];
      case 'performance-stats':
        return [
          { metric: 'Check-in Time', average: '14.5 min', target: '15 min', performance: '103%', trend: 'Improving', department: 'Front Office' },
          { metric: 'Room Service', average: '22 min', target: '20 min', performance: '91%', trend: 'Declining', department: 'F&B' },
          { metric: 'Housekeeping', average: '28 min', target: '30 min', performance: '107%', trend: 'Stable', department: 'Housekeeping' }
        ];
      case 'comparative-stats':
        return [
          { metric: 'Occupancy Rate', thisMonth: '84.2%', lastMonth: '78.5%', lastYear: '81.3%', variance: '+5.7%', trend: 'Up' },
          { metric: 'ADR', thisMonth: '₹184.25', lastMonth: '₹178.90', lastYear: '₹175.50', variance: '+5.0%', trend: 'Up' },
          { metric: 'RevPAR', thisMonth: '₹155.12', lastMonth: '₹140.45', lastYear: '₹142.68', variance: '+10.4%', trend: 'Up' }
        ];
      default:
        return [];
    }
  };

  const statisticalData = getStatisticalData();

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const handleExport = () => {
    console.log('Exporting statistical report...');
  };

  const getTrendBadge = (trend) => {
    const baseClasses = "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium";
    
    switch (trend?.toLowerCase()) {
      case 'up':
      case 'improving':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'down':
      case 'declining':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'stable':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getPerformanceBadge = (performance) => {
    const baseClasses = "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium";
    const perf = parseFloat(performance?.replace('%', '') || '0');
    
    if (perf >= 100) return `${baseClasses} bg-green-100 text-green-800`;
    if (perf >= 90) return `${baseClasses} bg-yellow-100 text-yellow-800`;
    return `${baseClasses} bg-red-100 text-red-800`;
  };

  const getTableHeaders = () => {
    switch (activeSubSection) {
      case 'occupancy-stats':
        return ['Period', 'Total Rooms', 'Occupied', 'Occupancy Rate', 'ADR', 'RevPAR', 'No Shows'];
      case 'revenue-stats':
        return ['Period', 'Room Revenue', 'F&B Revenue', 'Total Revenue', 'Growth', 'Variance'];
      case 'guest-stats':
        return ['Period', 'Total Guests', 'New Guests', 'Returning', 'Avg Stay', 'Satisfaction', 'Complaints'];
      case 'performance-stats':
        return ['Metric', 'Average', 'Target', 'Performance', 'Trend', 'Department'];
      case 'comparative-stats':
        return ['Metric', 'This Month', 'Last Month', 'Last Year', 'Variance', 'Trend'];
      default:
        return [];
    }
  };

  const renderTableRow = (item, index) => {
    switch (activeSubSection) {
      case 'occupancy-stats':
        return (
          <tr key={index} className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.period}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.totalRooms}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">{item.occupiedRooms}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">{item.occupancyRate}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.adr}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.revpar}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">{item.noShows}</td>
          </tr>
        );
      case 'revenue-stats':
        return (
          <tr key={index} className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.period}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">{item.roomRevenue}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">{item.fbRevenue}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.totalRevenue}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">{item.growth}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.variance}</td>
          </tr>
        );
      case 'guest-stats':
        return (
          <tr key={index} className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.period}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">{item.totalGuests}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">{item.newGuests}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.returningGuests}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.avgStay}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600">{item.satisfaction}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">{item.complaints}</td>
          </tr>
        );
      case 'performance-stats':
        return (
          <tr key={index} className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.metric}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.average}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.target}</td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span className={getPerformanceBadge(item.performance)}>{item.performance}</span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span className={getTrendBadge(item.trend)}>{item.trend}</span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.department}</td>
          </tr>
        );
      case 'comparative-stats':
        return (
          <tr key={index} className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.metric}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">{item.thisMonth}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.lastMonth}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.lastYear}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">{item.variance}</td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span className={getTrendBadge(item.trend)}>{item.trend}</span>
            </td>
          </tr>
        );
      default:
        return null;
    }
  };

  const getSummaryStats = () => {
    return {
      totalRecords: statisticalData.length,
      avgOccupancy: '84.2%',
      avgRevenue: '₹20,532',
      avgSatisfaction: '4.6/5'
    };
  };

  const summaryStats = getSummaryStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center">
              <BarChart3 className="w-6 h-6 text-blue-600 mr-2" />
              <h1 className="text-2xl font-bold text-gray-900">Statistical Report</h1>
            </div>
            <div className="mt-2">
              <div className="relative inline-block">
                <select
                  value={activeSubSection}
                  onChange={(e) => setActiveSubSection(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-1 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                >
                  {subSections.map((section) => (
                    <option key={section.id} value={section.id}>
                      {section.icon} {section.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
          <div className="flex space-x-3">
            <button 
              onClick={handleExport}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
            <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              <FileText className="w-4 h-4 mr-2" />
              Generate Report
            </button>
          </div>
        </div>
      </div>



      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Start Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">End Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Period</label>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={filters.period}
                onChange={(e) => handleFilterChange('period', e.target.value)}
                className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
              >
                <option>Daily</option>
                <option>Weekly</option>
                <option>Monthly</option>
                <option>Quarterly</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Room Type</label>
            <div className="relative">
              <select
                value={filters.roomType}
                onChange={(e) => handleFilterChange('roomType', e.target.value)}
                className="w-full pl-3 pr-8 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
              >
                <option>All Room Types</option>
                <option>Standard</option>
                <option>Deluxe</option>
                <option>Suite</option>
                <option>Presidential</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Metric</label>
            <div className="relative">
              <select
                value={filters.metric}
                onChange={(e) => handleFilterChange('metric', e.target.value)}
                className="w-full pl-3 pr-8 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
              >
                <option>All Metrics</option>
                <option>Occupancy</option>
                <option>Revenue</option>
                <option>ADR</option>
                <option>RevPAR</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            Showing data from {filters.startDate} to {filters.endDate}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setFilters({
                startDate: '2024-01-30',
                endDate: '2024-02-08',
                period: 'Daily',
                roomType: 'All Room Types',
                metric: 'All Metrics'
              })}
              className="px-3 py-1 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Reset
            </button>
            <button
              onClick={() => console.log('Applying filters:', filters)}
              className="px-3 py-1 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Apply
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Records</p>
              <p className="text-2xl font-bold text-gray-900">{summaryStats.totalRecords}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Avg Occupancy</p>
              <p className="text-2xl font-bold text-gray-900">{summaryStats.avgOccupancy}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Avg Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{summaryStats.avgRevenue}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Avg Satisfaction</p>
              <p className="text-2xl font-bold text-gray-900">{summaryStats.avgSatisfaction}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              {subSections.find(s => s.id === activeSubSection)?.icon} {subSections.find(s => s.id === activeSubSection)?.label} Data
            </h3>
            <div className="text-sm text-gray-500">
              {statisticalData.length} records found
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {getTableHeaders().map((header) => (
                  <th
                    key={header}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {statisticalData.map((item, index) => renderTableRow(item, index))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StatisticalReportComplete;
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Calendar, Filter, Download, FileText, BarChart3, PieChart, LineChart, TrendingUp, Activity, Eye } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart as RechartsLineChart,
  Line,
  
} from 'recharts';

// Chart colors
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

// Mock chart data
const revenueData = [
  { month: 'Jan', revenue: 45000, expenses: 32000, profit: 13000 },
  { month: 'Feb', revenue: 52000, expenses: 35000, profit: 17000 },
  { month: 'Mar', revenue: 48000, expenses: 33000, profit: 15000 },
  { month: 'Apr', revenue: 61000, expenses: 38000, profit: 23000 },
  { month: 'May', revenue: 55000, expenses: 36000, profit: 19000 },
  { month: 'Jun', revenue: 67000, expenses: 41000, profit: 26000 }
];

const occupancyData = [
  { name: 'Standard', value: 45, color: '#0088FE' },
  { name: 'Deluxe', value: 30, color: '#00C49F' },
  { name: 'Suite', value: 20, color: '#FFBB28' },
  { name: 'Presidential', value: 5, color: '#FF8042' }
];

const performanceData = [
  { department: 'Front Office', efficiency: 92, satisfaction: 88, revenue: 85 },
  { department: 'Housekeeping', efficiency: 89, satisfaction: 91, revenue: 78 },
  { department: 'F&B', efficiency: 85, satisfaction: 87, revenue: 92 },
  { department: 'Maintenance', efficiency: 91, satisfaction: 85, revenue: 75 }
];

const trendData = [
  { week: 'Week 1', bookings: 120, cancellations: 15, revenue: 18000 },
  { week: 'Week 2', bookings: 135, cancellations: 12, revenue: 21000 },
  { week: 'Week 3', bookings: 142, cancellations: 18, revenue: 22500 },
  { week: 'Week 4', bookings: 128, cancellations: 10, revenue: 19800 }
];

const GraphsChartsReportComplete = () => {
  const [searchParams] = useSearchParams();
  const [activeSubSection, setActiveSubSection] = useState('revenue-charts');
  const [filters, setFilters] = useState({
    dateRange: 'Jan 30, 2024 - Feb 08, 2024',
    chartType: 'All Chart Types',
    dataSource: 'All Sources',
    timeframe: 'Monthly'
  });

  // Sub-sections for Graphs & Charts Reports
  const subSections = [
    { id: 'revenue-charts', label: 'Revenue Charts', icon: '📈' },
    { id: 'occupancy-graphs', label: 'Occupancy Graphs', icon: '📊' },
    { id: 'performance-dashboards', label: 'Performance Dashboards', icon: '🎯' },
    { id: 'trend-analysis', label: 'Trend Analysis', icon: '📉' },
    { id: 'comparative-reports', label: 'Comparative Reports', icon: '⚖️' }
  ];

  // Update active sub-section based on URL parameter
  useEffect(() => {
    const subSection = searchParams.get('subSection');
    if (subSection && subSections.find(s => s.id === subSection)) {
      setActiveSubSection(subSection);
    }
  }, [searchParams]);

  // Mock charts data based on active sub-section
  const getChartsData = () => {
    switch (activeSubSection) {
      case 'revenue-charts':
        return [
          { title: 'Monthly Revenue Trends', type: 'Line Chart', description: 'Revenue performance over 12 months', dataPoints: 12, lastUpdated: '2024-01-20', status: 'Active' },
          { title: 'Revenue by Department', type: 'Pie Chart', description: 'Revenue breakdown by hotel departments', dataPoints: 6, lastUpdated: '2024-01-20', status: 'Active' },
          { title: 'Daily Revenue Comparison', type: 'Bar Chart', description: 'Daily revenue vs previous period', dataPoints: 31, lastUpdated: '2024-01-19', status: 'Active' }
        ];
      case 'occupancy-graphs':
        return [
          { title: 'Occupancy Rate Trends', type: 'Area Chart', description: 'Room occupancy trends over time', dataPoints: 30, lastUpdated: '2024-01-20', status: 'Active' },
          { title: 'Room Type Occupancy', type: 'Column Chart', description: 'Occupancy by room type', dataPoints: 5, lastUpdated: '2024-01-19', status: 'Active' },
          { title: 'Seasonal Occupancy Patterns', type: 'Line Chart', description: 'Occupancy patterns throughout the year', dataPoints: 52, lastUpdated: '2024-01-18', status: 'Active' }
        ];
      case 'performance-dashboards':
        return [
          { title: 'KPI Dashboard', type: 'Dashboard', description: 'Key performance indicators overview', dataPoints: 15, lastUpdated: '2024-01-20', status: 'Active' },
          { title: 'Staff Performance Metrics', type: 'Radar Chart', description: 'Employee performance across multiple dimensions', dataPoints: 10, lastUpdated: '2024-01-19', status: 'Active' },
          { title: 'Guest Satisfaction Dashboard', type: 'Dashboard', description: 'Customer satisfaction metrics and trends', dataPoints: 8, lastUpdated: '2024-01-18', status: 'Active' }
        ];
      case 'trend-analysis':
        return [
          { title: 'Booking Trend Analysis', type: 'Line Chart', description: 'Booking patterns and forecasting', dataPoints: 24, lastUpdated: '2024-01-20', status: 'Active' },
          { title: 'Cost Trend Analysis', type: 'Area Chart', description: 'Operational cost trends over time', dataPoints: 18, lastUpdated: '2024-01-19', status: 'Active' },
          { title: 'Market Trend Comparison', type: 'Line Chart', description: 'Hotel performance vs market trends', dataPoints: 12, lastUpdated: '2024-01-18', status: 'Active' }
        ];
      case 'comparative-reports':
        return [
          { title: 'Year-over-Year Comparison', type: 'Column Chart', description: 'Performance comparison with previous year', dataPoints: 12, lastUpdated: '2024-01-20', status: 'Active' },
          { title: 'Competitor Analysis', type: 'Bar Chart', description: 'Performance vs competitor hotels', dataPoints: 8, lastUpdated: '2024-01-19', status: 'Active' },
          { title: 'Department Performance Comparison', type: 'Radar Chart', description: 'Comparative analysis across departments', dataPoints: 6, lastUpdated: '2024-01-18', status: 'Active' }
        ];
      default:
        return [];
    }
  };

  const chartsData = getChartsData();

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const handleExport = () => {
    console.log('Exporting charts report...');
  };

  const getStatusBadge = (status) => {
    const baseClasses = "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium";
    
    switch (status.toLowerCase()) {
      case 'active':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'inactive':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getChartTypeIcon = (type) => {
    switch (type.toLowerCase()) {
      case 'line chart':
        return <LineChart className="w-4 h-4 text-blue-600" />;
      case 'bar chart':
      case 'column chart':
        return <BarChart3 className="w-4 h-4 text-green-600" />;
      case 'pie chart':
        return <PieChart className="w-4 h-4 text-purple-600" />;
      case 'area chart':
        return <Activity className="w-4 h-4 text-orange-600" />;
      case 'radar chart':
        return <TrendingUp className="w-4 h-4 text-red-600" />;
      case 'dashboard':
        return <Eye className="w-4 h-4 text-indigo-600" />;
      default:
        return <BarChart3 className="w-4 h-4 text-gray-600" />;
    }
  };

  // Chart components for visualization
  const renderChart = (chartType, data, title) => {
    switch (chartType) {
      case 'revenue':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, '']} />
              <Legend />
              <Bar dataKey="revenue" fill="#0088FE" name="Revenue" />
              <Bar dataKey="expenses" fill="#FF8042" name="Expenses" />
              <Bar dataKey="profit" fill="#00C49F" name="Profit" />
            </BarChart>
          </ResponsiveContainer>
        );
      case 'occupancy':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <Pie
                data={occupancyData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {occupancyData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </RechartsPieChart>
          </ResponsiveContainer>
        );
      case 'performance':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="department" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="efficiency" fill="#8884D8" name="Efficiency %" />
              <Bar dataKey="satisfaction" fill="#82CA9D" name="Satisfaction %" />
              <Bar dataKey="revenue" fill="#FFC658" name="Revenue Score" />
            </BarChart>
          </ResponsiveContainer>
        );
      case 'trends':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <RechartsLineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="bookings" stroke="#8884D8" name="Bookings" />
              <Line type="monotone" dataKey="cancellations" stroke="#FF8042" name="Cancellations" />
            </RechartsLineChart>
          </ResponsiveContainer>
        );
      default:
        return (
          <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl text-gray-400 mb-2">📊</div>
              <p className="text-sm text-gray-500">Chart visualization</p>
            </div>
          </div>
        );
    }
  };

  const chartConfigs = [
    { title: 'Revenue Performance', type: 'revenue', icon: '📈' },
    { title: 'Room Type Distribution', type: 'occupancy', icon: '🥧' },
    { title: 'Department Performance', type: 'performance', icon: '📊' },
    { title: 'Booking Trends', type: 'trends', icon: '📉' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center">
              <BarChart3 className="w-6 h-6 text-blue-600 mr-2" />
              <h1 className="text-2xl font-bold text-gray-900">Graphs & Charts Report</h1>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Current Sub-section: <span className="font-medium text-gray-700">
                {subSections.find(s => s.id === activeSubSection)?.label}
              </span>
            </p>
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

      {/* Interactive Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {chartConfigs.map((chart, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">{chart.title}</h3>
              <span className="text-2xl">{chart.icon}</span>
            </div>
            <div className="h-80">
              {renderChart(chart.type, null, chart.title)}
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={filters.dateRange}
              onChange={(e) => handleFilterChange('dateRange', e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Date Range"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filters.chartType}
              onChange={(e) => handleFilterChange('chartType', e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option>All Chart Types</option>
              <option>Line Chart</option>
              <option>Bar Chart</option>
              <option>Pie Chart</option>
              <option>Area Chart</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <select
              value={filters.timeframe}
              onChange={(e) => handleFilterChange('timeframe', e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option>Monthly</option>
              <option>Weekly</option>
              <option>Daily</option>
              <option>Yearly</option>
            </select>
          </div>
        </div>
      </div>

     
     

     
    
    </div>
  );
};

export default GraphsChartsReportComplete;

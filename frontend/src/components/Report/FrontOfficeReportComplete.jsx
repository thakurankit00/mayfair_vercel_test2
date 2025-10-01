import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Calendar, Filter, Download, FileText, Home, LogIn, LogOut, ChevronDown, Users, TrendingUp, AlertCircle } from 'lucide-react';

const FrontOfficeReportComplete = () => {
  const [searchParams] = useSearchParams();
  const [activeSubSection, setActiveSubSection] = useState('check-in-reports');
  const [filters, setFilters] = useState({
    startDate: '2024-01-30',
    endDate: '2024-02-08',
    department: 'All Departments',
    shift: 'All Shifts',
    employee: 'All Employees'
  });

  // Sub-sections for Front Office Reports
  const subSections = [
    { id: 'check-in-reports', label: 'Check-in Reports', icon: '🏨' },
    { id: 'check-out-reports', label: 'Check-out Reports', icon: '🚪' },
    { id: 'occupancy-reports', label: 'Occupancy Reports', icon: '📊' },
    { id: 'guest-folio', label: 'Guest Folio', icon: '📋' },
    { id: 'room-status-reports', label: 'Room Status Reports', icon: '🛏️' },
    {id:'guest-list-reports', label: 'Guest List Reports', icon: '👥' },
    {id :'night-audit-report', label: 'Night Audit Report', icon: '🌙' },
    
  ];

  // Update active sub-section based on URL parameter
  useEffect(() => {
    const subSection = searchParams.get('subSection');
    if (subSection && subSections.find(s => s.id === subSection)) {
      setActiveSubSection(subSection);
    }
  }, [searchParams]);

  // Mock front office data based on active sub-section
  const getFrontOfficeData = () => {
    switch (activeSubSection) {
      case 'check-in-reports':
        return [
          { employee: 'Alice Johnson', shift: 'Morning', checkIns: 12, checkOuts: 0, roomsAssigned: 15, guestComplaints: 1, revenue: '$2,450.00', performance: 'Excellent' },
          { employee: 'Bob Wilson', shift: 'Evening', checkIns: 8, checkOuts: 0, roomsAssigned: 12, guestComplaints: 0, revenue: '$1,890.00', performance: 'Good' },
          { employee: 'Carol Martinez', shift: 'Night', checkIns: 3, checkOuts: 0, roomsAssigned: 5, guestComplaints: 0, revenue: '$650.00', performance: 'Good' }
        ];
      case 'check-out-reports':
        return [
          { employee: 'Carol Martinez', shift: 'Morning', checkIns: 0, checkOuts: 10, roomsAssigned: 0, guestComplaints: 0, revenue: '$650.00', performance: 'Excellent' },
          { employee: 'David Lee', shift: 'Evening', checkIns: 0, checkOuts: 7, roomsAssigned: 0, guestComplaints: 1, revenue: '$2,100.00', performance: 'Good' },
          { employee: 'Emma Davis', shift: 'Night', checkIns: 0, checkOuts: 2, roomsAssigned: 0, guestComplaints: 0, revenue: '$450.00', performance: 'Good' }
        ];
      case 'occupancy-reports':
        return [
          { roomType: 'Standard', totalRooms: 50, occupiedRooms: 42, occupancyRate: '84%', revenue: '$6,300.00', avgRate: '$150.00' },
          { roomType: 'Deluxe', totalRooms: 30, occupiedRooms: 28, occupancyRate: '93%', revenue: '$5,600.00', avgRate: '$200.00' },
          { roomType: 'Suite', totalRooms: 20, occupiedRooms: 15, occupancyRate: '75%', revenue: '$4,500.00', avgRate: '$300.00' },
          { roomType: 'Presidential', totalRooms: 5, occupiedRooms: 3, occupancyRate: '60%', revenue: '$1,800.00', avgRate: '$600.00' }
        ];
      case 'guest-folio':
        return [
          { guestName: 'John Smith', roomNo: '101', checkIn: '2024-01-15', checkOut: '2024-01-18', roomCharges: '$450.00', foodCharges: '$75.00',extras:'40.00', total: '$525.00', paid: '$525.00', balance: '$0.00' },
          { guestName: 'Sarah Johnson', roomNo: '205', checkIn: '2024-01-16', checkOut: '2024-01-20', roomCharges: '$680.00', foodCharges: '$120.00', total: '$800.00', paid: '$200.00', balance: '$600.00' },
          { guestName: 'Michael Brown', roomNo: '312', checkIn: '2024-01-17', checkOut: '2024-01-19', roomCharges: '$320.00', foodCharges: '$45.00', total: '$365.00', paid: '$365.00', balance: '$0.00' }
        ];
      case 'room-status-reports':
        return [
          { roomNo: '101', roomType: 'Standard', status: 'Occupied', guestName: 'John Smith', checkOut: '2024-01-18', housekeeping: 'Clean', maintenance: 'Good' },
          { roomNo: '102', roomType: 'Standard', status: 'Vacant Clean', guestName: null, checkOut: null, housekeeping: 'Clean', maintenance: 'Good' },
          { roomNo: '103', roomType: 'Standard', status: 'Vacant Dirty', guestName: null, checkOut: '2024-01-17', housekeeping: 'Dirty', maintenance: 'Good' },
          { roomNo: '104', roomType: 'Standard', status: 'Out of Order', guestName: null, checkOut: null, housekeeping: 'Clean', maintenance: 'Repair Needed' }
        ];
      case 'guest-list-reports':
        return [
          { guestName: 'John Smith', roomNo: '101', checkIn: '2024-01-15', checkOut: '2024-01-18', nationality: 'USA', phone: '+1-555-0123', email: 'john@email.com' },
          { guestName: 'Sarah Johnson', roomNo: '205', checkIn: '2024-01-16', checkOut: '2024-01-20', nationality: 'Canada', phone: '+1-555-0456', email: 'sarah@email.com' },
          { guestName: 'Michael Brown', roomNo: '312', checkIn: '2024-01-17', checkOut: '2024-01-19', nationality: 'UK', phone: '+44-555-0789', email: 'michael@email.com' }
        ];
      case 'night-audit-report':
        return [
          { date: '2024-01-17', totalRevenue: '$18,250.00', roomRevenue: '$15,400.00', fbRevenue: '$2,850.00', occupancy: '85%', adr: '$185.50', revpar: '$157.68' },
          { date: '2024-01-16', totalRevenue: '$17,890.00', roomRevenue: '$14,950.00', fbRevenue: '$2,940.00', occupancy: '82%', adr: '$182.25', revpar: '$149.45' },
          { date: '2024-01-15', totalRevenue: '$19,120.00', roomRevenue: '$16,200.00', fbRevenue: '$2,920.00', occupancy: '88%', adr: '$184.09', revpar: '$162.00' }
        ];
      default:
        return [];
    }
  };

  const frontOfficeData = getFrontOfficeData();

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const handleExport = () => {
    console.log('Exporting front office report...');
  };

  const getStatusBadge = (status) => {
    const baseClasses = "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium";
    
    switch (status.toLowerCase()) {
      case 'occupied':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'vacant clean':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'vacant dirty':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'out of order':
        return `${baseClasses} bg-gray-100 text-gray-800`;
      default:
        return `${baseClasses} bg-blue-100 text-blue-800`;
    }
  };

  const getPerformanceBadge = (performance) => {
    const baseClasses = "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium";
    
    switch (performance.toLowerCase()) {
      case 'excellent':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'good':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'average':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'poor':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getOccupancyColor = (rate) => {
    const percentage = parseInt(rate.replace('%', ''));
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 70) return 'text-blue-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Get table headers based on active sub-section
  const getTableHeaders = () => {
    switch (activeSubSection) {
      case 'check-in-reports':
      case 'check-out-reports':
        return ['Employee', 'Shift', 'Check-ins', 'Check-outs', 'Rooms Assigned', 'Complaints', 'Revenue', 'Performance'];
      case 'occupancy-reports':
        return ['Room Type', 'Total Rooms', 'Occupied Rooms', 'Occupancy Rate', 'Revenue', 'Avg Rate'];
      case 'guest-folio':
        return ['Guest Name', 'Room No', 'Check-in', 'Check-out', 'Room Charges', 'foodCharges','Extras', 'Total', 'Paid', 'Balance'];
      case 'room-status-reports':
        return ['Room No', 'Room Type', 'Status', 'Guest Name', 'Check-out', 'Housekeeping', 'Maintenance'];
      case 'guest-list-reports':
        return ['Guest Name', 'Room No', 'Check-in', 'Check-out', 'Nationality', 'Phone', 'Email'];
      case 'night-audit-report':
        return ['Date', 'Total Revenue', 'Room Revenue', 'F&B Revenue', 'Occupancy', 'ADR', 'RevPAR'];
      default:
        return [];
    }
  };

  // Render table row based on active sub-section
  const renderTableRow = (item, index) => {
    switch (activeSubSection) {
      case 'check-in-reports':
      case 'check-out-reports':
        return (
          <tr key={index} className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.employee}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.shift}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {item.checkIns > 0 && <LogIn className="w-4 h-4 inline mr-1 text-green-600" />}
              {item.checkIns}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {item.checkOuts > 0 && <LogOut className="w-4 h-4 inline mr-1 text-blue-600" />}
              {item.checkOuts}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.roomsAssigned}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.guestComplaints}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.revenue}</td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span className={getPerformanceBadge(item.performance)}>{item.performance}</span>
            </td>
          </tr>
        );
      case 'occupancy-reports':
        return (
          <tr key={index} className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.roomType}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.totalRooms}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.occupiedRooms}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
              <span className={getOccupancyColor(item.occupancyRate)}>{item.occupancyRate}</span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.revenue}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.avgRate}</td>
          </tr>
        );
      case 'guest-folio':
        return (
          <tr key={index} className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.guestName}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.roomNo}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.checkIn}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.checkOut}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.roomCharges}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.foodCharges}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.extras}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.total}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">{item.paid}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">{item.balance}</td>
          </tr>
        );
      case 'room-status-reports':
        return (
          <tr key={index} className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.roomNo}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.roomType}</td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span className={getStatusBadge(item.status)}>{item.status}</span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.guestName || '-'}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.checkOut || '-'}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.housekeeping}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.maintenance}</td>
          </tr>
        );
      case 'guest-list-reports':
        return (
          <tr key={index} className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.guestName}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.roomNo}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.checkIn}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.checkOut}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.nationality}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.phone}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">{item.email}</td>
          </tr>
        );
      case 'night-audit-report':
        return (
          <tr key={index} className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.date}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">{item.totalRevenue}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.roomRevenue}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.fbRevenue}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
              <span className={getOccupancyColor(item.occupancy)}>{item.occupancy}</span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.adr}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.revpar}</td>
          </tr>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
{/* Header */}
<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
    
    {/* Left: Title + Dropdown for Sub-section */}
    <div>
      <div className="flex items-center">
        <Home className="w-6 h-6 text-blue-600 mr-2" />
        <h1 className="text-2xl font-bold text-gray-900">Front Office Report</h1>
      </div>

      {/* Replace "Current Sub-section" text with dropdown */}
      <div className="mt-2 flex items-center space-x-2">
        <span className="text-sm text-gray-500">Current Sub-section:</span>
        <div className="relative">
          <select
            value={activeSubSection}
            onChange={(e) => setActiveSubSection(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 pr-8 text-sm 
                       focus:outline-none focus:ring-2 focus:ring-blue-500 
                       focus:border-blue-500 appearance-none bg-white"
          >
            {subSections.map((section) => (
              <option key={section.id} value={section.id}>
                {section.icon} {section.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 
                                   w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>
    </div>

    {/* Right: Action Buttons */}
    <div className="flex space-x-3">
      <button
        onClick={handleExport}
        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md 
                   shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 
                   focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <Download className="w-4 h-4 mr-2" />
        Export
      </button>
      <button
        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md 
                   shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 
                   focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Date Range Picker */}
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

          {/* Shift Filter */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Shift</label>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={filters.shift}
                onChange={(e) => handleFilterChange('shift', e.target.value)}
                className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
              >
                <option>All Shifts</option>
                <option>Morning</option>
                <option>Evening</option>
                <option>Night</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Employee Filter */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Employee</label>
            <div className="relative">
              <select
                value={filters.employee}
                onChange={(e) => handleFilterChange('employee', e.target.value)}
                className="w-full pl-3 pr-8 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
              >
                <option>All Employees</option>
                <option>Alice Johnson</option>
                <option>Bob Wilson</option>
                <option>Carol Martinez</option>
                <option>Amit Lee</option>
                <option>Emma Davis</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
        
        {/* Filter Actions */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            Showing data from {filters.startDate} to {filters.endDate}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setFilters({
                startDate: '2024-01-30',
                endDate: '2024-02-08',
                department: 'All Departments',
                shift: 'All Shifts',
                employee: 'All Employees'
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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Check-ins</p>
              <p className="text-2xl font-bold text-gray-900">23</p>
              <p className="text-xs text-green-600 mt-1">+12% from yesterday</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <LogIn className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Check-outs</p>
              <p className="text-2xl font-bold text-gray-900">19</p>
              <p className="text-xs text-blue-600 mt-1">+5% from yesterday</p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <LogOut className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Occupancy Rate</p>
              <p className="text-2xl font-bold text-gray-900">84.8%</p>
              <p className="text-xs text-green-600 mt-1">+2.3% from yesterday</p>
            </div>
            <div className="p-2 bg-purple-100 rounded-lg">
              <Home className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Guest Complaints</p>
              <p className="text-2xl font-bold text-gray-900">3</p>
              <p className="text-xs text-red-600 mt-1">+1 from yesterday</p>
            </div>
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Average Check-in Time</h3>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Current</span>
              <span className="text-sm font-medium text-gray-900">14.5 min</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Target</span>
              <span className="text-sm font-medium text-gray-900">15 min</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-600 h-2 rounded-full" style={{width: '97%'}}></div>
            </div>
            <p className="text-xs text-green-600">3% better than target</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Room Revenue</h3>
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Today</span>
              <span className="text-sm font-medium text-gray-900">$18,250</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Target</span>
              <span className="text-sm font-medium text-gray-900">$16,000</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-600 h-2 rounded-full" style={{width: '114%'}}></div>
            </div>
            <p className="text-xs text-green-600">14% above target</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Guest Satisfaction</h3>
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Users className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Rating</span>
              <span className="text-sm font-medium text-gray-900">4.6/5</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Reviews</span>
              <span className="text-sm font-medium text-gray-900">156</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-yellow-500 h-2 rounded-full" style={{width: '92%'}}></div>
            </div>
            <p className="text-xs text-yellow-600">Excellent rating</p>
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
              {frontOfficeData.length} records found
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
              {frontOfficeData.map((item, index) => renderTableRow(item, index))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FrontOfficeReportComplete;

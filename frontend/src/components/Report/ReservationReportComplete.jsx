import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Calendar, Filter, Download, FileText, Users, TrendingUp, AlertCircle, CheckCircle, XCircle, ChevronDown } from 'lucide-react';

const ReservationReportComplete = () => {
  const [searchParams] = useSearchParams();
  const [activeSubSection, setActiveSubSection] = useState('new-reservations');
  const [filters, setFilters] = useState({
    startDate: '2024-01-30',
    endDate: '2024-02-08',
    roomType: 'All Room Types',
    company: 'All Companies',
    status: 'All Status'
  });

  // Sub-sections for Reservation Reports
  const subSections = [
    { id: 'new-reservations', label: 'New Reservations', icon: '📝' },
    { id: 'cancelled-reservations', label: 'Cancelled Reservations', icon: '❌' },
    { id: 'modified-reservations', label: 'Modified Reservations', icon: '✏️' },
    { id: 'no-show-reports', label: 'No Show Reports', icon: '👻' },
    { id: 'confirmed-reservations', label: 'Confirmed Reservations', icon: '✅' }
  ];

  // Update active sub-section based on URL parameter
  useEffect(() => {
    const subSection = searchParams.get('subSection');
    if (subSection && subSections.find(s => s.id === subSection)) {
      setActiveSubSection(subSection);
    }
  }, [searchParams]);

  // Mock reservation data based on active sub-section
  const getReservationData = () => {
    switch (activeSubSection) {
      case 'new-reservations':
        return [
          { guestName: 'John Smith', roomNo: '101', arrival: '2024-01-15', departure: '2024-01-18', charges: '₹450.00', paid: '₹0.00', balance: '₹450.00', status: 'New', roomType: 'Standard', company: 'Individual' },
          { guestName: 'Sarah Johnson', roomNo: '205', arrival: '2024-01-16', departure: '2024-01-20', charges: '₹680.00', paid: '₹0.00', balance: '₹680.00', status: 'New', roomType: 'Deluxe', company: 'Corporate' },
          { guestName: 'Michael Brown', roomNo: '312', arrival: '2024-01-17', departure: '2024-01-19', charges: '₹320.00', paid: '₹0.00', balance: '₹320.00', status: 'New', roomType: 'Standard', company: 'Individual' }
        ];
      case 'cancelled-reservations':
        return [
          { guestName: 'Emily Davis', roomNo: '108', arrival: '2024-01-18', departure: '2024-01-22', charges: '₹560.00', paid: '₹0.00', balance: '₹560.00', status: 'Cancelled', roomType: 'Deluxe', company: 'Individual', cancelDate: '2024-01-17', reason: 'Guest Request' },
          { guestName: 'Robert Wilson', roomNo: '203', arrival: '2024-01-19', departure: '2024-01-21', charges: '₹340.00', paid: '₹100.00', balance: '₹240.00', status: 'Cancelled', roomType: 'Standard', company: 'Corporate', cancelDate: '2024-01-18', reason: 'Business Change' }
        ];
      case 'modified-reservations':
        return [
          { guestName: 'Amit Lee', roomNo: '301', arrival: '2024-01-21', departure: '2024-01-24', charges: '₹420.00', paid: '₹200.00', balance: '₹220.00', status: 'Modified', roomType: 'Suite', company: 'Individual', modifiedDate: '2024-01-20', changes: 'Extended Stay' },
          { guestName: 'Maria Rodriguez', roomNo: '107', arrival: '2024-01-22', departure: '2024-01-25', charges: '₹390.00', paid: '₹150.00', balance: '₹240.00', status: 'Modified', roomType: 'Standard', company: 'Corporate', modifiedDate: '2024-01-21', changes: 'Room Upgrade' }
        ];
      case 'no-show-reports':
        return [
          { guestName: 'Anna Thompson', roomNo: '104', arrival: '2024-01-24', departure: '2024-01-27', charges: '₹360.00', paid: '₹0.00', balance: '₹360.00', status: 'No-Show', roomType: 'Standard', company: 'Individual', noShowDate: '2024-01-24', contacted: 'Yes' },
          { guestName: 'Kevin Martinez', roomNo: '212', arrival: '2024-01-25', departure: '2024-01-28', charges: '₹440.00', paid: '₹0.00', balance: '₹440.00', status: 'No-Show', roomType: 'Deluxe', company: 'Corporate', noShowDate: '2024-01-25', contacted: 'No' }
        ];
      case 'confirmed-reservations':
        return [
          { guestName: 'Christopher Davis', roomNo: '302', arrival: '2024-01-27', departure: '2024-01-30', charges: '₹450.00', paid: '₹450.00', balance: '₹0.00', status: 'Confirmed', roomType: 'Suite', company: 'Individual', confirmDate: '2024-01-26', paymentMethod: 'Credit Card' },
          { guestName: 'Amanda Wilson', roomNo: '206', arrival: '2024-01-28', departure: '2024-01-31', charges: '₹520.00', paid: '₹520.00', balance: '₹0.00', status: 'Confirmed', roomType: 'Deluxe', company: 'Corporate', confirmDate: '2024-01-27', paymentMethod: 'Bank Transfer' }
        ];
      default:
        return [];
    }
  };

  const reservationData = getReservationData();

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const handleExport = () => {
    console.log('Exporting reservation report...');
  };

  const getStatusBadge = (status) => {
    const baseClasses = "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium";
    
    switch (status.toLowerCase()) {
      case 'new':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'confirmed':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'cancelled':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'modified':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'no-show':
        return `${baseClasses} bg-orange-100 text-orange-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return <CheckCircle className="w-3 h-3 mr-1" />;
      case 'cancelled':
        return <XCircle className="w-3 h-3 mr-1" />;
      case 'no-show':
        return <AlertCircle className="w-3 h-3 mr-1" />;
      default:
        return null;
    }
  };

  // Get table headers based on active sub-section
  const getTableHeaders = () => {
    const baseHeaders = ['Guest Name', 'Room No', 'Arrival', 'Departure', 'Charges', 'Paid', 'Balance', 'Status'];
    
    switch (activeSubSection) {
      case 'cancelled-reservations':
        return [...baseHeaders, 'Cancel Date', 'Reason'];
      case 'modified-reservations':
        return [...baseHeaders, 'Modified Date', 'Changes'];
      case 'no-show-reports':
        return [...baseHeaders, 'No-Show Date', 'Contacted'];
      case 'confirmed-reservations':
        return [...baseHeaders, 'Confirm Date', 'Payment Method'];
      default:
        return baseHeaders;
    }
  };

  // Render table row based on active sub-section
  const renderTableRow = (item, index) => {
    const baseRow = (
      <>
        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.guestName}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.roomNo}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.arrival}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.departure}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.charges}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.paid}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.balance}</td>
        <td className="px-6 py-4 whitespace-nowrap">
          <span className={getStatusBadge(item.status)}>
            {getStatusIcon(item.status)}
            {item.status}
          </span>
        </td>
      </>
    );

    const additionalCells = () => {
      switch (activeSubSection) {
        case 'cancelled-reservations':
          return (
            <>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.cancelDate}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.reason}</td>
            </>
          );
        case 'modified-reservations':
          return (
            <>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.modifiedDate}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.changes}</td>
            </>
          );
        case 'no-show-reports':
          return (
            <>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.noShowDate}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={item.contacted === 'Yes' ? 'text-green-600' : 'text-red-600'}>
                  {item.contacted}
                </span>
              </td>
            </>
          );
        case 'confirmed-reservations':
          return (
            <>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.confirmDate}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.paymentMethod}</td>
            </>
          );
        default:
          return null;
      }
    };

    return (
      <tr key={index} className="hover:bg-gray-50">
        {baseRow}
        {additionalCells()}
      </tr>
    );
  };

  // Calculate summary statistics
  const getSummaryStats = () => {
    const totalCharges = reservationData.reduce((sum, item) => sum + parseFloat(item.charges.replace(/[₹,]/g, '')), 0);
    const totalPaid = reservationData.reduce((sum, item) => sum + parseFloat(item.paid.replace(/[₹,]/g, '')), 0);
    const totalBalance = reservationData.reduce((sum, item) => sum + parseFloat(item.balance.replace(/[₹,]/g, '')), 0);

    return {
      totalReservations: reservationData.length,
      totalCharges: `₹${totalCharges.toLocaleString()}`,
      totalPaid: `₹${totalPaid.toLocaleString()}`,
      totalBalance: `₹${totalBalance.toLocaleString()}`
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
              <Users className="w-6 h-6 text-blue-600 mr-2" />
              <h1 className="text-2xl font-bold text-gray-900">Reservation Report</h1>
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

          {/* Room Type Filter */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Room Type</label>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={filters.roomType}
                onChange={(e) => handleFilterChange('roomType', e.target.value)}
                className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
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

          {/* Company Filter */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Company</label>
            <div className="relative">
              <select
                value={filters.company}
                onChange={(e) => handleFilterChange('company', e.target.value)}
                className="w-full pl-3 pr-8 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
              >
                <option>All Companies</option>
                <option>Individual</option>
                <option>Corporate</option>
                <option>Travel Agency</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <div className="relative">
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full pl-3 pr-8 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
              >
                <option>All Status</option>
                <option>New</option>
                <option>Confirmed</option>
                <option>Cancelled</option>
                <option>Modified</option>
                <option>No-Show</option>
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
                roomType: 'All Room Types',
                company: 'All Companies',
                status: 'All Status'
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
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Reservations</p>
              <p className="text-2xl font-bold text-gray-900">{summaryStats.totalReservations}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Charges</p>
              <p className="text-2xl font-bold text-gray-900">{summaryStats.totalCharges}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Paid</p>
              <p className="text-2xl font-bold text-gray-900">{summaryStats.totalPaid}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Balance</p>
              <p className="text-2xl font-bold text-gray-900">{summaryStats.totalBalance}</p>
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
              {reservationData.length} records found
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
              {reservationData.map((item, index) => renderTableRow(item, index))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReservationReportComplete;
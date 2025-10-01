import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Calendar, Filter, Download, FileText, Building2, TrendingUp, Users, AlertCircle, ChevronDown } from 'lucide-react';

const BackOfficeReportComplete = () => {
  const [searchParams] = useSearchParams();
  const [activeSubSection, setActiveSubSection] = useState('accounting-reports');
  const [filters, setFilters] = useState({
    startDate: '2024-01-30',
    endDate: '2024-02-08',
    department: 'All Departments',
    category: 'All Categories',
    status: 'All Status'
  });

  const subSections = [
    { id: 'accounting-reports', label: 'Accounting Reports', icon: '💼' },
    { id: 'payroll-reports', label: 'Payroll Reports', icon: '💰' },
    { id: 'inventory-reports', label: 'Inventory Reports', icon: '📦' },
    { id: 'vendor-reports', label: 'Vendor Reports', icon: '🏢' },
    { id: 'expense-reports', label: 'Expense Reports', icon: '📊' }
  ];

  useEffect(() => {
    const subSection = searchParams.get('subSection');
    if (subSection && subSections.find(s => s.id === subSection)) {
      setActiveSubSection(subSection);
    }
  }, [searchParams]);

  const getBackOfficeData = () => {
    switch (activeSubSection) {
      case 'accounting-reports':
        return [
          { account: 'Room Revenue', category: 'Revenue', amount: '₹450,000.00', budget: '₹420,000.00', variance: '+7.1%', status: 'On Track' },
          { account: 'F&B Revenue', category: 'Revenue', amount: '₹125,000.00', budget: '₹130,000.00', variance: '-3.8%', status: 'Below Target' },
          { account: 'Operating Expenses', category: 'Expense', amount: '₹280,000.00', budget: '₹290,000.00', variance: '-3.4%', status: 'Under Budget' }
        ];
      case 'payroll-reports':
        return [
          { employee: 'John Smith', department: 'Front Office', position: 'Manager', salary: '₹45,000.00', overtime: '₹5,200.00', total: '₹50,200.00', status: 'Processed' },
          { employee: 'Sarah Johnson', department: 'Housekeeping', position: 'Supervisor', salary: '₹35,000.00', overtime: '₹3,800.00', total: '₹38,800.00', status: 'Processed' },
          { employee: 'Mike Wilson', department: 'F&B', position: 'Chef', salary: '₹40,000.00', overtime: '₹4,500.00', total: '₹44,500.00', status: 'Pending' }
        ];
      case 'inventory-reports':
        return [
          { item: 'Bed Linens', category: 'Housekeeping', currentStock: 250, minStock: 200, maxStock: 400, value: '₹125,000.00', status: 'In Stock' },
          { item: 'Toiletries', category: 'Housekeeping', currentStock: 180, minStock: 200, maxStock: 350, value: '₹45,000.00', status: 'Low Stock' },
          { item: 'Food Items', category: 'F&B', currentStock: 95, minStock: 100, maxStock: 200, value: '₹85,000.00', status: 'Critical' }
        ];
      case 'vendor-reports':
        return [
          { vendor: 'ABC Supplies Ltd', category: 'Housekeeping', totalOrders: 15, totalAmount: '₹125,000.00', lastOrder: '2024-01-15', paymentStatus: 'Paid', rating: '4.5/5' },
          { vendor: 'XYZ Food Corp', category: 'F&B', totalOrders: 22, totalAmount: '₹185,000.00', lastOrder: '2024-01-17', paymentStatus: 'Pending', rating: '4.2/5' },
          { vendor: 'Tech Solutions Inc', category: 'IT', totalOrders: 8, totalAmount: '₹95,000.00', lastOrder: '2024-01-12', paymentStatus: 'Paid', rating: '4.8/5' }
        ];
      case 'expense-reports':
        return [
          { category: 'Utilities', subcategory: 'Electricity', amount: '₹45,000.00', budget: '₹42,000.00', variance: '+7.1%', month: 'January 2024', status: 'Over Budget' },
          { category: 'Maintenance', subcategory: 'Room Repairs', amount: '₹28,000.00', budget: '₹30,000.00', variance: '-6.7%', month: 'January 2024', status: 'Under Budget' },
          { category: 'Marketing', subcategory: 'Digital Ads', amount: '₹15,000.00', budget: '₹18,000.00', variance: '-16.7%', month: 'January 2024', status: 'Under Budget' }
        ];
      default:
        return [];
    }
  };

  const backOfficeData = getBackOfficeData();

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const handleExport = () => {
    console.log('Exporting back office report...');
  };

  const getStatusBadge = (status) => {
    const baseClasses = "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium";
    
    switch (status?.toLowerCase()) {
      case 'on track':
      case 'in stock':
      case 'processed':
      case 'paid':
      case 'under budget':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'below target':
      case 'low stock':
      case 'pending':
      case 'over budget':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'critical':
      case 'overdue':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getVarianceColor = (variance) => {
    if (!variance) return 'text-gray-900';
    const isPositive = variance.startsWith('+');
    return isPositive ? 'text-green-600' : 'text-red-600';
  };

  const getTableHeaders = () => {
    switch (activeSubSection) {
      case 'accounting-reports':
        return ['Account', 'Category', 'Amount', 'Budget', 'Variance', 'Status'];
      case 'payroll-reports':
        return ['Employee', 'Department', 'Position', 'Salary', 'Overtime', 'Total', 'Status'];
      case 'inventory-reports':
        return ['Item', 'Category', 'Current Stock', 'Min Stock', 'Max Stock', 'Value', 'Status'];
      case 'vendor-reports':
        return ['Vendor', 'Category', 'Total Orders', 'Total Amount', 'Last Order', 'Payment Status', 'Rating'];
      case 'expense-reports':
        return ['Category', 'Subcategory', 'Amount', 'Budget', 'Variance', 'Month', 'Status'];
      default:
        return [];
    }
  };

  const renderTableRow = (item, index) => {
    switch (activeSubSection) {
      case 'accounting-reports':
        return (
          <tr key={index} className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.account}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.category}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.amount}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.budget}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm">
              <span className={getVarianceColor(item.variance)}>{item.variance}</span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span className={getStatusBadge(item.status)}>{item.status}</span>
            </td>
          </tr>
        );
      case 'payroll-reports':
        return (
          <tr key={index} className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.employee}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.department}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.position}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.salary}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">{item.overtime}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.total}</td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span className={getStatusBadge(item.status)}>{item.status}</span>
            </td>
          </tr>
        );
      case 'inventory-reports':
        return (
          <tr key={index} className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.item}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.category}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">{item.currentStock}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.minStock}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.maxStock}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.value}</td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span className={getStatusBadge(item.status)}>{item.status}</span>
            </td>
          </tr>
        );
      case 'vendor-reports':
        return (
          <tr key={index} className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.vendor}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.category}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">{item.totalOrders}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.totalAmount}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.lastOrder}</td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span className={getStatusBadge(item.paymentStatus)}>{item.paymentStatus}</span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600">{item.rating}</td>
          </tr>
        );
      case 'expense-reports':
        return (
          <tr key={index} className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.category}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.subcategory}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.amount}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.budget}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm">
              <span className={getVarianceColor(item.variance)}>{item.variance}</span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.month}</td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span className={getStatusBadge(item.status)}>{item.status}</span>
            </td>
          </tr>
        );
      default:
        return null;
    }
  };

  const getSummaryStats = () => {
    return {
      totalRecords: backOfficeData.length,
      totalAmount: '₹755,000',
      pendingItems: backOfficeData.filter(item => item.status?.toLowerCase().includes('pending')).length,
      criticalItems: backOfficeData.filter(item => item.status?.toLowerCase().includes('critical')).length
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
              <Building2 className="w-6 h-6 text-blue-600 mr-2" />
              <h1 className="text-2xl font-bold text-gray-900">Back Office Report</h1>
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
            <label className="block text-sm font-medium text-gray-700">Department</label>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={filters.department}
                onChange={(e) => handleFilterChange('department', e.target.value)}
                className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
              >
                <option>All Departments</option>
                <option>Accounting</option>
                <option>HR</option>
                <option>Procurement</option>
                <option>IT</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <div className="relative">
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full pl-3 pr-8 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
              >
                <option>All Categories</option>
                <option>Revenue</option>
                <option>Expense</option>
                <option>Payroll</option>
                <option>Inventory</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <div className="relative">
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full pl-3 pr-8 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
              >
                <option>All Status</option>
                <option>Processed</option>
                <option>Pending</option>
                <option>Critical</option>
                <option>On Track</option>
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
                department: 'All Departments',
                category: 'All Categories',
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
              <Building2 className="w-6 h-6 text-blue-600" />
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
              <p className="text-sm font-medium text-gray-500">Total Amount</p>
              <p className="text-2xl font-bold text-gray-900">{summaryStats.totalAmount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Users className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Pending Items</p>
              <p className="text-2xl font-bold text-gray-900">{summaryStats.pendingItems}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Critical Items</p>
              <p className="text-2xl font-bold text-gray-900">{summaryStats.criticalItems}</p>
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
              {backOfficeData.length} records found
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
              {backOfficeData.map((item, index) => renderTableRow(item, index))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BackOfficeReportComplete;
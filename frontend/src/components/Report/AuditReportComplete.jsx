import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Calendar, Filter, Download, FileText, Shield, TrendingUp, AlertCircle, CheckCircle, XCircle, ChevronDown } from 'lucide-react';

const AuditReportComplete = () => {
  const [searchParams] = useSearchParams();
  const [activeSubSection, setActiveSubSection] = useState('daily-audit');
  const [filters, setFilters] = useState({
    startDate: '2024-01-30',
    endDate: '2024-02-08',
    auditType: 'All Types',
    department: 'All Departments',
    status: 'All Status'
  });

  const subSections = [
    { id: 'daily-audit', label: 'Daily Audit', icon: '📅' },
    { id: 'night-audit', label: 'Night Audit', icon: '🌙' },
    { id: 'financial-audit', label: 'Financial Audit', icon: '💰' },
    { id: 'compliance-audit', label: 'Compliance Audit', icon: '📋' },
    { id: 'security-audit', label: 'Security Audit', icon: '🔒' }
  ];

  useEffect(() => {
    const subSection = searchParams.get('subSection');
    if (subSection && subSections.find(s => s.id === subSection)) {
      setActiveSubSection(subSection);
    }
  }, [searchParams]);

  const getAuditData = () => {
    switch (activeSubSection) {
      case 'daily-audit':
        return [
          { date: '2024-01-17', auditor: 'John Smith', department: 'Front Office', totalTransactions: 45, discrepancies: 2, amount: '₹18,250.00', status: 'Completed' },
          { date: '2024-01-16', auditor: 'Sarah Johnson', department: 'Restaurant', totalTransactions: 32, discrepancies: 0, amount: '₹12,400.00', status: 'Completed' },
          { date: '2024-01-15', auditor: 'Mike Wilson', department: 'Bar', totalTransactions: 28, discrepancies: 1, amount: '₹8,750.00', status: 'Pending' }
        ];
      case 'night-audit':
        return [
          { date: '2024-01-17', auditor: 'Night Manager', roomRevenue: '₹15,400.00', fbRevenue: '₹2,850.00', totalRevenue: '₹18,250.00', occupancy: '85%', status: 'Completed' },
          { date: '2024-01-16', auditor: 'Night Manager', roomRevenue: '₹14,950.00', fbRevenue: '₹2,940.00', totalRevenue: '₹17,890.00', occupancy: '82%', status: 'Completed' }
        ];
      case 'financial-audit':
        return [
          { period: 'Jan 2024', auditor: 'External Auditor', revenue: '₹450,000.00', expenses: '₹320,000.00', profit: '₹130,000.00', variance: '2.5%', status: 'In Progress' },
          { period: 'Dec 2023', auditor: 'Internal Auditor', revenue: '₹420,000.00', expenses: '₹310,000.00', profit: '₹110,000.00', variance: '1.8%', status: 'Completed' }
        ];
      case 'compliance-audit':
        return [
          { area: 'Food Safety', auditor: 'Health Inspector', score: '95%', issues: 2, resolved: 2, lastAudit: '2024-01-15', status: 'Passed' },
          { area: 'Fire Safety', auditor: 'Fire Marshal', score: '98%', issues: 1, resolved: 1, lastAudit: '2024-01-10', status: 'Passed' }
        ];
      case 'security-audit':
        return [
          { system: 'Access Control', auditor: 'Security Team', vulnerabilities: 0, lastCheck: '2024-01-17', nextCheck: '2024-02-17', status: 'Secure' },
          { system: 'CCTV System', auditor: 'Security Team', vulnerabilities: 1, lastCheck: '2024-01-15', nextCheck: '2024-02-15', status: 'Minor Issues' }
        ];
      default:
        return [];
    }
  };

  const auditData = getAuditData();

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const handleExport = () => {
    console.log('Exporting audit report...');
  };

  const getStatusBadge = (status) => {
    const baseClasses = "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium";
    
    switch (status.toLowerCase()) {
      case 'completed':
      case 'passed':
      case 'secure':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'pending':
      case 'in progress':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'failed':
      case 'critical':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'minor issues':
        return `${baseClasses} bg-orange-100 text-orange-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getTableHeaders = () => {
    switch (activeSubSection) {
      case 'daily-audit':
        return ['Date', 'Auditor', 'Department', 'Transactions', 'Discrepancies', 'Amount', 'Status'];
      case 'night-audit':
        return ['Date', 'Auditor', 'Room Revenue', 'F&B Revenue', 'Total Revenue', 'Occupancy', 'Status'];
      case 'financial-audit':
        return ['Period', 'Auditor', 'Revenue', 'Expenses', 'Profit', 'Variance', 'Status'];
      case 'compliance-audit':
        return ['Area', 'Auditor', 'Score', 'Issues', 'Resolved', 'Last Audit', 'Status'];
      case 'security-audit':
        return ['System', 'Auditor', 'Vulnerabilities', 'Last Check', 'Next Check', 'Status'];
      default:
        return [];
    }
  };

  const renderTableRow = (item, index) => {
    switch (activeSubSection) {
      case 'daily-audit':
        return (
          <tr key={index} className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.date}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.auditor}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.department}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.totalTransactions}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">{item.discrepancies}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.amount}</td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span className={getStatusBadge(item.status)}>{item.status}</span>
            </td>
          </tr>
        );
      case 'night-audit':
        return (
          <tr key={index} className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.date}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.auditor}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.roomRevenue}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.fbRevenue}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">{item.totalRevenue}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">{item.occupancy}</td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span className={getStatusBadge(item.status)}>{item.status}</span>
            </td>
          </tr>
        );
      case 'financial-audit':
        return (
          <tr key={index} className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.period}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.auditor}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">{item.revenue}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">{item.expenses}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{item.profit}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.variance}</td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span className={getStatusBadge(item.status)}>{item.status}</span>
            </td>
          </tr>
        );
      case 'compliance-audit':
        return (
          <tr key={index} className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.area}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.auditor}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">{item.score}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">{item.issues}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">{item.resolved}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.lastAudit}</td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span className={getStatusBadge(item.status)}>{item.status}</span>
            </td>
          </tr>
        );
      case 'security-audit':
        return (
          <tr key={index} className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.system}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.auditor}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">{item.vulnerabilities}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.lastCheck}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.nextCheck}</td>
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
      totalAudits: auditData.length,
      completedAudits: auditData.filter(item => item.status?.toLowerCase() === 'completed').length,
      pendingAudits: auditData.filter(item => item.status?.toLowerCase() === 'pending').length,
      issuesFound: auditData.reduce((sum, item) => sum + (item.discrepancies || item.issues || item.vulnerabilities || 0), 0)
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
              <Shield className="w-6 h-6 text-blue-600 mr-2" />
              <h1 className="text-2xl font-bold text-gray-900">Audit Report</h1>
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
            <label className="block text-sm font-medium text-gray-700">Audit Type</label>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={filters.auditType}
                onChange={(e) => handleFilterChange('auditType', e.target.value)}
                className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
              >
                <option>All Types</option>
                <option>Internal</option>
                <option>External</option>
                <option>Compliance</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Department</label>
            <div className="relative">
              <select
                value={filters.department}
                onChange={(e) => handleFilterChange('department', e.target.value)}
                className="w-full pl-3 pr-8 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
              >
                <option>All Departments</option>
                <option>Front Office</option>
                <option>Restaurant</option>
                <option>Bar</option>
                <option>Housekeeping</option>
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
                <option>Completed</option>
                <option>Pending</option>
                <option>In Progress</option>
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
                auditType: 'All Types',
                department: 'All Departments',
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
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Audits</p>
              <p className="text-2xl font-bold text-gray-900">{summaryStats.totalAudits}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{summaryStats.completedAudits}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-gray-900">{summaryStats.pendingAudits}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Issues Found</p>
              <p className="text-2xl font-bold text-gray-900">{summaryStats.issuesFound}</p>
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
              {auditData.length} records found
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
              {auditData.map((item, index) => renderTableRow(item, index))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AuditReportComplete;
const { validationResult } = require('express-validator');

/**
 * @desc    Get reservation reports data
 * @route   GET /api/v1/reports/reservation
 * @access  Private (Manager/Admin only)
 */
const getReservationReports = async (req, res) => {
  try {
    const { subSection = 'new-reservations', dateRange, roomType, company, status } = req.query;

    // Mock data based on sub-section
    const getReservationData = (subSection) => {
      switch (subSection) {
        case 'new-reservations':
          return [
            { guestName: 'John Smith', roomNo: '101', arrival: '2024-01-15', departure: '2024-01-18', charges: '$450.00', paid: '$0.00', balance: '$450.00', status: 'New' },
            { guestName: 'Sarah Johnson', roomNo: '205', arrival: '2024-01-16', departure: '2024-01-20', charges: '$680.00', paid: '$0.00', balance: '$680.00', status: 'New' },
            { guestName: 'Michael Brown', roomNo: '312', arrival: '2024-01-17', departure: '2024-01-19', charges: '$320.00', paid: '$0.00', balance: '$320.00', status: 'New' }
          ];
        case 'cancelled-reservations':
          return [
            { guestName: 'Emily Davis', roomNo: '108', arrival: '2024-01-18', departure: '2024-01-22', charges: '$560.00', paid: '$0.00', balance: '$560.00', status: 'Cancelled' },
            { guestName: 'Robert Wilson', roomNo: '203', arrival: '2024-01-19', departure: '2024-01-21', charges: '$340.00', paid: '$100.00', balance: '$240.00', status: 'Cancelled' }
          ];
        case 'modified-reservations':
          return [
            { guestName: 'David Lee', roomNo: '301', arrival: '2024-01-21', departure: '2024-01-24', charges: '$420.00', paid: '$200.00', balance: '$220.00', status: 'Modified' },
            { guestName: 'Maria Rodriguez', roomNo: '107', arrival: '2024-01-22', departure: '2024-01-25', charges: '$390.00', paid: '$150.00', balance: '$240.00', status: 'Modified' }
          ];
        case 'no-show-reports':
          return [
            { guestName: 'Anna Thompson', roomNo: '104', arrival: '2024-01-24', departure: '2024-01-27', charges: '$360.00', paid: '$0.00', balance: '$360.00', status: 'No-Show' },
            { guestName: 'Kevin Martinez', roomNo: '212', arrival: '2024-01-25', departure: '2024-01-28', charges: '$440.00', paid: '$0.00', balance: '$440.00', status: 'No-Show' }
          ];
        case 'confirmed-reservations':
          return [
            { guestName: 'Christopher Davis', roomNo: '302', arrival: '2024-01-27', departure: '2024-01-30', charges: '$450.00', paid: '$450.00', balance: '$0.00', status: 'Confirmed' },
            { guestName: 'Amanda Wilson', roomNo: '206', arrival: '2024-01-28', departure: '2024-01-31', charges: '$520.00', paid: '$520.00', balance: '$0.00', status: 'Confirmed' }
          ];
        default:
          return [];
      }
    };

    const data = getReservationData(subSection);

    res.status(200).json({
      success: true,
      data: {
        subSection,
        filters: { dateRange, roomType, company, status },
        reservations: data,
        totalRecords: data.length,
        summary: {
          totalCharges: data.reduce((sum, item) => sum + parseFloat(item.charges.replace(/[$,]/g, '')), 0),
          totalPaid: data.reduce((sum, item) => sum + parseFloat(item.paid.replace(/[$,]/g, '')), 0),
          totalBalance: data.reduce((sum, item) => sum + parseFloat(item.balance.replace(/[$,]/g, '')), 0)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching reservation reports:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch reservation reports'
      }
    });
  }
};

/**
 * @desc    Get front office reports data
 * @route   GET /api/v1/reports/front-office
 * @access  Private (Manager/Admin only)
 */
const getFrontOfficeReports = async (req, res) => {
  try {
    const { subSection = 'check-in-reports', dateRange, department, shift, employee } = req.query;

    // Mock data based on sub-section
    const getFrontOfficeData = (subSection) => {
      switch (subSection) {
        case 'check-in-reports':
          return [
            { employee: 'Alice Johnson', shift: 'Morning', checkIns: 12, checkOuts: 0, roomsAssigned: 15, guestComplaints: 1, revenue: '$2,450.00', performance: 'Excellent' },
            { employee: 'Bob Wilson', shift: 'Evening', checkIns: 8, checkOuts: 0, roomsAssigned: 12, guestComplaints: 0, revenue: '$1,890.00', performance: 'Good' }
          ];
        case 'check-out-reports':
          return [
            { employee: 'Carol Martinez', shift: 'Morning', checkIns: 0, checkOuts: 10, roomsAssigned: 0, guestComplaints: 0, revenue: '$650.00', performance: 'Excellent' },
            { employee: 'David Lee', shift: 'Evening', checkIns: 0, checkOuts: 7, roomsAssigned: 0, guestComplaints: 1, revenue: '$2,100.00', performance: 'Good' }
          ];
        case 'occupancy-reports':
          return [
            { roomType: 'Standard', totalRooms: 50, occupiedRooms: 42, occupancyRate: '84%', revenue: '$6,300.00', avgRate: '$150.00' },
            { roomType: 'Deluxe', totalRooms: 30, occupiedRooms: 28, occupancyRate: '93%', revenue: '$5,600.00', avgRate: '$200.00' },
            { roomType: 'Suite', totalRooms: 20, occupiedRooms: 15, occupancyRate: '75%', revenue: '$4,500.00', avgRate: '$300.00' }
          ];
        case 'guest-folio':
          return [
            { guestName: 'John Smith', roomNo: '101', checkIn: '2024-01-15', checkOut: '2024-01-18', roomCharges: '$450.00', extras: '$75.00', total: '$525.00', paid: '$525.00', balance: '$0.00' },
            { guestName: 'Sarah Johnson', roomNo: '205', checkIn: '2024-01-16', checkOut: '2024-01-20', roomCharges: '$680.00', extras: '$120.00', total: '$800.00', paid: '$200.00', balance: '$600.00' }
          ];
        case 'room-status-reports':
          return [
            { roomNo: '101', roomType: 'Standard', status: 'Occupied', guestName: 'John Smith', checkOut: '2024-01-18', housekeeping: 'Clean' },
            { roomNo: '102', roomType: 'Standard', status: 'Vacant Clean', guestName: null, checkOut: null, housekeeping: 'Clean' },
            { roomNo: '103', roomType: 'Standard', status: 'Vacant Dirty', guestName: null, checkOut: '2024-01-17', housekeeping: 'Dirty' }
          ];
        default:
          return [];
      }
    };

    const data = getFrontOfficeData(subSection);

    res.status(200).json({
      success: true,
      data: {
        subSection,
        filters: { dateRange, department, shift, employee },
        records: data,
        totalRecords: data.length,
        summary: {
          totalCheckIns: data.reduce((sum, item) => sum + (item.checkIns || 0), 0),
          totalCheckOuts: data.reduce((sum, item) => sum + (item.checkOuts || 0), 0),
          totalRevenue: data.reduce((sum, item) => {
            const revenue = item.revenue || item.total || '$0.00';
            return sum + parseFloat(revenue.replace(/[$,]/g, ''));
          }, 0)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching front office reports:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch front office reports'
      }
    });
  }
};

/**
 * @desc    Get back office reports data
 * @route   GET /api/v1/reports/back-office
 * @access  Private (Manager/Admin only)
 */
const getBackOfficeReports = async (req, res) => {
  try {
    const { subSection = 'housekeeping-reports', dateRange, category, department, status } = req.query;

    // Mock data based on sub-section
    const getBackOfficeData = (subSection) => {
      switch (subSection) {
        case 'housekeeping-reports':
          return [
            { category: 'Housekeeping', task: 'Room Cleaning', employee: 'Maria Garcia', roomsCompleted: 15, timeSpent: '6.5 hrs', quality: 'Excellent', status: 'Completed', cost: '$195.00' },
            { category: 'Housekeeping', task: 'Deep Cleaning', employee: 'Lisa Brown', roomsCompleted: 8, timeSpent: '5.5 hrs', quality: 'Excellent', status: 'Completed', cost: '$220.00' }
          ];
        case 'maintenance-reports':
          return [
            { category: 'Maintenance', task: 'AC Repair', employee: 'John Smith', roomsCompleted: 3, timeSpent: '4.2 hrs', quality: 'Good', status: 'Completed', cost: '$280.00' },
            { category: 'Maintenance', task: 'Plumbing Fix', employee: 'Mike Wilson', roomsCompleted: 2, timeSpent: '3.0 hrs', quality: 'Good', status: 'In Progress', cost: '$150.00' }
          ];
        case 'laundry-reports':
          return [
            { category: 'Laundry', task: 'Linen Processing', employee: 'Sarah Johnson', roomsCompleted: 25, timeSpent: '8.0 hrs', quality: 'Excellent', status: 'Completed', cost: '$160.00' },
            { category: 'Laundry', task: 'Towel Washing', employee: 'Anna Davis', roomsCompleted: 30, timeSpent: '6.0 hrs', quality: 'Good', status: 'Completed', cost: '$120.00' }
          ];
        case 'security-reports':
          return [
            { category: 'Security', task: 'Night Patrol', employee: 'Mike Wilson', roomsCompleted: 0, timeSpent: '12.0 hrs', quality: 'Good', status: 'In Progress', cost: '$240.00' },
            { category: 'Security', task: 'CCTV Monitoring', employee: 'David Lee', roomsCompleted: 0, timeSpent: '8.0 hrs', quality: 'Excellent', status: 'Completed', cost: '$160.00' }
          ];
        case 'inventory-reports':
          return [
            { category: 'Inventory', task: 'Stock Count', employee: 'Jennifer White', roomsCompleted: 0, timeSpent: '4.0 hrs', quality: 'Excellent', status: 'Completed', cost: '$80.00' },
            { category: 'Inventory', task: 'Supply Ordering', employee: 'Kevin Martinez', roomsCompleted: 0, timeSpent: '2.0 hrs', quality: 'Good', status: 'Completed', cost: '$40.00' }
          ];
        default:
          return [];
      }
    };

    const data = getBackOfficeData(subSection);

    res.status(200).json({
      success: true,
      data: {
        subSection,
        filters: { dateRange, category, department, status },
        records: data,
        totalRecords: data.length,
        summary: {
          totalTasks: data.length,
          completedTasks: data.filter(item => item.status.toLowerCase() === 'completed').length,
          totalCost: data.reduce((sum, item) => sum + parseFloat(item.cost.replace(/[$,]/g, '')), 0),
          totalHours: data.reduce((sum, item) => sum + parseFloat(item.timeSpent.replace(' hrs', '')), 0)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching back office reports:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch back office reports'
      }
    });
  }
};

/**
 * @desc    Get audit reports data
 * @route   GET /api/v1/reports/audit
 * @access  Private (Manager/Admin only)
 */
const getAuditReports = async (req, res) => {
  try {
    const { subSection = 'financial-audits', dateRange, auditType, department, auditor } = req.query;

    // Mock data based on sub-section
    const getAuditData = (subSection) => {
      switch (subSection) {
        case 'financial-audits':
          return [
            { auditId: 'AUD-2024-001', auditType: 'Financial', department: 'Accounting', auditor: 'Jane Smith', date: '2024-01-15', findings: 3, severity: 'Medium', status: 'Completed', compliance: '85%' },
            { auditId: 'AUD-2024-006', auditType: 'Financial', department: 'Revenue', auditor: 'Robert Johnson', date: '2024-01-20', findings: 1, severity: 'Low', status: 'Completed', compliance: '95%' }
          ];
        case 'operational-audits':
          return [
            { auditId: 'AUD-2024-002', auditType: 'Operational', department: 'Housekeeping', auditor: 'Robert Johnson', date: '2024-01-16', findings: 1, severity: 'Low', status: 'Completed', compliance: '95%' },
            { auditId: 'AUD-2024-007', auditType: 'Operational', department: 'Front Office', auditor: 'Maria Garcia', date: '2024-01-21', findings: 2, severity: 'Medium', status: 'In Progress', compliance: '88%' }
          ];
        case 'safety-audits':
          return [
            { auditId: 'AUD-2024-003', auditType: 'Safety', department: 'Maintenance', auditor: 'Maria Garcia', date: '2024-01-17', findings: 5, severity: 'High', status: 'In Progress', compliance: '70%' },
            { auditId: 'AUD-2024-008', auditType: 'Safety', department: 'Kitchen', auditor: 'David Wilson', date: '2024-01-22', findings: 3, severity: 'Medium', status: 'Completed', compliance: '82%' }
          ];
        case 'quality-audits':
          return [
            { auditId: 'AUD-2024-004', auditType: 'Quality', department: 'Front Office', auditor: 'David Wilson', date: '2024-01-18', findings: 2, severity: 'Medium', status: 'Completed', compliance: '88%' },
            { auditId: 'AUD-2024-009', auditType: 'Quality', department: 'Restaurant', auditor: 'Lisa Brown', date: '2024-01-23', findings: 1, severity: 'Low', status: 'Completed', compliance: '92%' }
          ];
        case 'compliance-audits':
          return [
            { auditId: 'AUD-2024-005', auditType: 'Compliance', department: 'HR', auditor: 'Lisa Brown', date: '2024-01-19', findings: 0, severity: 'None', status: 'Completed', compliance: '100%' },
            { auditId: 'AUD-2024-010', auditType: 'Compliance', department: 'Legal', auditor: 'Jane Smith', date: '2024-01-24', findings: 1, severity: 'Low', status: 'Completed', compliance: '96%' }
          ];
        default:
          return [];
      }
    };

    const data = getAuditData(subSection);

    res.status(200).json({
      success: true,
      data: {
        subSection,
        filters: { dateRange, auditType, department, auditor },
        audits: data,
        totalRecords: data.length,
        summary: {
          totalAudits: data.length,
          completedAudits: data.filter(item => item.status.toLowerCase() === 'completed').length,
          totalFindings: data.reduce((sum, item) => sum + item.findings, 0),
          avgCompliance: Math.round(data.reduce((sum, item) => sum + parseInt(item.compliance.replace('%', '')), 0) / data.length)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching audit reports:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch audit reports'
      }
    });
  }
};

/**
 * @desc    Get statistical reports data
 * @route   GET /api/v1/reports/statistical
 * @access  Private (Manager/Admin only)
 */
const getStatisticalReports = async (req, res) => {
  try {
    const { subSection = 'revenue-analytics', dateRange, metric, period, category } = req.query;

    // Mock data based on sub-section
    const getStatisticalData = (subSection) => {
      switch (subSection) {
        case 'revenue-analytics':
          return [
            { metric: 'Total Revenue', period: 'Jan 2024', value: '$125,450', change: '+15.2%', trend: 'up', category: 'Revenue' },
            { metric: 'Average Daily Rate', period: 'Jan 2024', value: '$145.50', change: '+8.7%', trend: 'up', category: 'Revenue' },
            { metric: 'Revenue Per Room', period: 'Jan 2024', value: '$89.30', change: '+12.1%', trend: 'up', category: 'Revenue' },
            { metric: 'F&B Revenue', period: 'Jan 2024', value: '$28,750', change: '+18.5%', trend: 'up', category: 'Revenue' }
          ];
        case 'occupancy-statistics':
          return [
            { metric: 'Occupancy Rate', period: 'Jan 2024', value: '85.2%', change: '+5.3%', trend: 'up', category: 'Occupancy' },
            { metric: 'Available Rooms', period: 'Jan 2024', value: '120', change: '0%', trend: 'stable', category: 'Occupancy' },
            { metric: 'Occupied Rooms', period: 'Jan 2024', value: '102', change: '+8.5%', trend: 'up', category: 'Occupancy' },
            { metric: 'Room Nights Sold', period: 'Jan 2024', value: '3,162', change: '+7.2%', trend: 'up', category: 'Occupancy' }
          ];
        case 'guest-satisfaction':
          return [
            { metric: 'Overall Satisfaction', period: 'Jan 2024', value: '4.6/5.0', change: '+0.2', trend: 'up', category: 'Satisfaction' },
            { metric: 'Service Rating', period: 'Jan 2024', value: '4.7/5.0', change: '+0.1', trend: 'up', category: 'Satisfaction' },
            { metric: 'Cleanliness Score', period: 'Jan 2024', value: '4.8/5.0', change: '+0.3', trend: 'up', category: 'Satisfaction' },
            { metric: 'Value for Money', period: 'Jan 2024', value: '4.4/5.0', change: '-0.1', trend: 'down', category: 'Satisfaction' }
          ];
        case 'operational-efficiency':
          return [
            { metric: 'Staff Efficiency', period: 'Jan 2024', value: '92.1%', change: '-1.5%', trend: 'down', category: 'Operations' },
            { metric: 'Check-in Time', period: 'Jan 2024', value: '3.2 min', change: '-0.8 min', trend: 'up', category: 'Operations' },
            { metric: 'Housekeeping Time', period: 'Jan 2024', value: '28 min', change: '-2 min', trend: 'up', category: 'Operations' },
            { metric: 'Response Time', period: 'Jan 2024', value: '4.5 min', change: '+0.3 min', trend: 'down', category: 'Operations' }
          ];
        case 'cost-analysis':
          return [
            { metric: 'Operating Costs', period: 'Jan 2024', value: '$45,200', change: '-3.2%', trend: 'up', category: 'Costs' },
            { metric: 'Energy Consumption', period: 'Jan 2024', value: '12,450 kWh', change: '-5.1%', trend: 'up', category: 'Costs' },
            { metric: 'Staff Costs', period: 'Jan 2024', value: '$28,900', change: '+2.1%', trend: 'down', category: 'Costs' },
            { metric: 'Maintenance Costs', period: 'Jan 2024', value: '$8,750', change: '-8.3%', trend: 'up', category: 'Costs' }
          ];
        default:
          return [];
      }
    };

    const data = getStatisticalData(subSection);

    // KPI data
    const kpiData = [
      { title: 'Revenue Growth', value: '+15.2%', description: 'vs last month', icon: '💰', color: 'bg-green-50 text-green-600' },
      { title: 'Customer Retention', value: '78.5%', description: 'repeat guests', icon: '👥', color: 'bg-blue-50 text-blue-600' },
      { title: 'Operational Efficiency', value: '91.3%', description: 'overall score', icon: '⚡', color: 'bg-yellow-50 text-yellow-600' },
      { title: 'Cost Reduction', value: '-8.7%', description: 'operational costs', icon: '📉', color: 'bg-purple-50 text-purple-600' }
    ];

    res.status(200).json({
      success: true,
      data: {
        subSection,
        filters: { dateRange, metric, period, category },
        metrics: data,
        kpis: kpiData,
        totalRecords: data.length
      }
    });
  } catch (error) {
    console.error('Error fetching statistical reports:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch statistical reports'
      }
    });
  }
};

/**
 * @desc    Get graphs and charts reports data
 * @route   GET /api/v1/reports/charts
 * @access  Private (Manager/Admin only)
 */
const getChartsReports = async (req, res) => {
  try {
    const { subSection = 'revenue-charts', dateRange, chartType, dataSource, timeframe } = req.query;

    // Mock data based on sub-section
    const getChartsData = (subSection) => {
      switch (subSection) {
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

    const data = getChartsData(subSection);

    // Chart placeholders for visualization
    const chartPlaceholders = [
      { title: 'Revenue Performance', type: 'Line Chart', height: 'h-64', icon: '📈' },
      { title: 'Room Type Distribution', type: 'Pie Chart', height: 'h-64', icon: '🥧' },
      { title: 'Monthly Bookings', type: 'Bar Chart', height: 'h-64', icon: '📊' },
      { title: 'Occupancy Trends', type: 'Area Chart', height: 'h-64', icon: '📉' }
    ];

    res.status(200).json({
      success: true,
      data: {
        subSection,
        filters: { dateRange, chartType, dataSource, timeframe },
        charts: data,
        chartPlaceholders,
        totalRecords: data.length,
        summary: {
          totalCharts: data.length,
          activeCharts: data.filter(item => item.status.toLowerCase() === 'active').length,
          totalDataPoints: data.reduce((sum, item) => sum + item.dataPoints, 0),
          lastUpdated: data.length > 0 ? data[0].lastUpdated : null
        }
      }
    });
  } catch (error) {
    console.error('Error fetching charts reports:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch charts reports'
      }
    });
  }
};

module.exports = {
  getReservationReports,
  getFrontOfficeReports,
  getBackOfficeReports,
  getAuditReports,
  getStatisticalReports,
  getChartsReports
};

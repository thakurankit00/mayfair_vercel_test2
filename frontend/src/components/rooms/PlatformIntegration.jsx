import React, { useState, useEffect } from 'react';

const PlatformIntegration = ({ roomTypes }) => {
  const [integrations, setIntegrations] = useState([]);
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [syncStatus, setSyncStatus] = useState({});

  // Mock platform data - in real app this would come from API
  const availablePlatforms = [
    {
      id: 'makemytrip',
      name: 'MakeMyTrip',
      logo: '🎯',
      color: 'red',
      status: 'connected',
      lastSync: '2025-01-06T10:30:00Z',
      syncFrequency: '2 hours',
      commission: '15%',
      features: ['Real-time inventory', 'Dynamic pricing', 'Auto-confirmation']
    },
    {
      id: 'booking',
      name: 'Booking.com',
      logo: '🌐',
      color: 'blue',
      status: 'connected',
      lastSync: '2025-01-06T09:15:00Z',
      syncFrequency: '1 hour',
      commission: '18%',
      features: ['Real-time inventory', 'Dynamic pricing', 'Guest messaging']
    },
    {
      id: 'airbnb',
      name: 'Airbnb',
      logo: '🏠',
      color: 'pink',
      status: 'disconnected',
      lastSync: null,
      syncFrequency: '4 hours',
      commission: '14%',
      features: ['Photo sync', 'Review management', 'Host messaging']
    },
    {
      id: 'yatra',
      name: 'Yatra',
      logo: '✈️',
      color: 'orange',
      status: 'error',
      lastSync: '2025-01-05T14:20:00Z',
      syncFrequency: '3 hours',
      commission: '12%',
      features: ['Inventory sync', 'Pricing updates']
    },
    {
      id: 'easemytrip',
      name: 'EaseMyTrip',
      logo: '🚀',
      color: 'green',
      status: 'connected',
      lastSync: '2025-01-06T11:00:00Z',
      syncFrequency: '2 hours',
      commission: '13%',
      features: ['Real-time inventory', 'Instant booking']
    },
    {
      id: 'trivago',
      name: 'Trivago',
      logo: '🔍',
      color: 'indigo',
      status: 'connected',
      lastSync: '2025-01-06T10:45:00Z',
      syncFrequency: '6 hours',
      commission: '10%',
      features: ['Price comparison', 'Review aggregation']
    }
  ];

  useEffect(() => {
    // Initialize with available platforms
    setIntegrations(availablePlatforms);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected': return 'text-green-600 bg-green-100';
      case 'disconnected': return 'text-gray-600 bg-gray-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'connected': return '✅';
      case 'disconnected': return '⭕';
      case 'error': return '❌';
      default: return '❓';
    }
  };

  const handleSync = async (platformId) => {
    setSyncStatus(prev => ({ ...prev, [platformId]: 'syncing' }));
    
    // Simulate sync process
    setTimeout(() => {
      setSyncStatus(prev => ({ ...prev, [platformId]: 'completed' }));
      
      // Update last sync time
      setIntegrations(prev => prev.map(platform => 
        platform.id === platformId 
          ? { ...platform, lastSync: new Date().toISOString() }
          : platform
      ));
      
      // Reset status after 2 seconds
      setTimeout(() => {
        setSyncStatus(prev => ({ ...prev, [platformId]: null }));
      }, 2000);
    }, 3000);
  };

  const handleConnect = (platformId) => {
    setIntegrations(prev => prev.map(platform => 
      platform.id === platformId 
        ? { ...platform, status: 'connected', lastSync: new Date().toISOString() }
        : platform
    ));
  };

  const handleDisconnect = (platformId) => {
    setIntegrations(prev => prev.map(platform => 
      platform.id === platformId 
        ? { ...platform, status: 'disconnected', lastSync: null }
        : platform
    ));
  };

  const formatLastSync = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  const connectedPlatforms = integrations.filter(p => p.status === 'connected');
  const totalCommission = connectedPlatforms.reduce((sum, p) => sum + parseFloat(p.commission), 0);

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="text-2xl font-bold text-blue-600">{connectedPlatforms.length}</div>
          <div className="text-sm text-gray-600">Connected Platforms</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="text-2xl font-bold text-green-600">{integrations.filter(p => p.status === 'connected').length}</div>
          <div className="text-sm text-gray-600">Active Syncing</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="text-2xl font-bold text-orange-600">{totalCommission.toFixed(1)}%</div>
          <div className="text-sm text-gray-600">Avg Commission</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="text-2xl font-bold text-purple-600">{roomTypes.length}</div>
          <div className="text-sm text-gray-600">Room Types Synced</div>
        </div>
      </div>

      {/* Sync All Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Platform Integrations</h2>
        <div className="flex space-x-3">
          <button
            onClick={() => connectedPlatforms.forEach(p => handleSync(p.id))}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Sync All Connected
          </button>
          <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-medium">
            Manage Settings
          </button>
        </div>
      </div>

      {/* Platform Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {integrations.map((platform) => (
          <div key={platform.id} className="bg-white rounded-lg shadow-md border hover:shadow-lg transition-shadow">
            <div className="p-6">
              {/* Platform Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="text-3xl">{platform.logo}</div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{platform.name}</h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(platform.status)}`}>
                        {getStatusIcon(platform.status)} {platform.status.charAt(0).toUpperCase() + platform.status.slice(1)}
                      </span>
                      <span className="text-xs text-gray-500">
                        Commission: {platform.commission}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Action Button */}
                <div className="flex items-center space-x-2">
                  {platform.status === 'connected' && (
                    <button
                      onClick={() => handleSync(platform.id)}
                      disabled={syncStatus[platform.id] === 'syncing'}
                      className={`px-3 py-1 rounded-md text-xs font-medium ${
                        syncStatus[platform.id] === 'syncing' 
                          ? 'bg-yellow-100 text-yellow-700 cursor-not-allowed'
                          : syncStatus[platform.id] === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      }`}
                    >
                      {syncStatus[platform.id] === 'syncing' && '⏳ Syncing...'}
                      {syncStatus[platform.id] === 'completed' && '✅ Synced'}
                      {!syncStatus[platform.id] && '🔄 Sync Now'}
                    </button>
                  )}
                  
                  {platform.status === 'connected' ? (
                    <button
                      onClick={() => handleDisconnect(platform.id)}
                      className="px-3 py-1 bg-red-100 text-red-700 rounded-md text-xs font-medium hover:bg-red-200"
                    >
                      Disconnect
                    </button>
                  ) : (
                    <button
                      onClick={() => handleConnect(platform.id)}
                      className="px-3 py-1 bg-green-100 text-green-700 rounded-md text-xs font-medium hover:bg-green-200"
                    >
                      Connect
                    </button>
                  )}
                </div>
              </div>

              {/* Sync Information */}
              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                  <span className="text-gray-600">Last Sync:</span>
                  <div className="font-medium text-gray-900">
                    {formatLastSync(platform.lastSync)}
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">Sync Frequency:</span>
                  <div className="font-medium text-gray-900">
                    Every {platform.syncFrequency}
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="mb-4">
                <span className="text-sm text-gray-600 mb-2 block">Features:</span>
                <div className="flex flex-wrap gap-2">
                  {platform.features.map((feature, index) => (
                    <span
                      key={index}
                      className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>

              {/* Rate Management for Connected Platforms */}
              {platform.status === 'connected' && (
                <div className="bg-gray-50 rounded-lg p-3 mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Rate Management</span>
                    <button className="text-xs text-blue-600 hover:text-blue-700">
                      View Details
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center">
                      <div className="font-medium text-gray-900">₹2,500</div>
                      <div className="text-gray-600">Base Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-green-600">+15%</div>
                      <div className="text-gray-600">Weekend</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-blue-600">Dynamic</div>
                      <div className="text-gray-600">Pricing</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Bulk Operations */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Bulk Rate Management</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Update Base Rates</h4>
            <p className="text-sm text-gray-600 mb-3">
              Apply percentage change across all connected platforms
            </p>
            <div className="flex space-x-2">
              <input
                type="number"
                placeholder="+/-10"
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
              <span className="flex items-center text-gray-500 text-sm">%</span>
              <button className="bg-blue-600 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-700">
                Apply
              </button>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Seasonal Pricing</h4>
            <p className="text-sm text-gray-600 mb-3">
              Set special rates for peak seasons
            </p>
            <button className="w-full bg-orange-100 text-orange-700 py-2 rounded-md text-sm hover:bg-orange-200">
              Configure Seasons
            </button>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Inventory Override</h4>
            <p className="text-sm text-gray-600 mb-3">
              Temporarily adjust availability
            </p>
            <button className="w-full bg-purple-100 text-purple-700 py-2 rounded-md text-sm hover:bg-purple-200">
              Manage Inventory
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlatformIntegration;

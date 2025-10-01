import React, { useState } from 'react';
import TodayReservationsWidget from '../common/TodayReservationsWidget';
import ReservationModal from '../common/ReservationModal';

const WidgetExample = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);

  const handleReservationClick = (reservation) => {
    setSelectedReservation(reservation);
    setModalOpen(true);
  };

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Today's Reservations Widget Example
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Sidebar simulation */}
          <div className="bg-gray-900 rounded-lg p-4 h-96">
            <h2 className="text-white text-lg font-semibold mb-4">Sidebar</h2>
            
            {/* Navigation items simulation */}
            <div className="space-y-2 mb-6">
              <div className="text-gray-300 text-sm py-2 px-3 rounded">Dashboard</div>
              <div className="text-gray-300 text-sm py-2 px-3 rounded">Rooms</div>
              <div className="text-gray-300 text-sm py-2 px-3 rounded">Restaurant</div>
              <div className="text-gray-300 text-sm py-2 px-3 rounded bg-gray-800">Settings</div>
            </div>

            {/* Widget */}
            <TodayReservationsWidget 
              onReservationClick={handleReservationClick}
              className="mb-4"
            />

            {/* User info simulation */}
            <div className="absolute bottom-4 left-4 right-4 bg-gray-800 rounded p-3">
              <div className="text-white text-sm">John Doe</div>
              <div className="text-gray-400 text-xs">Manager</div>
            </div>
          </div>

          {/* Main content area */}
          <div className="md:col-span-2 bg-white rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Main Content Area
            </h2>
            <p className="text-gray-600 mb-4">
              This simulates the main content area of your hotel management system.
              The "Today's Reservations" widget is positioned in the sidebar on the left.
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h3 className="text-blue-900 font-medium mb-2">Widget Features:</h3>
              <ul className="text-blue-800 text-sm space-y-1">
                <li>• Shows today's room check-ins and restaurant reservations</li>
                <li>• Dark theme to match sidebar design</li>
                <li>• Compact scrollable list (max height ~120px)</li>
                <li>• Click any reservation to open details modal</li>
                <li>• Auto-refreshes every 5 minutes</li>
                <li>• Manual refresh button available</li>
                <li>• Shows "No reservations today" when empty</li>
              </ul>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="text-green-900 font-medium mb-2">Integration:</h3>
              <p className="text-green-800 text-sm">
                The widget is automatically integrated into your sidebar and will appear 
                below the Settings menu for staff members with appropriate permissions 
                (receptionist, waiter, chef, bartender, manager, admin).
              </p>
            </div>
          </div>
        </div>

        {/* Modal */}
        <ReservationModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedReservation(null);
          }}
          selectedReservation={selectedReservation}
          title="Reservation Details"
        />
      </div>
    </div>
  );
};

export default WidgetExample;

import React, { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} closeSidebar={closeSidebar} />
      
      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden md:ml-0">
        {/* Header */}
        <Header toggleSidebar={toggleSidebar} />
        
        {/* Main content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-4">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;

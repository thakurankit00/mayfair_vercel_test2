import React, { useState, useRef, useEffect } from "react";

// Simple chair icon using emoji
const ChairIcon = ({ className, style }) => (
  <div className={className} style={style}>
    🪑
  </div>
);

// Context Menu Component
const ContextMenu = ({ x, y, table, onEdit, onDelete, onClose }) => {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="fixed bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50"
      style={{ left: x, top: y }}
    >
      <button
        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
        onClick={() => {
          onEdit(table);
          onClose();
        }}
      >
        ✏️ Edit Table
      </button>
      <button
        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 text-red-600 flex items-center gap-2"
        onClick={() => {
          onDelete(table);
          onClose();
        }}
      >
        🗑️ Delete Table
      </button>
    </div>
  );
};

const TableFloorLayout = ({ tables = [], onTableClick, userRole, onTableEdit, onTableDelete }) => {
  const [selectedTable, setSelectedTable] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const getTableColor = (status) => {
    switch (status) {
      case "available":
        return "bg-green-500 hover:bg-green-600";
      case "booked":
        return "bg-orange-500 hover:bg-orange-600";
      case "occupied":
        return "bg-red-500 hover:bg-red-600";
      default:
        return "bg-gray-400 hover:bg-gray-500";
    }
  };

  const getTableShape = (capacity) =>
    capacity <= 2 ? "rounded-full" : "rounded-lg";

  const getChairColor = (status) =>
    status === "occupied" ? "text-red-500" : "text-gray-500";

  const renderChairs = (capacity, status, tableSize) => {
    const chairs = [];
    const chairColor = getChairColor(status);

    if (capacity <= 2) {
      // Circular table
      const radius = tableSize === "w-16 h-16" ? 32 : 40;
      for (let i = 0; i < capacity; i++) {
        const angle = (i * 360) / capacity;
        const x = Math.cos((angle * Math.PI) / 180) * radius;
        const y = Math.sin((angle * Math.PI) / 180) * radius;
        chairs.push(
          <ChairIcon
            key={i}
            className={`absolute ${chairColor}`}
            style={{
              left: `calc(50% + ${x}px - 10px)`,
              top: `calc(50% + ${y}px - 10px)`,
              transform: `rotate(${angle}deg)`,
            }}
          />
        );
      }
    } else {
      // Rectangular table
      const perSide = Math.ceil(capacity / 2);
      const spacing = tableSize === "w-20 h-20" ? 16 : 20;
      for (let i = 0; i < Math.min(perSide, capacity); i++) {
        const offset = (i - (perSide - 1) / 2) * spacing;

        chairs.push(
          <ChairIcon
            key={`top-${i}`}
            className={`absolute ${chairColor}`}
            style={{
              left: `calc(50% + ${offset}px - 10px)`,
              top: "-24px",
              transform: "rotate(180deg)", // face table
            }}
          />
        );

        if (capacity > perSide && i < capacity - perSide) {
          chairs.push(
            <ChairIcon
              key={`bottom-${i}`}
              className={`absolute ${chairColor}`}
              style={{
                left: `calc(50% + ${offset}px - 10px)`,
                bottom: "-24px",
              }}
            />
          );
        }
      }
    }

    return chairs;
  };

  const getTableSize = (capacity) => {
    if (capacity <= 2) return "w-16 h-16";
    if (capacity <= 4) return "w-20 h-20";
    return "w-24 h-24";
  };

  // Event handlers
  const handleTableClick = (table) => {
    setSelectedTable(table.id === selectedTable?.id ? null : table);
    if (onTableClick) {
      onTableClick(table);
    }
  };

  const handleRightClick = (e, table) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      table: table
    });
  };

  const handleEdit = (table) => {
    if (onTableEdit) {
      onTableEdit(table);
    }
  };

  const handleDeleteClick = (table) => {
    setShowDeleteConfirm(table);
  };

  const confirmDelete = () => {
    if (onTableDelete && showDeleteConfirm) {
      onTableDelete(showDeleteConfirm);
    }
    setShowDeleteConfirm(null);
    setSelectedTable(null);
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(null);
  };

  const renderTable = (table) => {
    const tableSize = getTableSize(table.capacity);
    const isSelected = selectedTable?.id === table.id;

    return (
      <div
        key={table.id}
        className={`relative flex flex-col items-center justify-center text-white text-xs font-semibold cursor-pointer transition-all duration-200 ${tableSize} ${getTableColor(
          table.booking_status || "available"
        )} ${getTableShape(table.capacity)} shadow-lg hover:shadow-xl hover:scale-105 z-10 ${
          isSelected ? 'ring-4 ring-blue-400 ring-opacity-75' : ''
        }`}
        onClick={() => handleTableClick(table)}
        onContextMenu={(e) => handleRightClick(e, table)}
        title={`Table ${table.table_number} - ${table.capacity} guests`}
      >
        <div className="text-center z-10">
          <div className="font-bold">T{table.table_number}</div>
          <div className="text-xs">{table.capacity}</div>
        </div>
        {renderChairs(table.capacity, table.booking_status, tableSize)}

        {/* Action buttons for selected table */}
        {isSelected && (
          <div className="absolute -top-2 -right-2 flex gap-1">
            <button
              className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-1 shadow-lg"
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(table);
              }}
              title="Edit Table"
            >
              ✏️
            </button>
            <button
              className="bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-lg"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteClick(table);
              }}
              title="Delete Table"
            >
              🗑️
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Legend */}
      <div className="flex justify-end mb-4 space-x-4 text-sm">
        <div className="flex items-center space-x-1">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span>Available</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-4 h-4 bg-orange-500 rounded"></div>
          <span>Booked</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span>On Dine</span>
        </div>
      </div>

      {/* Floor Layout */}
      <div
        className="relative bg-gray-50 rounded-lg p-4 grid grid-cols-6 gap-6 min-h-[600px]"
        onClick={() => {
          setContextMenu(null);
          setSelectedTable(null);
        }}
      >
        {tables.map(renderTable)}

        {/* Entrance */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-gray-500 text-sm font-medium z-10">
          🚪 Entrance
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          table={contextMenu.table}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete Table {showDeleteConfirm.table_number}?
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                onClick={cancelDelete}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                onClick={confirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableFloorLayout;

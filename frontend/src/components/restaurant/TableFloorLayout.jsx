import React from "react";

// Simple chair icon using emoji
const ChairIcon = ({ className, style }) => (
  <div className={className} style={style}>
    🪑
  </div>
);

const TableFloorLayout = ({ tables = [], onTableClick, userRole, onTableEdit, onTableDelete }) => {
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

  const renderTable = (table) => {
    const tableSize = getTableSize(table.capacity);
    return (
      <div
        key={table.id}
        className={`relative flex flex-col items-center justify-center text-white text-xs font-semibold cursor-pointer ${tableSize} ${getTableColor(
          table.booking_status || "available"
        )} ${getTableShape(table.capacity)} shadow-lg z-10`}
        onClick={() => onTableClick && onTableClick(table)}
        title={`Table ${table.table_number} - ${table.capacity} guests`}
      >
        <div className="text-center z-10">
          <div className="font-bold">T{table.table_number}</div>
          <div className="text-xs">{table.capacity}</div>
        </div>
        {renderChairs(table.capacity, table.booking_status, tableSize)}
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
      <div className="relative bg-gray-50 rounded-lg p-4 grid grid-cols-6 gap-6 min-h-[600px]">
        {tables.map(renderTable)}

        {/* Entrance */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-gray-500 text-sm font-medium z-10">
          🚪 Entrance
        </div>
      </div>
    </div>
  );
};

export default TableFloorLayout;

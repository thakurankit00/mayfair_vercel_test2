import React from 'react';

// Simple placeholder for menu item actions (edit/delete)
const MenuItemActions = ({ item, onEdit, onDelete }) => {
  return (
    <div className="flex space-x-2">
      <button
        className="text-blue-600 hover:text-blue-800 text-xs font-medium"
        onClick={() => onEdit && onEdit(item)}
      >
        Edit
      </button>
      <button
        className="text-red-600 hover:text-red-800 text-xs font-medium"
        onClick={() => onDelete && onDelete(item)}
      >
        Delete
      </button>
    </div>
  );
};

export default MenuItemActions;

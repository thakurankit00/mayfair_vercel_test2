import React from 'react';

  const MenuItemActions = ({ item }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setOpen(!open)}
        className="text-gray-400 hover:text-gray-600 focus:outline-none"
      >
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded-md shadow-lg z-10">
          <button
            onClick={() => {
              handleEditClick(item);
              setOpen(false);
            }}
            className="w-full text-left px-4 py-2 text-sm text-light-orange hover:bg-blue-100 hover:text-blue-800 rounded-t-md"
          >
            Edit
          </button>
          <button
            onClick={() => {
              handleDeleteClick(item.id);
              setOpen(false);
            }}
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-100 hover:text-red-800 rounded-b-md"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
};

export default MenuItemActions;

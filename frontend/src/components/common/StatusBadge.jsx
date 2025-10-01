import React from 'react';

const statusStyles = {
  pending: 'bg-yellow-300 text-yellow-800',
  confirmed: 'bg-green-200 text-green-800',
  cancelled: 'bg-red-200 text-red-800',
  completed: 'bg-orange-200 text-orange-800',
  default: 'bg-gray-400 text-white',
};

const StatusBadge = ({ status }) => {
  const normalized = (status || '').toLowerCase();
  let style = statusStyles.default;
  let label = status;
  if (normalized === 'pending') {
    style = statusStyles.pending;
    label = 'pending';
  } else if (normalized === 'confirmed') {
    style = statusStyles.confirmed;
    label = 'confirmed';
  } else if (normalized === 'cancelled') {
    style = statusStyles.cancelled;
    label = 'cancelled';
  }else if (normalized === 'completed') {
    style = statusStyles.completed;
    label ='completed';
  }
  return (
    <span className={`px-2 py-1 rounded text-sm font-semibold ${style}`}>{label}</span>
  );
};

export default StatusBadge;

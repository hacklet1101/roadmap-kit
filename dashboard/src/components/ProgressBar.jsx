import React from 'react';

/**
 * ProgressBar Component
 * Displays an animated progress bar with percentage
 */
export default function ProgressBar({ percentage = 0, label = '', color = 'green' }) {
  const colorClasses = {
    green: 'bg-status-completed',
    yellow: 'bg-status-progress',
    gray: 'bg-status-pending',
    blue: 'bg-blue-500'
  };

  const bgColor = colorClasses[color] || colorClasses.green;

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between mb-1">
          <span className="text-sm font-medium text-dark-text">{label}</span>
          <span className="text-sm font-medium text-dark-text">{percentage}%</span>
        </div>
      )}
      <div className="w-full bg-dark-border rounded-full h-2.5 overflow-hidden">
        <div
          className={`h-2.5 rounded-full transition-all duration-500 ease-out ${bgColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

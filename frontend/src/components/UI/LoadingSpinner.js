import React from 'react';

/**
 * Loading Spinner Component
 * Reusable spinner with different sizes
 */
const LoadingSpinner = ({ 
  size = 'md', 
  className = '', 
  color = 'blue' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const colorClasses = {
    blue: 'border-blue-200 border-t-blue-500',
    gray: 'border-gray-200 border-t-gray-500',
    white: 'border-white/30 border-t-white'
  };

  return (
    <div 
      className={`
        animate-spin rounded-full border-2 
        ${sizeClasses[size]} 
        ${colorClasses[color]} 
        ${className}
      `}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default LoadingSpinner;

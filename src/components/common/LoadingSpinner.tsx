// ============================================================================
// LOADING SPINNER
// ============================================================================

import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
}

const sizeClasses = {
  sm: 'w-6 h-6',
  md: 'w-10 h-10',
  lg: 'w-16 h-16',
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  message,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 gap-4">
      <div
        className={`${sizeClasses[size]} border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin`}
      />
      {message && <p className="text-gray-600 text-sm">{message}</p>}
    </div>
  );
};

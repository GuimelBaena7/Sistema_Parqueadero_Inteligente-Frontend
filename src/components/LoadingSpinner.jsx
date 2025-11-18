import React from 'react';

const LoadingSpinner = ({ message = 'Cargando...', size = 'md' }) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-10 w-10',
    lg: 'h-14 w-14'
  };

  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <div className={`animate-spin rounded-full ${sizeClasses[size]} border-3 border-slate-700 border-t-blue-500 mx-auto mb-3`}></div>
        <p className="text-slate-400 text-sm font-medium">{message}</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
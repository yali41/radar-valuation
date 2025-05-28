
import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', text }) => {
  const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-4',
    lg: 'w-16 h-16 border-4',
  };

  return (
    <div className="flex flex-col items-center justify-center my-8">
      <div
        className={`animate-spin rounded-full ${sizeClasses[size]} border-primary-500 border-t-transparent`}
      ></div>
      {text && <p className="mt-3 text-secondary-600 dark:text-secondary-400">{text}</p>}
    </div>
  );
};

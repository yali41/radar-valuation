
import React, { ReactNode } from 'react';

interface PageContainerProps {
  children: ReactNode;
  title?: string;
}

export const PageContainer: React.FC<PageContainerProps> = ({ children, title }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {title && (
        <h1 className="text-3xl font-bold text-secondary-900 dark:text-white mb-6 text-center sm:text-left">
          {title}
        </h1>
      )}
      <div className="bg-white dark:bg-secondary-800 shadow-xl rounded-lg p-6 md:p-8">
        {children}
      </div>
    </div>
  );
};

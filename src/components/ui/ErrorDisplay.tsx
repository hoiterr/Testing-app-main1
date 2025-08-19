import React, { useEffect } from 'react';
import { useError } from '@/contexts/ErrorContext';
// import { Card } from '@/components/ui/Card'; // Removed this import

export const ErrorDisplay: React.FC = () => {
  const { state: { message, type, isVisible }, clearError } = useError();

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        clearError();
      }, 5000); // Automatically clear error after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [isVisible, clearError]);

  if (!isVisible || !message) {
    return null;
  }

  const cardClass = `error-card ${type || 'error'}`;

  return (
    <div className="error-display-container">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-red-700">Error</h2>
        <button onClick={clearError} className="text-red-500 hover:text-red-700">
          Dismiss
        </button>
      </div>
    </div>
  );
};

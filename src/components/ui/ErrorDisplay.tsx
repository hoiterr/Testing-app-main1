import React, { useEffect } from 'react';
import { useError } from '../../contexts/ErrorContext';
import { Card } from './Card';

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
      <Card className={cardClass}>
        <div className="error-content">
          <p>{message}</p>
          <button onClick={clearError} className="clear-error-button">×</button>
        </div>
      </Card>
    </div>
  );
};

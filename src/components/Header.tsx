import React from 'react';
import { Icon } from './ui/Icon';
import { useUI } from '../hooks/useUI';

export const Header: React.FC = () => {
  const { showHistory, showPublicLibrary } = useUI();
  return (
    <header className="app-header" role="banner">
      <div className="max-w-7xl mx-auto px-4 flex-row justify-between items-center py-3">
        <div className="flex-row items-center gap-3">
          <Icon name="mainLogo" style={{height: '2.5rem', width: 'auto'}} aria-hidden="true" /> {/* Icon is decorative */}
          <h1 className="text-xl hidden sm-only">
            CRT AI OPTIMIZER
          </h1>
        </div>
        <div className="flex-row gap-2">
            <button 
                onClick={showPublicLibrary}
                className="button button-secondary"
                aria-label="Open Public Library"
            >
                <Icon name="atlas" style={{height: '1.25rem', width: '1.25rem'}} aria-hidden="true" />
                <span>Library</span>
            </button>
            <button 
                onClick={showHistory}
                className="button button-secondary"
                aria-label="Open History Modal"
            >
                <Icon name="history" style={{height: '1.25rem', width: '1.25rem'}} aria-hidden="true" />
                <span>History</span>
            </button>
        </div>
      </div>
    </header>
  );
};

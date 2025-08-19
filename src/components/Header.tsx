import React from 'react';
import { useApp } from '@/contexts/AppContext';
import { useUI } from '@/hooks/useUI';

export const Header: React.FC = () => {
  const { showHistory, showPublicLibrary } = useUI();
  return (
    <header className="app-header" role="banner">
      <div className="max-w-7xl mx-auto px-4 flex-row justify-between items-center py-3">
        <div className="flex-row items-center gap-3">
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
                <span>Library</span>
            </button>
            <button 
                onClick={showHistory}
                className="button button-secondary"
                aria-label="Open History Modal"
            >
                <span>History</span>
            </button>
        </div>
      </div>
    </header>
  );
};

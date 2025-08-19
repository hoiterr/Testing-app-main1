import React from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { useUI } from '@/hooks/useUI';

export const Header: React.FC = () => {
  const { isHistoryVisible, showHistory, hideHistory, isPublicLibraryVisible, showPublicLibrary, hidePublicLibrary } = useUI();
  const { resetAllAppStates } = useAppContext();

  return (
    <header className="app-header">
      <div className="max-w-7xl mx-auto px-4 flex-row justify-between items-center py-3">
        <div className="flex-row items-center gap-3">
          <h1 className="text-xl hidden sm-only">
            CRT AI OPTIMIZER
          </h1>
        </div>
        <nav className="flex-row items-center gap-4">
          <button
            onClick={() => {
              hideHistory();
              showPublicLibrary();
            }}
            className="flex-row items-center gap-2 text-white/80 hover:text-white transition-colors text-sm font-medium"
            aria-label="Open Public Library"
          >
            <span>Library</span>
          </button>
          <button
            onClick={() => {
              hidePublicLibrary();
              showHistory();
            }}
            className="flex-row items-center gap-2 text-white/80 hover:text-white transition-colors text-sm font-medium"
            aria-label="Open History Modal"
          >
            <span>History</span>
          </button>
          <button
            onClick={resetAllAppStates}
            className="flex-row items-center gap-2 text-white/80 hover:text-white transition-colors text-sm font-medium"
          >
            Reset
          </button>
        </nav>
      </div>
    </header>
  );
};

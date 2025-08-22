

import React, { lazy, Suspense, useEffect, useState } from 'react';
import { useAnalysis } from '@/hooks/useAnalysis';
import { useUI } from '@/hooks/useUI';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { logService, type LogEntry } from '@/services/logService';
// import { ErrorDisplay } from '@/components/ui/ErrorDisplay'; // Removed as it's not used directly here

// Lazy load components (only include components that actually exist)
const AnalysisDashboard = lazy(() => import('@/components/features/analysis/AnalysisDashboard'));
// Removed unused HistoryModal lazy import
const PobInput = lazy(() => import('@/components/features/import/PobInput').then(module => ({ default: module.default }))); // Corrected lazy loading for default export
// Removed SimulationView import as it's not needed directly here, will be a text placeholder.

// Removed non-existent components:
// const Welcome = lazy(() => import('@/components/features/import/Welcome'));
// const ThinkingProcess = lazy(() => import('@/components/features/import/ThinkingProcess'));
// const BuildHud = lazy(() => import('@/components/features/analysis/BuildHud'));
// const ChatInterface = lazy(() => import('@/components/features/chat/ChatInterface'));

const AppLayout: React.FC = () => {
  const [isDebugConsoleVisible, setIsDebugConsoleVisible] = useState(logService.isConsoleVisible());
  const [logs, setLogs] = useState<LogEntry[]>([]);
  useEffect(() => {
    logService.subscribeVisibility(() => {
      setIsDebugConsoleVisible(logService.isConsoleVisible());
    });
    const unsubscribe = logService.subscribe((newLogs) => setLogs(newLogs));
    return () => { unsubscribe(); };
  }, []);

  const { view, error, resetAnalysis } = useAnalysis();
  const { /* isHistoryVisible, isGuidedReviewVisible, isGuideModalVisible, isPublicLibraryVisible */ } = useUI();
  const { /* startWelcomeTour, state: { hasCompletedWelcomeTour } */ } = useOnboarding();

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-yellow">CRT Futurism Build Analyzer</h1>
          <button
            onClick={logService.toggleVisibility}
            className="px-2 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
            aria-expanded={isDebugConsoleVisible}
          >
            Debug Console
          </button>
        </div>
      </header>

      <main className="flex-1 p-6 overflow-auto">
        <Suspense fallback={<div>Loading...</div>}>
          {view === 'welcome' && (
            <div className="max-w-4xl mx-auto">
              <PobInput />
            </div>
          )}

          {view === 'loading' && (
            <div className="max-w-4xl mx-auto mt-12">
              <p>AI is theorycrafting...</p> 
            </div>
          )}

          {view === 'dashboard' && (
            <div className="max-w-5xl mx-auto animate-fade-in flex flex-col gap-6">
              <AnalysisDashboard />
            </div>
          )}

          {view === 'error' && error && (
            <div className="error-container text-center">
              <h2 className="text-2xl font-bold text-red-600 mb-4">An Error Occurred</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">{error}</p>
              <button onClick={resetAnalysis} className="button button-secondary mt-4">Start Over</button>
            </div>
          )}
        </Suspense>

        {/* Completely removed conditional rendering for non-existent modals and chat interface */}
      </main>

      <footer className="text-center p-6 opacity-50 text-sm" role="contentinfo">
        <p>&copy; {new Date().getFullYear()} CRT Futurism. All rights reserved.</p>
      </footer>

      {isDebugConsoleVisible && (
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            height: '240px',
            background: 'rgba(0,0,0,0.85)',
            borderTop: '1px solid var(--color-glow-secondary)',
            zIndex: 60,
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <div className="flex-row justify-between items-center p-4" style={{borderBottom: '1px solid var(--color-divider-default)'}}>
            <strong>Debug Console</strong>
            <button onClick={logService.toggleVisibility} className="button button-secondary" style={{padding: '0.25rem 0.75rem', fontSize: '0.75rem'}}>Close</button>
          </div>
          <div className="p-4" style={{overflowY: 'auto', fontSize: '0.875rem'}}>
            {logs.length === 0 ? (
              <div className="opacity-50">No logs yet.</div>
            ) : (
              logs.map((entry) => (
                <div key={entry.id} style={{marginBottom: '0.25rem'}}>
                  <span style={{opacity: 0.7}}>[{entry.timestamp}]</span>{' '}
                  <span style={{fontWeight: 700, color: 'var(--color-status-warning)'}}>{entry.level}</span>{' '}
                  <span>{entry.message}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AppLayout;
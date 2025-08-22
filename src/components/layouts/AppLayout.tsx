

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
  const [query, setQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<'ALL' | 'INFO' | 'ERROR' | 'DEBUG'>('ALL');
  const [autoScroll, setAutoScroll] = useState(true);
  const consoleBodyRef = React.useRef<HTMLDivElement>(null);
  useEffect(() => {
    logService.subscribeVisibility(() => {
      setIsDebugConsoleVisible(logService.isConsoleVisible());
    });
    const unsubscribe = logService.subscribe((newLogs) => {
      setLogs(newLogs);
      if (autoScroll) {
        requestAnimationFrame(() => {
          const el = consoleBodyRef.current;
          if (el) el.scrollTop = el.scrollHeight;
        });
      }
    });
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
            height: '300px',
            background: 'rgba(0,0,0,0.85)',
            borderTop: '1px solid var(--color-glow-secondary)',
            zIndex: 60,
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <div className="flex-row justify-between items-center p-2" style={{borderBottom: '1px solid var(--color-divider-default)'}}>
            <div className="flex-row items-center gap-2">
              <strong>Debug Console</strong>
              <input
                type="text"
                className="input-field"
                placeholder="Search logs..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{width: '240px', padding: '0.25rem 0.5rem'}}
              />
              <select
                className="input-field"
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value as any)}
                style={{width: '140px', padding: '0.25rem 0.5rem'}}
              >
                <option value="ALL">All Levels</option>
                <option value="ERROR">Errors</option>
                <option value="WARN">Warn</option>
                <option value="INFO">Info</option>
                <option value="DEBUG">Debug</option>
              </select>
              <label className="text-sm" style={{display:'flex',alignItems:'center',gap:'0.25rem'}}>
                <input type="checkbox" checked={autoScroll} onChange={(e)=>setAutoScroll(e.target.checked)} /> Auto-scroll
              </label>
              <button
                onClick={() => logService.clearLogs()}
                className="button button-secondary"
                style={{padding: '0.25rem 0.5rem', fontSize: '0.75rem'}}
              >
                Clear
              </button>
              <button
                onClick={() => {
                  const errorsOnly = logs.filter(l => l.level === 'ERROR');
                  const text = errorsOnly.map(l => `[${l.timestamp}] ${l.level} ${l.message} ${l.payload?JSON.stringify(l.payload):''}`).join('\n');
                  navigator.clipboard.writeText(text).catch(()=>{});
                }}
                className="button button-secondary"
                style={{padding: '0.25rem 0.5rem', fontSize: '0.75rem'}}
                aria-label="Copy Errors"
              >Copy Errors</button>
              <button
                onClick={() => {
                  const blob = new Blob([JSON.stringify(logs,null,2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url; a.download = `logs-${Date.now()}.json`; a.click();
                  URL.revokeObjectURL(url);
                }}
                className="button button-secondary"
                style={{padding: '0.25rem 0.5rem', fontSize: '0.75rem'}}
              >Download</button>
            </div>
            <button onClick={logService.toggleVisibility} className="button button-secondary" style={{padding: '0.25rem 0.75rem', fontSize: '0.75rem'}}>Close</button>
          </div>
          <div ref={consoleBodyRef} className="p-2" style={{overflowY: 'auto', fontSize: '0.875rem'}}>
            {logs.length === 0 ? (
              <div className="opacity-50">No logs yet.</div>
            ) : (
              logs
                .filter(l => levelFilter==='ALL' ? true : l.level===levelFilter)
                .filter(l => !query.trim() ? true : (`${l.message} ${l.payload?JSON.stringify(l.payload):''}`).toLowerCase().includes(query.toLowerCase()))
                .map((entry) => {
                  const isError = entry.level === 'ERROR';
                  return (
                    <div key={entry.id} style={{marginBottom: '0.25rem', borderLeft: isError ? '3px solid var(--color-status-error)' : undefined, paddingLeft: isError ? '0.5rem' : undefined}}>
                      <span style={{opacity: 0.7}}>[{entry.timestamp}]</span>{' '}
                      <span style={{fontWeight: 700, color: entry.level==='ERROR' ? 'var(--color-status-error)' : entry.level==='DEBUG' ? 'var(--color-interactive-primary)' : 'var(--color-status-warning)'}}>{entry.level}</span>{' '}
                      <span>{entry.message}</span>
                      {entry.payload && (
                        <details className="expandable-suggestion" style={{marginTop: '0.25rem'}}>
                          <summary>Details</summary>
                          <pre style={{whiteSpace:'pre-wrap'}}>{JSON.stringify(entry.payload, null, 2)}</pre>
                        </details>
                      )}
                      {isError && (
                        <div className="text-sm" style={{opacity:0.8, marginTop:'0.25rem'}}>
                          Hint: Check network tab for /api calls; ensure GEMINI and POESESSID are set; retry after 30s (PoE rate limits). 
                        </div>
                      )}
                    </div>
                  );
                })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AppLayout;
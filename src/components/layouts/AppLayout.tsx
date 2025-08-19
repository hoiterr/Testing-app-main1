

import React, { lazy, Suspense, useEffect, useState } from 'react';
import { useAnalysis } from '@/hooks/useAnalysis';
import { useUI } from '@/hooks/useUI';
import { Header } from '@/components/Header';
import { Icon } from '@/components/ui/Icon';
import { logService } from '@/services/logService';
import { ErrorDisplay } from '@/components/ui/ErrorDisplay';
import { useOnboarding } from '@/contexts/OnboardingContext'; // New import

// Lazy load components
const AnalysisDashboard = lazy(() => import('@/components/features/analysis/AnalysisDashboard'));
const HistoryModal = lazy(() => import('@/components/features/history/HistoryModal').then(module => ({ default: module.HistoryModal })));
const PobInput = lazy(() => import('@/components/features/import/PobInput'));
const SimulationView = lazy(() => import('@/components/features/simulation/SimulationView'));
// Removed non-existent components and corrected lazy loading for existing ones
// const Welcome = lazy(() => import('@/components/features/import/Welcome'));
// const ThinkingProcess = lazy(() => import('@/components/features/import/ThinkingProcess'));
// const BuildHud = lazy(() => import('@/components/features/analysis/BuildHud'));
// const ChatInterface = lazy(() => import('@/components/features/chat/ChatInterface'));
// const GuidedReviewModal = lazy(() => import('@/components/features/review/GuidedReviewModal'));
// const GuideModal = lazy(() => import('@/components/features/review/GuideModal'));
// const PublicLibraryModal = lazy(() => import('@/components/features/library/PublicLibraryModal'));

// Temporary: Welcome Tour Modal (will be extracted to its own component)
const WelcomeTourModal: React.FC = () => {
  const { state: { currentWelcomeTourStep, hasCompletedWelcomeTour, isWelcomeTourActive }, advanceWelcomeTour, completeWelcomeTour } = useOnboarding();

  if (!isWelcomeTourActive || hasCompletedWelcomeTour) {
    return null;
  }

  const tourSteps = [
    { title: "Welcome to CRT AI Optimizer!", description: "Let's get you started with analyzing your Path of Exile builds.", target: "app-header" },
    { title: "Input Your Build", description: "Paste your Path of Building (PoB) data or account name here to begin the analysis.", target: "pob-input-section" }, // Assuming an ID for the input section
    { title: "Analyze & Optimize", description: "Once analyzed, you'll get detailed insights and improvement suggestions for your build.", target: "dashboard-section" }, // Assuming an ID for the dashboard section
    { title: "Chat with AI", description: "Ask the AI follow-up questions about your build or specific mechanics.", target: "chat-sidebar" }, // Assuming an ID for the chat sidebar
  ];

  const currentStepContent = tourSteps[currentWelcomeTourStep];

  return (
    <div className="welcome-tour-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div className="welcome-tour-modal card p-6 text-center" style={{ maxWidth: '500px', width: '90%' }}>
        <h2 className="text-xl text-yellow mb-4">{currentStepContent.title}</h2>
        <p className="opacity-80 mb-6">{currentStepContent.description}</p>
        <div className="flex-row justify-center gap-4">
          {currentWelcomeTourStep < tourSteps.length - 1 ? (
            <button onClick={advanceWelcomeTour} className="button button-primary">Next</button>
          ) : (
            <button onClick={completeWelcomeTour} className="button button-primary">Finish Tour</button>
          )}
          <button onClick={completeWelcomeTour} className="button button-secondary">Skip Tour</button>
        </div>
      </div>
    </div>
  );
};

const analysisSteps = [
  "Decompressing and parsing build data...",
  "Analyzing passive skill tree paths...",
  "Evaluating equipped gear and affix tiers...",
  "Assessing gem links and support setups...",
  "Reviewing flask utility and enchantments...",
  "Cross-referencing with live trade data...",
  "Consulting latest patch notes...",
  "Synthesizing final recommendations...",
];

const AppLayout: React.FC = () => {
  const { view, error, resetAnalysis, currentStepIndex, analysisResult } = useAnalysis();
  const { isHistoryVisible, isGuidedReviewVisible, isGuideModalVisible, isPublicLibraryVisible } = useUI();
  const { startWelcomeTour, state: { hasCompletedWelcomeTour } } = useOnboarding(); // Use useOnboarding

  const [isDebugConsoleVisible, setIsDebugConsoleVisible] = useState(logService.isConsoleVisible());

  useEffect(() => {
    logService.subscribeVisibility(() => {
      setIsDebugConsoleVisible(logService.isConsoleVisible());
    });
  }, []);

  useEffect(() => {
    if (!hasCompletedWelcomeTour && view === 'welcome') { // Only start tour if not completed and on welcome view
      const timer = setTimeout(() => {
        startWelcomeTour();
      }, 1000); // Small delay to ensure everything is rendered
      return () => clearTimeout(timer);
    }
  }, [hasCompletedWelcomeTour, view, startWelcomeTour]);

  return (
    <div className="app-container">
      <Header />
      <div className="main-layout">
        <main className="content-area" role="main" aria-label="Application Content">
          <Suspense fallback={<div>Loading content...</div>}>
            {view === 'welcome' && (
              <div className="max-w-4xl mx-auto">
                <PobInput />
              </div>
            )}

            {view === 'loading' && (
              <div className="max-w-4xl mx-auto mt-12">
                <SimulationView steps={analysisSteps} currentStep={currentStepIndex} />
              </div>
            )}

            {view === 'error' && (
              <div className="max-w-4xl mx-auto">
                <div className="card mt-6 p-4 flex-col items-center gap-4 text-center" style={{ borderColor: 'var(--color-red)' }}>
                  <Icon name="alertTriangle" className="text-red" style={{ flexShrink: 0, width: '36px', height: '36px' }} />
                  <div>
                    <strong className="text-red text-xl">ANALYSIS HALTED</strong>
                    <p className="mt-2">{error}</p>
                  </div>
                  <button onClick={resetAnalysis} className="button button-secondary mt-4">Start Over</button>
                </div>
              </div>
            )}

            {view === 'dashboard' && analysisResult && (
              <div className="max-w-5xl mx-auto animate-fade-in flex flex-col gap-6">
                <SimulationView />
                <AnalysisDashboard />
              </div>
            )}
          </Suspense>
        </main>

        {view === 'dashboard' && analysisResult && (
          <aside className="chat-sidebar" role="complementary" aria-label="Chat Interface">
            <Suspense fallback={<div>Loading chat...</div>}>
              {/* ChatInterface component was removed, so this will be empty or a placeholder */}
            </Suspense>
          </aside>
        )}
      </div>

      <footer className="text-center p-6 opacity-50 text-sm" role="contentinfo">
        <p>CRT Futurism Build Analyzer. Analysis considers recent patch notes. Character data from pathofexile.com. All analysis is generated by AI and should be used as a guideline.</p>
        <button
          onClick={logService.toggleVisibility}
          className="px-2 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
          aria-expanded={isDebugConsoleVisible}
        >
          [Toggle Debug Console]
        </button>
      </footer>
      <Suspense fallback={null}> 
        {isHistoryVisible && <HistoryModal aria-modal="true" />}
        {isGuidedReviewVisible && <GuidedReviewModal aria-modal="true" />}
        {isGuideModalVisible && <GuideModal aria-modal="true" />}
        {isPublicLibraryVisible && <PublicLibraryModal aria-modal="true" />}
      </Suspense>
      <ErrorDisplay />
      <WelcomeTourModal /> {/* Add the WelcomeTourModal here */}
    </div>
  );
};

export default AppLayout;
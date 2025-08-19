

import React, { lazy, Suspense } from 'react';
import { AnalysisProvider } from './contexts/AnalysisContext';
import { ChatProvider } from './contexts/ChatContext';
import { HistoryProvider } from './contexts/HistoryContext';
import { UIProvider } from './contexts/UIContext';
import { AppProvider } from './contexts/AppContext';
import { ErrorProvider } from './contexts/ErrorContext';
import { OnboardingProvider } from './contexts/OnboardingContext';
import { ThemeProvider } from './contexts/ThemeContext'; // New import
import AppLayout from './components/layouts/AppLayout';
import { logService } from './services/logService';

const DebugConsole = lazy(() => import('./components/ui/DebugConsole').then(module => ({ default: module.DebugConsole })));

interface AppProps {}

export const App: React.FC<AppProps> = () => {
    // Initialize log service on app start
    React.useEffect(() => {
        logService.info("Application initialized.");
    }, []);

    return (
        <AppProvider>
            <ErrorProvider>
                <UIProvider>
                    <HistoryProvider>
                        <ChatProvider>
                            <AnalysisProvider>
                                <OnboardingProvider>
                                    <ThemeProvider> {/* Wrap with ThemeProvider */}
                                        <AppLayout />
                                        <Suspense fallback={null}> 
                                            <DebugConsole />
                                        </Suspense>
                                    </ThemeProvider>
                                </OnboardingProvider>
                            </AnalysisProvider>
                        </ChatProvider>
                    </HistoryProvider>
                </UIProvider>
            </ErrorProvider>
        </AppProvider>
    );
};
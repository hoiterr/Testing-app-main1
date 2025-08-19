

import React, { lazy, Suspense } from 'react';
import { ErrorProvider } from '@/contexts/ErrorContext';
import { HistoryProvider } from '@/contexts/HistoryContext';
import { OnboardingProvider } from '@/contexts/OnboardingContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { UIProvider } from '@/contexts/UIContext';
import { App } from '@/App'; // Corrected import for App
import { AppProvider } from '@/contexts/AppContext';
import { AnalysisProvider } from '@/contexts/AnalysisContext';
import { ChatProvider } from '@/contexts/ChatContext';
import AppLayout from '@/components/layouts/AppLayout';
import { logService } from '@/services/logService';

const DebugConsole = lazy(() => import('@/components/ui/DebugConsole').then(module => ({ default: module.DebugConsole })));

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
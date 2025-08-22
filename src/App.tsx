

import React from 'react';
import { ErrorProvider } from '@/contexts/ErrorContext';
import { HistoryProvider } from '@/contexts/HistoryContext';
import { OnboardingProvider } from '@/contexts/OnboardingContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { UIProvider } from '@/contexts/UIContext';
import { AppProvider } from '@/contexts/AppContext';
import { AnalysisProvider } from '@/contexts/AnalysisContext';
import { ChatProvider } from '@/contexts/ChatContext';
import AppLayout from '@/components/layouts/AppLayout';
import { logService } from '@/services/logService';


interface AppProps {}

export const App: React.FC<AppProps> = () => {
    // Initialize log service on app start
    React.useEffect(() => {
        logService.info("Application initialized.");
    }, []);

    return (
        <ErrorProvider>
            <UIProvider>
                <HistoryProvider>
                    <ChatProvider>
                        <AnalysisProvider>
                            <OnboardingProvider>
                                <ThemeProvider> {/* Wrap with ThemeProvider */}
                                    <AppProvider>
                                        <AppLayout />
                                        {/* Removed DebugConsole usage */}
                                        {/* <Suspense fallback={null}> 
                                            <DebugConsole />
                                        </Suspense> */}
                                    </AppProvider>
                                </ThemeProvider>
                            </OnboardingProvider>
                        </AnalysisProvider>
                    </ChatProvider>
                </HistoryProvider>
            </UIProvider>
        </ErrorProvider>
    );
};
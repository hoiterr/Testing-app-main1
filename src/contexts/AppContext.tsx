import React, { createContext, useCallback, ReactNode } from 'react';
import { useAnalysis } from '../hooks/useAnalysis';
import { useChat } from '../hooks/useChat';
import { useUI } from '../hooks/useUI';
import { useHistory } from '../hooks/useHistory';

interface AppContextType {
  resetAllAppStates: () => void;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const { resetAnalysis } = useAnalysis();
  const { resetChat } = useChat();
  const { resetUI } = useUI();
  const { resetHistory } = useHistory();

  const resetAllAppStates = useCallback(() => {
    resetAnalysis();
    resetChat();
    resetUI();
    resetHistory();
  }, [resetAnalysis, resetChat, resetUI, resetHistory]);

  return (
    <AppContext.Provider value={{ resetAllAppStates }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = React.useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

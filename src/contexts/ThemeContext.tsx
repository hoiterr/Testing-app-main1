import React, { createContext, useReducer, useContext, useEffect, useCallback, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeState {
  currentTheme: Theme;
}

type ThemeAction =
  | { type: 'SET_THEME'; payload: Theme }
  | { type: 'LOAD_THEME'; payload: Theme };

const LOCAL_STORAGE_KEY = 'poe-ai-optimizer-theme';

const getInitialTheme = (): Theme => {
  // 1. Try to get theme from localStorage
  const savedTheme = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (savedTheme === 'light' || savedTheme === 'dark') {
    return savedTheme;
  }
  // 2. Fallback to system preference
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  // 3. Default to dark
  return 'dark';
};

const initialState: ThemeState = {
  currentTheme: getInitialTheme(),
};

const themeReducer = (state: ThemeState, action: ThemeAction): ThemeState => {
  switch (action.type) {
    case 'SET_THEME':
      return { ...state, currentTheme: action.payload };
    case 'LOAD_THEME':
      return { ...state, currentTheme: action.payload };
    default:
      return state;
  }
};

interface ThemeContextType {
  state: ThemeState;
  dispatch: React.Dispatch<ThemeAction>;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(themeReducer, initialState);

  // Apply theme class to body and save to localStorage
  useEffect(() => {
    document.body.classList.remove('theme-light', 'theme-dark');
    document.body.classList.add(`theme-${state.currentTheme}`);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, state.currentTheme);
    } catch (error) {
      console.error("Failed to save theme to localStorage", error);
    }
  }, [state.currentTheme]);

  const setTheme = useCallback((theme: Theme) => {
    dispatch({ type: 'SET_THEME', payload: theme });
  }, []);

  const toggleTheme = useCallback(() => {
    dispatch({ type: 'SET_THEME', payload: state.currentTheme === 'light' ? 'dark' : 'light' });
  }, [state.currentTheme]);

  const value = {
    state,
    dispatch,
    setTheme,
    toggleTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

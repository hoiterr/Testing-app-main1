import React, { createContext, useReducer, useContext, ReactNode } from 'react';

// 1. Define the state interface
interface ErrorState {
  message: string | null;
  type: 'error' | 'warning' | 'info' | null;
  isVisible: boolean;
}

// 2. Define action types
type ErrorAction =
  | { type: 'SET_ERROR'; payload: { message: string; type?: 'error' | 'warning' | 'info' } }
  | { type: 'CLEAR_ERROR' };

// 3. Define the initial state
const initialState: ErrorState = {
  message: null,
  type: null,
  isVisible: false,
};

// 4. Create the reducer function
const errorReducer = (state: ErrorState, action: ErrorAction): ErrorState => {
  switch (action.type) {
    case 'SET_ERROR':
      return {
        ...state,
        message: action.payload.message,
        type: action.payload.type || 'error',
        isVisible: true,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        message: null,
        type: null,
        isVisible: false,
      };
    default:
      return state;
  }
};

// 5. Define the context type
interface ErrorContextType {
  state: ErrorState;
  dispatch: React.Dispatch<ErrorAction>;
  showError: (message: string, type?: 'error' | 'warning' | 'info') => void;
  clearError: () => void;
}

// 6. Create the context
const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

// 7. Create the provider component
interface ErrorProviderProps {
  children: ReactNode;
}

export const ErrorProvider: React.FC<ErrorProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(errorReducer, initialState);

  const showError = (message: string, type?: 'error' | 'warning' | 'info') => {
    dispatch({ type: 'SET_ERROR', payload: { message, type } });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value = {
    state,
    dispatch,
    showError,
    clearError,
  };

  return <ErrorContext.Provider value={value}>{children}</ErrorContext.Provider>;
};

// 8. Create a custom hook to use the error context
export const useError = () => {
  const context = useContext(ErrorContext);
  if (context === undefined) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  return context;
};

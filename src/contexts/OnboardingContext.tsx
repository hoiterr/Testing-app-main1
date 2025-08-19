import React, { createContext, useReducer, useContext, ReactNode, useEffect, useCallback } from 'react';

// 1. Define the state interface
interface OnboardingState {
  hasCompletedWelcomeTour: boolean;
  currentWelcomeTourStep: number;
  isWelcomeTourActive: boolean;
  hasDismissedPobInputHint: boolean;
  // Add other onboarding flags as needed
}

// 2. Define action types
type OnboardingAction =
  | { type: 'SET_WELCOME_TOUR_ACTIVE'; payload: boolean }
  | { type: 'NEXT_WELCOME_TOUR_STEP' }
  | { type: 'COMPLETE_WELCOME_TOUR' }
  | { type: 'DISMISS_POB_INPUT_HINT' }
  | { type: 'LOAD_ONBOARDING_STATE'; payload: OnboardingState };

// 3. Define the initial state
const initialState: OnboardingState = {
  hasCompletedWelcomeTour: false,
  currentWelcomeTourStep: 0,
  isWelcomeTourActive: false,
  hasDismissedPobInputHint: false,
};

// Key for localStorage
const LOCAL_STORAGE_KEY = 'poe-ai-optimizer-onboarding';

// 4. Create the reducer function
const onboardingReducer = (state: OnboardingState, action: OnboardingAction): OnboardingState => {
  switch (action.type) {
    case 'SET_WELCOME_TOUR_ACTIVE':
      return { ...state, isWelcomeTourActive: action.payload };
    case 'NEXT_WELCOME_TOUR_STEP':
      return { ...state, currentWelcomeTourStep: state.currentWelcomeTourStep + 1 };
    case 'COMPLETE_WELCOME_TOUR':
      return { ...state, hasCompletedWelcomeTour: true, isWelcomeTourActive: false, currentWelcomeTourStep: 0 };
    case 'DISMISS_POB_INPUT_HINT':
      return { ...state, hasDismissedPobInputHint: true };
    case 'LOAD_ONBOARDING_STATE':
      return { ...state, ...action.payload };
    default:
      return state;
  }
};

// 5. Define the context type
interface OnboardingContextType {
  state: OnboardingState;
  dispatch: React.Dispatch<OnboardingAction>;
  startWelcomeTour: () => void;
  advanceWelcomeTour: () => void;
  completeWelcomeTour: () => void;
  dismissPobInputHint: () => void;
}

// 6. Create the context
export const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

// 7. Create the provider component
interface OnboardingProviderProps {
  children: ReactNode;
}

export const OnboardingProvider: React.FC<OnboardingProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(onboardingReducer, initialState);

  // Load state from localStorage on mount
  useEffect(() => {
    try {
      const savedState = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedState) {
        dispatch({ type: 'LOAD_ONBOARDING_STATE', payload: JSON.parse(savedState) });
      }
    } catch (error) {
      console.error("Failed to load onboarding state from localStorage", error);
    }
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error("Failed to save onboarding state to localStorage", error);
    }
  }, [state]);

  const startWelcomeTour = useCallback(() => {
    if (!state.hasCompletedWelcomeTour) {
      dispatch({ type: 'SET_WELCOME_TOUR_ACTIVE', payload: true });
      dispatch({ type: 'NEXT_WELCOME_TOUR_STEP' }); // Start with the first step
    }
  }, [state.hasCompletedWelcomeTour]);

  const advanceWelcomeTour = useCallback(() => {
    dispatch({ type: 'NEXT_WELCOME_TOUR_STEP' });
  }, []);

  const completeWelcomeTour = useCallback(() => {
    dispatch({ type: 'COMPLETE_WELCOME_TOUR' });
  }, []);

  const dismissPobInputHint = useCallback(() => {
    dispatch({ type: 'DISMISS_POB_INPUT_HINT' });
  }, []);

  const value = {
    state,
    dispatch,
    startWelcomeTour,
    advanceWelcomeTour,
    completeWelcomeTour,
    dismissPobInputHint,
  };

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
};

// 8. Create a custom hook to use the onboarding context
export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};

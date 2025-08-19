
import React, { createContext, useState } from 'react';

interface UIContextType {
    isHistoryVisible: boolean;
    isGuidedReviewVisible: boolean;
    isGuideModalVisible: boolean;
    isPublicLibraryVisible: boolean;
    currentReviewStep: number;

    showHistory: () => void;
    hideHistory: () => void;
    showGuidedReview: () => void;
    hideGuidedReview: () => void;
    showGuideModal: () => void;
    hideGuideModal: () => void;
    showPublicLibrary: () => void;
    hidePublicLibrary: () => void;
    setReviewStep: (step: number) => void;
    resetUI: () => void; // New method to reset UI state
}

export const UIContext = createContext<UIContextType | null>(null);

export const UIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isHistoryVisible, setIsHistoryVisible] = useState(false);
    const [isGuidedReviewVisible, setIsGuidedReviewVisible] = useState(false);
    const [isGuideModalVisible, setIsGuideModalVisible] = useState(false);
    const [isPublicLibraryVisible, setIsPublicLibraryVisible] = useState(false);
    const [currentReviewStep, setCurrentReviewStep] = useState(0);
    
    const value: UIContextType = {
        isHistoryVisible,
        isGuidedReviewVisible,
        isGuideModalVisible,
        isPublicLibraryVisible,
        currentReviewStep,

        showHistory: () => setIsHistoryVisible(true),
        hideHistory: () => setIsHistoryVisible(false),
        showGuidedReview: () => {
            setCurrentReviewStep(0);
            setIsGuidedReviewVisible(true);
        },
        hideGuidedReview: () => setIsGuidedReviewVisible(false),
        showGuideModal: () => setIsGuideModalVisible(true),
        hideGuideModal: () => setIsGuideModalVisible(false),
        showPublicLibrary: () => setIsPublicLibraryVisible(true),
        hidePublicLibrary: () => setIsPublicLibraryVisible(false),
        setReviewStep: setCurrentReviewStep,
        resetUI: () => {
            setIsHistoryVisible(false);
            setIsGuidedReviewVisible(false);
            setIsGuideModalVisible(false);
            setIsPublicLibraryVisible(false);
            setCurrentReviewStep(0);
        },
    };

    return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
};
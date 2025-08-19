
import { useContext } from 'react';
import { HistoryContext } from '../contexts/HistoryContext';

export const useHistory = () => {
    const context = useContext(HistoryContext);
    if (!context) {
        throw new Error('useHistory must be used within a HistoryProvider');
    }
    return context;
};
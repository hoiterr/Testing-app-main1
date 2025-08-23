export type LogLevel = 'INFO' | 'ERROR' | 'DEBUG';

export interface LogEntry {
    id: number;
    timestamp: string;
    level: LogLevel;
    message: string;
    payload?: any;
}

type LogListener = (logs: LogEntry[]) => void;
type VisibilityListener = (isVisible: boolean) => void;

class LogService {
    private logs: LogEntry[] = [];
    private listeners: Set<LogListener> = new Set();
    private visibilityListeners: Set<VisibilityListener> = new Set();
    private nextId = 0;
    private isVisible = false;

    private addLog(level: LogLevel, message: string, payload?: any) {
        const normalize = (val: any, depth = 0): any => {
            if (val == null) return val;
            if (val instanceof Error) {
                return { name: val.name, message: val.message, stack: val.stack };
            }
            if (typeof val === 'object') {
                if (depth > 2) return '[Object]';
                const out: any = Array.isArray(val) ? [] : {};
                for (const k of Object.keys(val)) {
                    out[k] = normalize((val as any)[k], depth + 1);
                }
                return out;
            }
            return val;
        };
        const newLog: LogEntry = {
            id: this.nextId++,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
            level,
            message,
            payload: normalize(payload),
        };
        this.logs = [...this.logs, newLog].slice(-100); // Keep last 100 logs
        this.notifyListeners();
    }
    
    info(message: string, payload?: any) { this.addLog('INFO', message, payload); }
    error(message: string, payload?: any) { this.addLog('ERROR', message, payload); }
    debug(message: string, payload?: any) { this.addLog('DEBUG', message, payload); }

    getLogs = (): LogEntry[] => this.logs;

    clearLogs = () => {
        this.logs = [];
        this.notifyListeners();
    };
    
    subscribe = (listener: LogListener) => {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener); // Unsubscribe function
    };

    private notifyListeners = () => {
        for (const listener of this.listeners) {
            listener([...this.logs]);
        }
    };
    
    // Visibility
    toggleVisibility = () => {
        this.isVisible = !this.isVisible;
        this.notifyVisibilityListeners();
    }
    
    isConsoleVisible = () => this.isVisible;
    
    subscribeVisibility = (listener: VisibilityListener) => {
        this.visibilityListeners.add(listener);
        return () => this.visibilityListeners.delete(listener);
    }
    
    private notifyVisibilityListeners = () => {
        for (const listener of this.visibilityListeners) {
            listener(this.isVisible);
        }
    }
}

export const logService = new LogService();
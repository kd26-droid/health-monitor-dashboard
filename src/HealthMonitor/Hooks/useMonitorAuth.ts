import { useState, useCallback } from 'react';
import {
    setMonitorToken,
    getMonitorToken,
} from '../Services/healthMonitor.service';

interface UseMonitorAuthReturn {
    showTokenPrompt: boolean;
    handle403: () => void;
    handleTokenSubmit: (token: string) => void;
    dismissTokenPrompt: () => void;
}

/**
 * Auth hook for monitor token.
 * Currently inactive — backend has HEALTH_MONITOR_TOKEN unset on dev/prod.
 * Kept for future use: if backend enables token auth, the 403 handler
 * will trigger the token prompt automatically.
 */
export function useMonitorAuth(): UseMonitorAuthReturn {
    const [showTokenPrompt, setShowTokenPrompt] = useState(false);

    const handle403 = useCallback(() => {
        setShowTokenPrompt(true);
    }, []);

    const handleTokenSubmit = useCallback((token: string) => {
        setMonitorToken(token);
        setShowTokenPrompt(false);
    }, []);

    const dismissTokenPrompt = useCallback(() => {
        if (getMonitorToken()) {
            setShowTokenPrompt(false);
        }
    }, []);

    return {
        showTokenPrompt,
        handle403,
        handleTokenSubmit,
        dismissTokenPrompt,
    };
}

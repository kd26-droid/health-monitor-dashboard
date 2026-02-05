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
        // Only dismiss if we already have a token stored
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

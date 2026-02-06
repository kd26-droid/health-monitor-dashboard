import { useState, useEffect, useRef, useCallback } from 'react';
import { IErrorsResponse } from '../Interfaces/healthMonitor.types';
import { fetchErrors } from '../Services/healthMonitor.service';
import { POLL_INTERVAL_HEALTH } from '../Constants/healthMonitor.constants';

interface UseErrorsPollingResult {
    errorsData: IErrorsResponse | null;
    isLoading: boolean;
    windowMinutes: number;
    setWindowMinutes: (minutes: number) => void;
}

export function useErrorsPolling(handle403: () => void): UseErrorsPollingResult {
    const [errorsData, setErrorsData] = useState<IErrorsResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [windowMinutes, setWindowMinutes] = useState(5);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const poll = useCallback(async () => {
        try {
            setIsLoading(true);
            const data = await fetchErrors(windowMinutes);
            setErrorsData(data);
        } catch (err: any) {
            if (err?.response?.status === 403) {
                handle403();
            }
            // Keep last data on error
        } finally {
            setIsLoading(false);
        }
    }, [windowMinutes, handle403]);

    useEffect(() => {
        poll(); // Initial fetch
        intervalRef.current = setInterval(poll, POLL_INTERVAL_HEALTH);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [poll]);

    return {
        errorsData,
        isLoading,
        windowMinutes,
        setWindowMinutes,
    };
}

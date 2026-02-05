import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'react-toastify';
import {
    IHealthResponse,
    IDbResponse,
    ISystemResponse,
} from '../Interfaces/healthMonitor.types';
import {
    fetchHealth,
    fetchDb,
    fetchSystem,
} from '../Services/healthMonitor.service';
import { POLL_INTERVAL_HEALTH } from '../Constants/healthMonitor.constants';

interface UseHealthPollingReturn {
    healthData: IHealthResponse | null;
    dbData: IDbResponse | null;
    systemData: ISystemResponse | null;
    lastUpdated: Date | null;
    isConnected: boolean;
}

export function useHealthPolling(
    on403: () => void
): UseHealthPollingReturn {
    const [healthData, setHealthData] = useState<IHealthResponse | null>(null);
    const [dbData, setDbData] = useState<IDbResponse | null>(null);
    const [systemData, setSystemData] = useState<ISystemResponse | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const mountedRef = useRef(true);

    const poll = useCallback(async () => {
        try {
            const [health, db, system] = await Promise.all([
                fetchHealth(),
                fetchDb(),
                fetchSystem(),
            ]);

            if (!mountedRef.current) return;

            setHealthData(health);
            setDbData(db);
            setSystemData(system);
            setLastUpdated(new Date());
            setIsConnected(true);
        } catch (err: any) {
            if (!mountedRef.current) return;

            if (err?.response?.status === 403) {
                on403();
                return;
            }

            setIsConnected(false);
            toast.error('Failed to fetch health data. Retrying...', {
                toastId: 'health-poll-error',
                autoClose: 3000,
            });
        }
    }, [on403]);

    useEffect(() => {
        mountedRef.current = true;

        // Initial fetch
        poll();

        // Poll every 10s
        const intervalId = setInterval(poll, POLL_INTERVAL_HEALTH);

        return () => {
            mountedRef.current = false;
            clearInterval(intervalId);
        };
    }, [poll]);

    return {
        healthData,
        dbData,
        systemData,
        lastUpdated,
        isConnected,
    };
}

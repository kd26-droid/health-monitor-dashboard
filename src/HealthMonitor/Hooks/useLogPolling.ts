import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'react-toastify';
import {
    ILogEntry,
    IServerFilters,
} from '../Interfaces/healthMonitor.types';
import { fetchLogs } from '../Services/healthMonitor.service';
import {
    POLL_INTERVAL_LOGS,
    MAX_ENTRIES,
    LOG_FETCH_LIMIT,
} from '../Constants/healthMonitor.constants';

interface UseLogPollingReturn {
    entries: ILogEntry[];
    isFirstLoad: boolean;
    isLive: boolean;
    isLoading: boolean;
    totalInBuffer: number;
    newEntrySeqs: Set<number>;
    source: 'buffer' | 'database';
    toggleLive: () => void;
    clearEntries: () => void;
}

interface HistoricalParams {
    from_ts: string;
    to_ts: string;
}

export function useLogPolling(
    serverFilters: IServerFilters,
    on403: () => void,
    historicalParams?: HistoricalParams
): UseLogPollingReturn {
    const [entries, setEntries] = useState<ILogEntry[]>([]);
    const [isFirstLoad, setIsFirstLoad] = useState(true);
    const [isLive, setIsLive] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [totalInBuffer, setTotalInBuffer] = useState(0);
    const [newEntrySeqs, setNewEntrySeqs] = useState<Set<number>>(new Set());
    const [source, setSource] = useState<'buffer' | 'database'>('buffer');

    const isHistoricalMode = !!(historicalParams?.from_ts);

    const cursorRef = useRef(0);
    const generationRef = useRef(0);
    const mountedRef = useRef(true);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ── Core fetch function for LIVE mode ──
    const pollOnce = useCallback(
        async (generation: number, resetCursor: boolean) => {
            if (isHistoricalMode) return; // Don't poll in historical mode

            try {
                const since = resetCursor ? 0 : cursorRef.current;

                const data = await fetchLogs({
                    since,
                    limit: LOG_FETCH_LIMIT,
                    event: serverFilters.event || undefined,
                    method: serverFilters.method || undefined,
                    search: serverFilters.search || undefined,
                });

                if (!mountedRef.current) return;
                // Discard stale response
                if (generation !== generationRef.current) return;

                const newEntries = data.entries;
                cursorRef.current = data.cursor ?? 0;
                setTotalInBuffer(data.total_in_buffer ?? 0);
                setSource(data.source || 'buffer');

                if (resetCursor) {
                    // Full replace on filter change
                    setEntries(newEntries.slice(0, MAX_ENTRIES));
                } else if (newEntries.length > 0) {
                    // Prepend new entries
                    setEntries((prev) => {
                        const combined = [...newEntries, ...prev];
                        return combined.slice(0, MAX_ENTRIES);
                    });

                    // Track new seqs for highlight animation
                    const seqs = new Set(newEntries.map((e) => e._seq));
                    setNewEntrySeqs(seqs);

                    // Clear highlights after 500ms
                    if (highlightTimerRef.current) {
                        clearTimeout(highlightTimerRef.current);
                    }
                    highlightTimerRef.current = setTimeout(() => {
                        if (mountedRef.current) {
                            setNewEntrySeqs(new Set());
                        }
                    }, 500);
                }

                setIsFirstLoad(false);
                setIsLoading(false);
            } catch (err: any) {
                if (!mountedRef.current) return;
                if (generation !== generationRef.current) return;

                if (err?.response?.status === 403) {
                    on403();
                    return;
                }

                setIsLoading(false);
                toast.error('Failed to fetch log data. Retrying...', {
                    toastId: 'log-poll-error',
                    autoClose: 3000,
                });
            }
        },
        [serverFilters, on403, isHistoricalMode]
    );

    // ── Fetch function for HISTORICAL mode ──
    const fetchHistorical = useCallback(
        async (generation: number) => {
            if (!historicalParams?.from_ts) return;

            try {
                setIsLoading(true);

                const data = await fetchLogs({
                    from_ts: historicalParams.from_ts,
                    to_ts: historicalParams.to_ts || undefined,
                    limit: 500,
                    event: serverFilters.event || undefined,
                    method: serverFilters.method || undefined,
                    search: serverFilters.search || undefined,
                });

                if (!mountedRef.current) return;
                if (generation !== generationRef.current) return;

                setEntries(data.entries);
                setSource(data.source || 'database');
                setTotalInBuffer(data.count ?? data.entries.length);
                setIsFirstLoad(false);
                setIsLoading(false);
            } catch (err: any) {
                if (!mountedRef.current) return;
                if (generation !== generationRef.current) return;

                if (err?.response?.status === 403) {
                    on403();
                    return;
                }

                setIsLoading(false);
                toast.error('Failed to fetch historical logs.', {
                    toastId: 'historical-fetch-error',
                    autoClose: 3000,
                });
            }
        },
        [historicalParams, serverFilters, on403]
    );

    // ── React to mode/filter changes ──
    useEffect(() => {
        generationRef.current += 1;
        const gen = generationRef.current;
        cursorRef.current = 0;
        setIsLoading(true);

        if (isHistoricalMode) {
            fetchHistorical(gen);
        } else {
            pollOnce(gen, true);
        }
    }, [serverFilters, historicalParams?.from_ts, historicalParams?.to_ts]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Periodic polling (only in live mode) ──
    useEffect(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        if (isLive && !isHistoricalMode) {
            intervalRef.current = setInterval(() => {
                const gen = generationRef.current;
                pollOnce(gen, false);
            }, POLL_INTERVAL_LOGS);
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [isLive, isHistoricalMode, pollOnce]);

    // ── Cleanup on unmount ──
    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
            if (highlightTimerRef.current) {
                clearTimeout(highlightTimerRef.current);
            }
        };
    }, []);

    // ── Actions ──
    const toggleLive = useCallback(() => {
        setIsLive((prev) => !prev);
    }, []);

    const clearEntries = useCallback(() => {
        setEntries([]);
        cursorRef.current = 0;
        generationRef.current += 1;
        setTotalInBuffer(0);
        setNewEntrySeqs(new Set());
    }, []);

    return {
        entries,
        isFirstLoad,
        isLive: isLive && !isHistoricalMode, // Force false in historical mode
        isLoading,
        totalInBuffer,
        newEntrySeqs,
        source,
        toggleLive,
        clearEntries,
    };
}

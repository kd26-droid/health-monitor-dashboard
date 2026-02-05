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
    toggleLive: () => void;
    clearEntries: () => void;
}

export function useLogPolling(
    serverFilters: IServerFilters,
    on403: () => void
): UseLogPollingReturn {
    const [entries, setEntries] = useState<ILogEntry[]>([]);
    const [isFirstLoad, setIsFirstLoad] = useState(true);
    const [isLive, setIsLive] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [totalInBuffer, setTotalInBuffer] = useState(0);
    const [newEntrySeqs, setNewEntrySeqs] = useState<Set<number>>(new Set());

    const cursorRef = useRef(0);
    const generationRef = useRef(0);
    const mountedRef = useRef(true);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ── Core fetch function ──
    const pollOnce = useCallback(
        async (generation: number, resetCursor: boolean) => {
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
                cursorRef.current = data.cursor;
                setTotalInBuffer(data.total_in_buffer);

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
        [serverFilters, on403]
    );

    // ── React to filter changes (generation counter pattern) ──
    useEffect(() => {
        generationRef.current += 1;
        const gen = generationRef.current;
        cursorRef.current = 0;
        setIsLoading(true);

        // Fetch immediately with new filters (don't clear entries yet)
        pollOnce(gen, true);
    }, [serverFilters]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Periodic polling ──
    useEffect(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        if (isLive) {
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
    }, [isLive, pollOnce]);

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
        isLive,
        isLoading,
        totalInBuffer,
        newEntrySeqs,
        toggleLive,
        clearEntries,
    };
}

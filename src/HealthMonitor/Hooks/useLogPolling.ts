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

// Sort entries newest first (descending by timestamp)
function sortDesc(entries: ILogEntry[]): ILogEntry[] {
    return [...entries].sort((a, b) => {
        if (a.ts > b.ts) return -1;
        if (a.ts < b.ts) return 1;
        return (b._seq || 0) - (a._seq || 0);
    });
}

interface UseLogPollingReturn {
    entries: ILogEntry[];
    isFirstLoad: boolean;
    isLive: boolean;
    isLoading: boolean;
    totalInBuffer: number;
    newEntrySeqs: Set<number>;
    source: 'buffer' | 'database';
    // Pagination (historical mode)
    totalCount: number;
    hasMore: boolean;
    loadMore: () => void;
    toggleLive: () => void;
    clearEntries: () => void;
}

interface HistoricalParams {
    from_ts: string;
    to_ts: string;
}

export function useLogPolling(
    serverFilters: IServerFilters,
    on403?: () => void,
    historicalParams?: HistoricalParams,
    sortBy?: string
): UseLogPollingReturn {
    const [entries, setEntries] = useState<ILogEntry[]>([]);
    const [isFirstLoad, setIsFirstLoad] = useState(true);
    const [isLive, setIsLive] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [totalInBuffer, setTotalInBuffer] = useState(0);
    const [newEntrySeqs, setNewEntrySeqs] = useState<Set<number>>(new Set());
    const [source, setSource] = useState<'buffer' | 'database'>('buffer');
    const [totalCount, setTotalCount] = useState(0);
    const [hasMore, setHasMore] = useState(false);

    const isHistoricalMode = !!(historicalParams?.from_ts);

    // Keep refs so callbacks always see the current value
    const isHistoricalRef = useRef(isHistoricalMode);
    isHistoricalRef.current = isHistoricalMode;

    const historicalParamsRef = useRef<HistoricalParams | undefined>(historicalParams);
    historicalParamsRef.current = historicalParams;

    const sortByRef = useRef<string | undefined>(sortBy);
    sortByRef.current = sortBy;

    const nextOffsetRef = useRef<number | null>(null);
    const cursorRef = useRef(0);
    const generationRef = useRef(0);
    const mountedRef = useRef(true);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Keep serverFilters in a ref so the polling interval always uses current filters
    const serverFiltersRef = useRef(serverFilters);
    serverFiltersRef.current = serverFilters;

    // ── Core fetch function for LIVE mode ──
    const pollOnce = useCallback(
        async (generation: number, resetCursor: boolean) => {
            // Always check the ref, not the closure
            if (isHistoricalRef.current) return;

            try {
                const since = resetCursor ? 0 : cursorRef.current;
                const filters = serverFiltersRef.current;

                const data = await fetchLogs({
                    since,
                    limit: LOG_FETCH_LIMIT,
                    event: filters.event || undefined,
                    method: filters.method || undefined,
                    search: filters.search || undefined,
                    api_source: filters.api_source || undefined,
                    module: filters.module || undefined,
                });

                if (!mountedRef.current) return;
                if (generation !== generationRef.current) return;
                // Double-check we didn't switch to historical while the request was in flight
                if (isHistoricalRef.current) return;

                const newEntries = data.entries;
                cursorRef.current = data.cursor ?? 0;
                setTotalInBuffer(data.total_in_buffer ?? 0);
                setSource(data.source || 'buffer');

                if (resetCursor) {
                    setEntries(sortDesc(newEntries).slice(0, MAX_ENTRIES));
                } else if (newEntries.length > 0) {
                    setEntries((prev) => {
                        const combined = sortDesc([...newEntries, ...prev]);
                        return combined.slice(0, MAX_ENTRIES);
                    });

                    const seqs = new Set(newEntries.map((e) => e._seq));
                    setNewEntrySeqs(seqs);

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

                if (err?.response?.status === 403 && on403) {
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
        [on403]
    );

    // ── Fetch function for HISTORICAL mode (first page) ──
    const fetchHistorical = useCallback(
        async (generation: number, params: HistoricalParams) => {
            if (!params.from_ts) return;

            try {
                setIsLoading(true);
                const filters = serverFiltersRef.current;

                const data = await fetchLogs({
                    from_ts: params.from_ts,
                    to_ts: params.to_ts || undefined,
                    limit: 500,
                    offset: 0,
                    event: filters.event || undefined,
                    method: filters.method || undefined,
                    search: filters.search || undefined,
                    api_source: filters.api_source || undefined,
                    module: filters.module || undefined,
                    sort_by: sortByRef.current || undefined,
                });

                if (!mountedRef.current) return;
                if (generation !== generationRef.current) return;

                setEntries(sortDesc(data.entries));
                setSource(data.source || 'database');
                setTotalCount(data.total_count ?? data.count ?? data.entries.length);
                setHasMore(data.has_more ?? false);
                nextOffsetRef.current = data.next_offset ?? null;
                setTotalInBuffer(data.total_count ?? data.count ?? data.entries.length);
                setIsFirstLoad(false);
                setIsLoading(false);
            } catch (err: any) {
                if (!mountedRef.current) return;
                if (generation !== generationRef.current) return;

                if (err?.response?.status === 403 && on403) {
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
        [on403]
    );

    // ── Load next page of historical results ──
    const loadMore = useCallback(async () => {
        if (!isHistoricalRef.current) return;
        if (nextOffsetRef.current === null) return;

        const params = historicalParamsRef.current;
        if (!params?.from_ts) return;

        // Use current generation — if filters change while in-flight, the result is discarded
        const gen = generationRef.current;
        setIsLoading(true);

        try {
            const filters = serverFiltersRef.current;

            const data = await fetchLogs({
                from_ts: params.from_ts,
                to_ts: params.to_ts || undefined,
                limit: 500,
                offset: nextOffsetRef.current,
                event: filters.event || undefined,
                method: filters.method || undefined,
                search: filters.search || undefined,
                api_source: filters.api_source || undefined,
                module: filters.module || undefined,
                sort_by: sortByRef.current || undefined,
            });

            if (!mountedRef.current) return;
            if (gen !== generationRef.current) return;

            // Append new (older) entries after existing ones
            setEntries((prev) => [...prev, ...sortDesc(data.entries)]);
            setHasMore(data.has_more ?? false);
            nextOffsetRef.current = data.next_offset ?? null;
            setTotalCount(data.total_count ?? 0);
            setIsLoading(false);
        } catch (err: any) {
            if (!mountedRef.current) return;
            if (gen !== generationRef.current) return;

            setIsLoading(false);
            toast.error('Failed to load more logs.', {
                toastId: 'load-more-error',
                autoClose: 3000,
            });
        }
    }, []);

    // ── React to mode/filter changes ──
    useEffect(() => {
        generationRef.current += 1;
        const gen = generationRef.current;
        cursorRef.current = 0;
        nextOffsetRef.current = null;
        setHasMore(false);
        setTotalCount(0);
        setIsLoading(true);

        if (isHistoricalMode && historicalParams) {
            fetchHistorical(gen, historicalParams);
        } else if (!isHistoricalMode) {
            pollOnce(gen, true);
        }
    }, [serverFilters, isHistoricalMode, historicalParams?.from_ts, historicalParams?.to_ts, sortBy, fetchHistorical, pollOnce]); // eslint-disable-line react-hooks/exhaustive-deps

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
        nextOffsetRef.current = null;
        setTotalInBuffer(0);
        setTotalCount(0);
        setHasMore(false);
        setNewEntrySeqs(new Set());
    }, []);

    return {
        entries,
        isFirstLoad,
        isLive: isLive && !isHistoricalMode,
        isLoading,
        totalInBuffer,
        newEntrySeqs,
        source,
        totalCount,
        hasMore,
        loadMore,
        toggleLive,
        clearEntries,
    };
}

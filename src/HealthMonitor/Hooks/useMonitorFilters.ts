import { useState, useMemo, useCallback, useEffect } from 'react';
import { debounce } from 'lodash';
import {
    TEventType,
    THttpMethod,
    IServerFilters,
} from '../Interfaces/healthMonitor.types';

type TApiSource = 'internal' | 'open_api' | '';
import { SEARCH_DEBOUNCE_MS } from '../Constants/healthMonitor.constants';

// Convert ISO string to datetime-local input format (YYYY-MM-DDTHH:MM)
function isoToDatetimeLocal(iso: string): string {
    if (!iso) return '';
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

interface UseMonitorFiltersReturn {
    // Raw input values
    search: string;
    event: TEventType | '';
    method: THttpMethod | '';
    fromTs: string;
    toTs: string;

    // Historical mode (when fromTs is set, query DB instead of live buffer)
    isHistoricalMode: boolean;
    historicalFromTs: string; // ISO string for server query
    historicalToTs: string;   // ISO string for server query

    // Server-side filters (triggers re-fetch when changed)
    serverFilters: IServerFilters;

    // Setters
    setSearch: (value: string) => void;
    setEvent: (value: TEventType | '') => void;
    setMethod: (value: THttpMethod | '') => void;
    setApiSource: (value: TApiSource) => void;
    setModule: (value: string) => void;
    sortBy: string;
    setSortBy: (value: string) => void;
    setFromTs: (value: string) => void;
    setToTs: (value: string) => void;
    resetFilters: () => void;
    enterHistoricalMode: (from: string, to: string) => void;
    exitHistoricalMode: () => void;
}

export function useMonitorFilters(): UseMonitorFiltersReturn {
    const [search, setSearchRaw] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [event, setEvent] = useState<TEventType | ''>('');
    const [method, setMethod] = useState<THttpMethod | ''>('');
    const [apiSource, setApiSource] = useState<TApiSource>('');
    const [module, setModule] = useState('');
    const [sortBy, setSortBy] = useState('-timestamp');

    // On Lambda (non-localhost), default to historical mode (today, midnight to now)
    const isLambda = typeof window !== 'undefined' && !window.location.hostname.includes('localhost');

    // Compute initial date values for Lambda — today from midnight
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const initialFromIso = isLambda ? todayStart.toISOString() : '';
    const initialToIso = isLambda ? new Date().toISOString() : '';

    // The visible datetime-local inputs — pre-fill on Lambda
    const [fromTs, setFromTs] = useState(() => isoToDatetimeLocal(initialFromIso));
    const [toTs, setToTs] = useState(() => isoToDatetimeLocal(initialToIso));

    // Historical mode state (ISO strings sent to server)
    const [historicalFromTs, setHistoricalFromTs] = useState(initialFromIso);
    const [historicalToTs, setHistoricalToTs] = useState(initialToIso);
    const isHistoricalMode = historicalFromTs !== '';

    // Debounced search updater
    const debouncedSetSearch = useMemo(
        () =>
            debounce((text: string) => {
                setDebouncedSearch(text);
            }, SEARCH_DEBOUNCE_MS),
        []
    );

    // Cleanup debounce on unmount
    useEffect(() => {
        return () => {
            debouncedSetSearch.cancel();
        };
    }, [debouncedSetSearch]);

    const setSearch = useCallback(
        (value: string) => {
            setSearchRaw(value);
            debouncedSetSearch(value);
        },
        [debouncedSetSearch]
    );

    // Server filters — these trigger cursor reset + re-fetch in useLogPolling
    const serverFilters: IServerFilters = useMemo(
        () => ({
            search: debouncedSearch,
            event,
            method,
            api_source: apiSource,
            module,
        }),
        [debouncedSearch, event, method, apiSource, module]
    );

    const resetFilters = useCallback(() => {
        setSearchRaw('');
        setDebouncedSearch('');
        debouncedSetSearch.cancel();
        setEvent('');
        setMethod('');
        setApiSource('');
        setModule('');
        setSortBy('-timestamp');
        setFromTs('');
        setToTs('');
        setHistoricalFromTs('');
        setHistoricalToTs('');
    }, [debouncedSetSearch]);

    const enterHistoricalMode = useCallback((from: string, to: string) => {
        // Convert datetime-local format to ISO string
        const fromIso = from ? new Date(from).toISOString() : '';
        const toIso = to ? new Date(to).toISOString() : new Date().toISOString();
        setHistoricalFromTs(fromIso);
        setHistoricalToTs(toIso);
    }, []);

    const exitHistoricalMode = useCallback(() => {
        setHistoricalFromTs('');
        setHistoricalToTs('');
    }, []);

    return {
        search,
        event,
        method,
        fromTs,
        toTs,
        isHistoricalMode,
        historicalFromTs,
        historicalToTs,
        serverFilters,
        setSearch,
        setEvent,
        setMethod,
        setApiSource,
        setModule,
        sortBy,
        setSortBy,
        setFromTs,
        setToTs,
        resetFilters,
        enterHistoricalMode,
        exitHistoricalMode,
    };
}

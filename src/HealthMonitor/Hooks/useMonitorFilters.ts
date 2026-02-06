import { useState, useMemo, useCallback, useEffect } from 'react';
import { debounce } from 'lodash';
import {
    TEventType,
    THttpMethod,
    IServerFilters,
} from '../Interfaces/healthMonitor.types';
import { SEARCH_DEBOUNCE_MS } from '../Constants/healthMonitor.constants';

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
    const [fromTs, setFromTs] = useState('');
    const [toTs, setToTs] = useState('');

    // Historical mode state
    const [historicalFromTs, setHistoricalFromTs] = useState('');
    const [historicalToTs, setHistoricalToTs] = useState('');
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
        }),
        [debouncedSearch, event, method]
    );

    const resetFilters = useCallback(() => {
        setSearchRaw('');
        setDebouncedSearch('');
        debouncedSetSearch.cancel();
        setEvent('');
        setMethod('');
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
        setFromTs,
        setToTs,
        resetFilters,
        enterHistoricalMode,
        exitHistoricalMode,
    };
}

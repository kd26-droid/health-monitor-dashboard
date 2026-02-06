import React, { useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import {
    ILogEntry,
    IMetrics,
} from '../Interfaces/healthMonitor.types';
import { useMonitorAuth } from '../Hooks/useMonitorAuth';
import { useMonitorFilters } from '../Hooks/useMonitorFilters';
import { useHealthPolling } from '../Hooks/useHealthPolling';
import { useLogPolling } from '../Hooks/useLogPolling';
import HealthBanner from '../Components/HealthBanner';
import MetricsCards from '../Components/MetricsCards';
import Toolbar from '../Components/Toolbar';
import LogTable from '../Components/LogTable';
import TokenPrompt from '../Components/TokenPrompt';
import EmptyState from '../Components/EmptyState';
import DbDiagnosticsPanel from '../Components/DbDiagnosticsPanel';
import ErrorBreakdownPanel from '../Components/ErrorBreakdownPanel';
import '../styles/healthMonitor.scss';

// ── Helpers ──

function applyTimestampFilter(
    entries: ILogEntry[],
    fromTs: string,
    toTs: string
): ILogEntry[] {
    if (!fromTs && !toTs) return entries;

    return entries.filter((e) => {
        const ts = new Date(e.ts).getTime();
        if (fromTs) {
            const from = new Date(fromTs).getTime();
            if (ts < from) return false;
        }
        if (toTs) {
            const to = new Date(toTs).getTime();
            if (ts > to) return false;
        }
        return true;
    });
}

function computeMetrics(entries: ILogEntry[]): IMetrics {
    const total = entries.length;
    if (total === 0) {
        return {
            total: 0,
            errors: 0,
            errorRate: 0,
            slow: 0,
            avgTime: 0,
            avgQueries: 0,
        };
    }

    let errors = 0;
    let slow = 0;
    let sumTime = 0;
    let sumQueries = 0;

    for (const e of entries) {
        if (e.event.includes('error')) errors++;
        if (e.event.includes('slow')) slow++;
        sumTime += e.elapsed_s;
        sumQueries += e.db_queries;
    }

    return {
        total,
        errors,
        errorRate: (errors / total) * 100,
        slow,
        avgTime: sumTime / total,
        avgQueries: sumQueries / total,
    };
}

// ── Min-width check ──

function useMinWidthCheck(minWidth: number): boolean {
    const [isTooNarrow, setIsTooNarrow] = React.useState(
        window.innerWidth < minWidth
    );

    React.useEffect(() => {
        const handleResize = () => {
            setIsTooNarrow(window.innerWidth < minWidth);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [minWidth]);

    return isTooNarrow;
}

// ── Main Page ──

const HealthMonitorPage: React.FC = () => {
    const isTooNarrow = useMinWidthCheck(1440);
    const auth = useMonitorAuth();
    const filters = useMonitorFilters();
    const health = useHealthPolling(auth.handle403);

    // Historical mode params - when set, queries DB instead of live buffer
    const historicalParams = filters.isHistoricalMode
        ? { from_ts: filters.historicalFromTs, to_ts: filters.historicalToTs }
        : undefined;
    const logs = useLogPolling(filters.serverFilters, auth.handle403, historicalParams);

    // Step 1: Hide OPTIONS unless explicitly selected
    const optionsFiltered = useMemo(() => {
        if (filters.method === 'OPTIONS') return logs.entries;
        return logs.entries.filter((e) => e.method !== 'OPTIONS');
    }, [logs.entries, filters.method]);

    // Step 2: Client-side request_payload search supplement
    // Server search covers view, path, task, error, slowest_query but NOT request_payload.
    // When a search term is active, additionally filter loaded entries to also match
    // request_payload client-side. This is useful when browsing entries from polling —
    // the user can search by entity ID or module name found in the payload.
    const searchFiltered = useMemo(() => {
        const term = filters.search.trim().toLowerCase();
        if (!term) return optionsFiltered;

        // Keep entries where request_payload contains the search term.
        // Entries that matched server-side fields are already in the buffer;
        // this additionally narrows to those also relevant by payload content.
        return optionsFiltered.filter((e) => {
            // Check request_payload (client-side supplement)
            if (e.request_payload && e.request_payload.toLowerCase().includes(term)) {
                return true;
            }
            // Check other visible fields client-side as a safety net
            const viewOrTask = (e.view || e.task || '').toLowerCase();
            const path = (e.path || '').toLowerCase();
            const error = (e.error || '').toLowerCase();
            if (viewOrTask.includes(term) || path.includes(term) || error.includes(term)) {
                return true;
            }
            return false;
        });
    }, [optionsFiltered, filters.search]);

    // Step 3: Compute metrics from OPTIONS-filtered + search-filtered entries (before timestamp filter)
    const metrics = useMemo(() => computeMetrics(searchFiltered), [searchFiltered]);

    // Step 4: Apply timestamp filter for display
    const filteredEntries = useMemo(
        () => applyTimestampFilter(searchFiltered, filters.fromTs, filters.toTs),
        [searchFiltered, filters.fromTs, filters.toTs]
    );

    // Min-width message
    if (isTooNarrow) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100vh',
                    backgroundColor: '#F9FAFB',
                    p: 4,
                }}
            >
                <Typography variant="body1" sx={{ color: 'text.secondary', textAlign: 'center' }}>
                    This dashboard is designed for screens 1440px or wider.
                    <br />
                    Current width: {window.innerWidth}px
                </Typography>
            </Box>
        );
    }

    return (
        <Box
            className="health-monitor"
            sx={{
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: '#F3F4F6',
                overflow: 'hidden',
            }}
        >
            <HealthBanner
                healthData={health.healthData}
                dbData={health.dbData}
                systemData={health.systemData}
                lastUpdated={health.lastUpdated}
                isConnected={health.isConnected}
            />

            <Box sx={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <MetricsCards
                    metrics={metrics}
                    dbData={health.dbData}
                    totalInBuffer={logs.totalInBuffer}
                />

                <Toolbar
                    search={filters.search}
                    event={filters.event}
                    method={filters.method}
                    fromTs={filters.fromTs}
                    toTs={filters.toTs}
                    entryCount={filteredEntries.length}
                    isLive={logs.isLive}
                    isLoading={logs.isLoading}
                    source={logs.source}
                    isHistoricalMode={filters.isHistoricalMode}
                    onSearchChange={filters.setSearch}
                    onEventChange={filters.setEvent}
                    onMethodChange={filters.setMethod}
                    onFromTsChange={filters.setFromTs}
                    onToTsChange={filters.setToTs}
                    onToggleLive={logs.toggleLive}
                    onClear={logs.clearEntries}
                    onEnterHistorical={filters.enterHistoricalMode}
                    onExitHistorical={filters.exitHistoricalMode}
                />

                {/* DB Diagnostics only shown in non-production environments */}
                {process.env.REACT_APP_ENV !== 'production' &&
                    process.env.REACT_APP_ENV !== 'newdbtest1' && (
                        <DbDiagnosticsPanel dbData={health.dbData} />
                    )}

                {/* Error Breakdown Panel */}
                <ErrorBreakdownPanel isConnected={health.isConnected} />

                {/* Log table takes remaining space */}
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                    {!health.isConnected && logs.isFirstLoad ? (
                        <EmptyState
                            variant="disconnected"
                            backendUrl={
                                process.env.REACT_APP_MONITOR_URL ||
                                process.env.REACT_APP_API_URL
                            }
                        />
                    ) : (
                        <LogTable
                            entries={filteredEntries}
                            newEntrySeqs={logs.newEntrySeqs}
                            isLoading={logs.isLoading}
                            isFirstLoad={logs.isFirstLoad}
                            maxConnections={health.dbData?.max_connections}
                        />
                    )}
                </Box>
            </Box>

            {/* Token prompt overlay */}
            {auth.showTokenPrompt && (
                <TokenPrompt onSubmit={auth.handleTokenSubmit} />
            )}
        </Box>
    );
};

export default HealthMonitorPage;

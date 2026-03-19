import React, { useMemo, useState } from 'react';
import { Box } from '@mui/material';
import {
    ILogEntry,
    IMetrics,
    IColumnFilters,
    EMPTY_COLUMN_FILTERS,
} from '../Interfaces/healthMonitor.types';
import { useMonitorAuth } from '../Hooks/useMonitorAuth';
import { useMonitorFilters } from '../Hooks/useMonitorFilters';
import { useHealthPolling } from '../Hooks/useHealthPolling';
import { useLogPolling } from '../Hooks/useLogPolling';
import { useNameResolver } from '../Hooks/useNameResolver';
import HealthBanner from '../Components/HealthBanner';
import MetricsCards from '../Components/MetricsCards';
import Toolbar from '../Components/Toolbar';
import LogTable from '../Components/LogTable';
import TokenPrompt from '../Components/TokenPrompt';
import EmptyState from '../Components/EmptyState';
import DbDiagnosticsPanel from '../Components/DbDiagnosticsPanel';
import ErrorBreakdownPanel from '../Components/ErrorBreakdownPanel';
import CleanupPanel from '../Components/CleanupPanel';
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

function applyColumnFilters(entries: ILogEntry[], f: IColumnFilters): ILogEntry[] {
    const hasAny = Object.values(f).some((v) => v !== '');
    if (!hasAny) return entries;

    return entries.filter((e) => {
        if (f.apiTask) {
            const val = (e.view || e.task || '').toLowerCase();
            if (!val.includes(f.apiTask.toLowerCase())) return false;
        }
        if (f.path) {
            const val = (e.path || '').toLowerCase();
            if (!val.includes(f.path.toLowerCase())) return false;
        }
        if (f.httpStatus) {
            if (e.status == null) return false;
            if (!String(e.status).startsWith(f.httpStatus)) return false;
        }
        if (f.minTotalTime) {
            const min = parseFloat(f.minTotalTime);
            if (!isNaN(min) && e.elapsed_s < min) return false;
        }
        if (f.minDbTime) {
            const min = parseFloat(f.minDbTime);
            if (!isNaN(min) && e.db_time_s < min) return false;
        }
        if (f.minQueries) {
            const min = parseInt(f.minQueries, 10);
            if (!isNaN(min) && e.db_queries < min) return false;
        }
        if (f.minMemory) {
            const min = parseFloat(f.minMemory);
            if (!isNaN(min) && Math.abs(e.mem_delta_mb) < min) return false;
        }
        if (f.minSize) {
            const min = parseFloat(f.minSize) * 1024; // KB to bytes
            if (!isNaN(min) && (e.response_bytes || 0) < min) return false;
        }
        return true;
    });
}

// ── Main Page ──

const HealthMonitorPage: React.FC = () => {
    const auth = useMonitorAuth();
    const [columnFilters, setColumnFilters] = useState<IColumnFilters>(EMPTY_COLUMN_FILTERS);
    const filters = useMonitorFilters();
    const health = useHealthPolling(auth.handle403);

    // Historical mode params - when set, queries DB instead of live buffer
    const historicalParams = filters.isHistoricalMode
        ? { from_ts: filters.historicalFromTs, to_ts: filters.historicalToTs }
        : undefined;
    const logs = useLogPolling(filters.serverFilters, auth.handle403, historicalParams, filters.sortBy);
    const { userMap, enterpriseMap } = useNameResolver(logs.entries);

    // Step 1: Hide OPTIONS unless explicitly selected
    const optionsFiltered = useMemo(() => {
        if (filters.method === 'OPTIONS') return logs.entries;
        return logs.entries.filter((e) => e.method !== 'OPTIONS');
    }, [logs.entries, filters.method]);

    // Step 2: Client-side request_payload search supplement
    const searchFiltered = useMemo(() => {
        const term = filters.search.trim().toLowerCase();
        if (!term) return optionsFiltered;

        return optionsFiltered.filter((e) => {
            if (e.request_payload && e.request_payload.toLowerCase().includes(term)) {
                return true;
            }
            const viewOrTask = (e.view || e.task || '').toLowerCase();
            const path = (e.path || '').toLowerCase();
            const error = (e.error || '').toLowerCase();
            if (viewOrTask.includes(term) || path.includes(term) || error.includes(term)) {
                return true;
            }
            return false;
        });
    }, [optionsFiltered, filters.search]);

    // Step 3: Compute metrics
    const metrics = useMemo(() => computeMetrics(searchFiltered), [searchFiltered]);

    // Step 4: Apply column filters
    const columnFiltered = useMemo(
        () => applyColumnFilters(searchFiltered, columnFilters),
        [searchFiltered, columnFilters]
    );

    // Step 5: Apply timestamp filter for display
    const filteredEntries = useMemo(
        () => applyTimestampFilter(columnFiltered, filters.fromTs, filters.toTs),
        [columnFiltered, filters.fromTs, filters.toTs]
    );

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
                    apiSource={filters.serverFilters.api_source}
                    fromTs={filters.fromTs}
                    toTs={filters.toTs}
                    entryCount={filteredEntries.length}
                    isLive={logs.isLive}
                    isLoading={logs.isLoading}
                    source={logs.source}
                    isHistoricalMode={filters.isHistoricalMode}
                    totalCount={logs.totalCount}
                    hasMore={logs.hasMore}
                    onSearchChange={filters.setSearch}
                    onEventChange={filters.setEvent}
                    onMethodChange={filters.setMethod}
                    module={filters.serverFilters.module}
                    onModuleChange={filters.setModule}
                    sortBy={filters.sortBy}
                    onSortByChange={filters.setSortBy}
                    onApiSourceChange={filters.setApiSource}
                    onFromTsChange={filters.setFromTs}
                    onToTsChange={filters.setToTs}
                    onToggleLive={logs.toggleLive}
                    onClear={logs.clearEntries}
                    onEnterHistorical={filters.enterHistoricalMode}
                    onExitHistorical={filters.exitHistoricalMode}
                    onLoadMore={logs.loadMore}
                />

                {/* DB Diagnostics only shown in non-production environments */}
                {process.env.REACT_APP_ENV !== 'production' &&
                    process.env.REACT_APP_ENV !== 'newdbtest1' && (
                        <DbDiagnosticsPanel dbData={health.dbData} />
                    )}

                {/* Error Breakdown Panel */}
                <ErrorBreakdownPanel isConnected={health.isConnected} />

                {/* Cleanup Panel */}
                <CleanupPanel isConnected={health.isConnected} />

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
                            columnFilters={columnFilters}
                            onColumnFiltersChange={setColumnFilters}
                            userMap={userMap}
                            enterpriseMap={enterpriseMap}
                        />
                    )}
                </Box>
            </Box>

            {/* Token prompt overlay (only shown if backend returns 403) */}
            {auth.showTokenPrompt && (
                <TokenPrompt onSubmit={auth.handleTokenSubmit} />
            )}
        </Box>
    );
};

export default HealthMonitorPage;

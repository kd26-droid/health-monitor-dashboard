import React, { useMemo, useState } from 'react';
import { Box, Typography, Collapse, IconButton } from '@mui/material';
import {
    ILogEntry,
    IMetrics,
    IColumnFilters,
    IUserInfo,
    IEnterpriseInfo,
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
import OomEventsPanel from '../Components/OomEventsPanel';
import MemoryHogsPanel from '../Components/MemoryHogsPanel';
import AsyncTasksPanel from '../Components/AsyncTasksPanel';
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

function applyColumnFilters(
    entries: ILogEntry[],
    f: IColumnFilters,
    userMap: Map<string, IUserInfo>,
    enterpriseMap: Map<string, IEnterpriseInfo>
): ILogEntry[] {
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
        if (f.enterprise) {
            if (!e.enterprise_id) return false;
            const term = f.enterprise.toLowerCase();
            const info = enterpriseMap.get(e.enterprise_id);
            const nameMatch = info?.name?.toLowerCase().includes(term) ?? false;
            const idMatch = e.enterprise_id.toLowerCase().includes(term);
            if (!nameMatch && !idMatch) return false;
        }
        if (f.user) {
            if (!e.user_id) return false;
            const term = f.user.toLowerCase();
            const info = userMap.get(e.user_id);
            const nameMatch = info?.name?.toLowerCase().includes(term) ?? false;
            const emailMatch = info?.email?.toLowerCase().includes(term) ?? false;
            const idMatch = e.user_id.toLowerCase().includes(term);
            if (!nameMatch && !emailMatch && !idMatch) return false;
        }
        if (f.worker) {
            if (!e.worker_id) return false;
            if (!e.worker_id.includes(f.worker)) return false;
        }
        return true;
    });
}

function applySortBy(entries: ILogEntry[], sortBy: string): ILogEntry[] {
    if (!sortBy || sortBy === '-timestamp') return entries;
    const sorted = [...entries];
    const desc = sortBy.startsWith('-');
    const key = desc ? sortBy.slice(1) : sortBy;
    const getVal = (e: ILogEntry): number => {
        switch (key) {
            case 'timestamp': return new Date(e.ts).getTime();
            case 'elapsed_s': return e.elapsed_s;
            case 'db_time_s': return e.db_time_s;
            case 'db_queries': return e.db_queries;
            case 'status_code': return e.status ?? 0;
            case 'mem_delta': return e.mem_delta_mb;
            case 'mem_after': return e.mem_after_mb;
            case 'mem_before': return e.mem_before_mb;
            case 'response_bytes': return e.response_bytes ?? 0;
            default: return 0;
        }
    };
    sorted.sort((a, b) => {
        const diff = getVal(a) - getVal(b);
        return desc ? -diff : diff;
    });
    return sorted;
}

// ── Main Page ──

const HealthMonitorPage: React.FC = () => {
    const auth = useMonitorAuth();
    const [columnFilters, setColumnFilters] = useState<IColumnFilters>(EMPTY_COLUMN_FILTERS);
    // Enterprise scope shared by the Azure-backed forensics panels so the user
    // can focus on one enterprise instead of all traffic mixed together.
    const [scopeEnterpriseId, setScopeEnterpriseId] = useState('');
    // The whole forensics/analysis stack lives behind ONE collapsed bar so the
    // default view stays the live API log, exactly how it used to work.
    const [forensicsOpen, setForensicsOpen] = useState(false);
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
        () => applyColumnFilters(searchFiltered, columnFilters, userMap, enterpriseMap),
        [searchFiltered, columnFilters, userMap, enterpriseMap]
    );

    // Step 5: Apply timestamp filter for display
    const filteredEntries = useMemo(
        () => applyTimestampFilter(columnFiltered, filters.fromTs, filters.toTs),
        [columnFiltered, filters.fromTs, filters.toTs]
    );

    // Step 6: Client-side sort (live mode only — historical uses backend sort)
    const sortedEntries = useMemo(
        () => filters.isHistoricalMode ? filteredEntries : applySortBy(filteredEntries, filters.sortBy),
        [filteredEntries, filters.sortBy, filters.isHistoricalMode]
    );

    return (
        <Box
            className="health-monitor"
            sx={{
                height: '100vh',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: '#F3F4F6',
            }}
        >
            {/* Banner stays pinned while the whole page scrolls under it */}
            <Box sx={{ position: 'sticky', top: 0, zIndex: 10 }}>
                <HealthBanner
                    healthData={health.healthData}
                    dbData={health.dbData}
                    systemData={health.systemData}
                    lastUpdated={health.lastUpdated}
                    isConnected={health.isConnected}
                />
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
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

                {/* ── One collapsed bar for ALL analysis, so the default view
                    stays the live API log. Open it only for deep-dives. ── */}
                <Box sx={{ mx: 3, mb: 1, border: '1px solid #E5E7EB', borderRadius: 1, backgroundColor: '#FFFFFF', overflow: 'hidden' }}>
                    <Box
                        onClick={() => setForensicsOpen((v) => !v)}
                        sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1, cursor: 'pointer', '&:hover': { backgroundColor: '#F9FAFB' } }}
                    >
                        <IconButton size="small" sx={{ mr: 1, p: 0 }}>
                            <i className={`bi bi-chevron-${forensicsOpen ? 'down' : 'right'}`} style={{ fontSize: 12 }} />
                        </IconButton>
                        <i className="bi bi-clipboard-data" style={{ fontSize: 14, marginRight: 6, color: '#6366F1' }} />
                        <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: 0.5, color: 'text.secondary' }}>
                            Forensics &amp; Analysis
                        </Typography>
                        <Box sx={{ flex: 1 }} />
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                            Memory hogs · OOM culprits · async tasks · errors · DB — open when you need a deep-dive
                        </Typography>
                    </Box>

                    <Collapse in={forensicsOpen}>
                        <Box sx={{ borderTop: '1px solid #E5E7EB', pt: 1, backgroundColor: '#FAFAFB' }}>
                            {/* Which API is ballooning memory / caused OOM */}
                            <MemoryHogsPanel
                                enterpriseId={scopeEnterpriseId}
                                onEnterpriseIdChange={setScopeEnterpriseId}
                            />
                            {/* Container kills matched to their real culprit */}
                            <OomEventsPanel />
                            {/* Background tasks + results, separate from request/response */}
                            <AsyncTasksPanel />
                            {/* Error breakdown */}
                            <ErrorBreakdownPanel isConnected={health.isConnected} />
                            {/* DB diagnostics — non-production only */}
                            {process.env.REACT_APP_ENV !== 'production' &&
                                process.env.REACT_APP_ENV !== 'newdbtest1' && (
                                    <DbDiagnosticsPanel dbData={health.dbData} />
                                )}
                            {/* Cleanup */}
                            <CleanupPanel isConnected={health.isConnected} />
                        </Box>
                    </Collapse>
                </Box>

                {/* Log table: a tall bounded viewport (virtualized list needs a
                    bounded height) that flows in the page scroll rather than
                    locking the layout to the viewport. */}
                <Box sx={{ height: 'calc(100vh - 150px)', minHeight: 420, display: 'flex', flexDirection: 'column' }}>
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
                            entries={sortedEntries}
                            newEntrySeqs={logs.newEntrySeqs}
                            isLoading={logs.isLoading}
                            isFirstLoad={logs.isFirstLoad}
                            maxConnections={health.dbData?.max_connections}
                            columnFilters={columnFilters}
                            onColumnFiltersChange={setColumnFilters}
                            sortBy={filters.sortBy}
                            onSortByChange={filters.setSortBy}
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

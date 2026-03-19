import React, { useState, useCallback } from 'react';
import { Box, Typography, IconButton, Tooltip } from '@mui/material';
import { Virtuoso } from 'react-virtuoso';
import { ILogEntry, IColumnFilters, IUserInfo, IEnterpriseInfo } from '../Interfaces/healthMonitor.types';
import { COLUMN_WIDTHS } from '../Constants/healthMonitor.constants';
import LogRow from './LogRow';
import DetailCard from './DetailCard';
import EmptyState from './EmptyState';

interface LogTableProps {
    entries: ILogEntry[];
    newEntrySeqs: Set<number>;
    isLoading: boolean;
    isFirstLoad: boolean;
    maxConnections?: number;
    columnFilters: IColumnFilters;
    onColumnFiltersChange: (filters: IColumnFilters) => void;
    userMap: Map<string, IUserInfo>;
    enterpriseMap: Map<string, IEnterpriseInfo>;
}

const COLUMNS = [
    { label: 'Time', width: COLUMN_WIDTHS.time, filterKey: null },
    { label: 'Status', width: COLUMN_WIDTHS.status, filterKey: null },
    { label: 'Module', width: COLUMN_WIDTHS.module, filterKey: null },
    { label: 'API / Task', width: COLUMN_WIDTHS.apiTask, filterKey: 'apiTask' as const },
    { label: 'Method', width: COLUMN_WIDTHS.method, filterKey: null },
    { label: 'Path', width: COLUMN_WIDTHS.path, filterKey: 'path' as const },
    { label: 'HTTP', width: COLUMN_WIDTHS.http, filterKey: 'httpStatus' as const },
    { label: 'Total Time', width: COLUMN_WIDTHS.totalTime, filterKey: 'minTotalTime' as const },
    { label: 'DB Time', width: COLUMN_WIDTHS.dbTime, filterKey: 'minDbTime' as const },
    { label: 'Queries', width: COLUMN_WIDTHS.queries, filterKey: 'minQueries' as const },
    { label: 'Memory', width: COLUMN_WIDTHS.memory, filterKey: 'minMemory' as const },
    { label: 'Size', width: COLUMN_WIDTHS.size, filterKey: 'minSize' as const },
    { label: 'Enterprise', width: COLUMN_WIDTHS.enterprise, filterKey: null },
    { label: 'User', width: COLUMN_WIDTHS.user, filterKey: null },
];

const FILTER_PLACEHOLDERS: Record<string, string> = {
    apiTask: 'contains...',
    path: 'contains...',
    httpStatus: 'e.g. 5',
    minTotalTime: '>=  sec',
    minDbTime: '>=  sec',
    minQueries: '>=',
    minMemory: '>=  MB',
    minSize: '>=  KB',
};

const LogTable: React.FC<LogTableProps> = ({
    entries,
    newEntrySeqs,
    isLoading,
    isFirstLoad,
    maxConnections,
    columnFilters,
    onColumnFiltersChange,
    userMap,
    enterpriseMap,
}) => {
    const [expandedSeq, setExpandedSeq] = useState<number | null>(null);
    const [showFilters, setShowFilters] = useState(false);

    const handleRowClick = useCallback((seq: number) => {
        setExpandedSeq((prev) => (prev === seq ? null : seq));
    }, []);

    const handleFilterChange = useCallback(
        (key: keyof IColumnFilters, value: string) => {
            onColumnFiltersChange({ ...columnFilters, [key]: value });
        },
        [columnFilters, onColumnFiltersChange]
    );

    const hasActiveFilters = Object.values(columnFilters).some((v) => v !== '');

    if (isFirstLoad) {
        return <EmptyState variant="loading" />;
    }

    if (entries.length === 0 && !hasActiveFilters) {
        return <EmptyState variant="no-match" />;
    }

    return (
        <Box
            sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                position: 'relative',
            }}
        >
            {/* Loading overlay */}
            {isLoading && (
                <Box
                    sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: 2,
                        backgroundColor: '#3B82F6',
                        zIndex: 85,
                        animation: 'loading-bar 1s infinite ease-in-out',
                        '@keyframes loading-bar': {
                            '0%': { transform: 'scaleX(0)', transformOrigin: 'left' },
                            '50%': { transform: 'scaleX(1)', transformOrigin: 'left' },
                            '51%': { transformOrigin: 'right' },
                            '100%': { transform: 'scaleX(0)', transformOrigin: 'right' },
                        },
                    }}
                />
            )}

            {/* Column headers */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: '#F9FAFB',
                    borderBottom: showFilters ? '1px solid #E5E7EB' : '2px solid #E5E7EB',
                    minHeight: 36,
                    px: 1.5,
                    pl: '15px',
                    flexShrink: 0,
                }}
            >
                {COLUMNS.map((col) => (
                    <Box
                        key={col.label}
                        sx={{
                            width: col.width,
                            minWidth: col.width,
                            maxWidth: col.width,
                            px: 0.5,
                        }}
                    >
                        <Typography
                            variant="caption"
                            sx={{
                                fontWeight: 700,
                                fontSize: '0.7rem',
                                color: 'text.secondary',
                                textTransform: 'uppercase',
                                letterSpacing: 0.5,
                            }}
                        >
                            {col.label}
                        </Typography>
                    </Box>
                ))}
                {/* Filter toggle */}
                <Tooltip title={showFilters ? 'Hide column filters' : 'Show column filters'} arrow>
                    <IconButton
                        size="small"
                        onClick={() => setShowFilters(!showFilters)}
                        sx={{
                            ml: 0.5,
                            p: 0.5,
                            color: hasActiveFilters ? '#3B82F6' : 'text.secondary',
                        }}
                    >
                        <i className="bi bi-funnel" style={{ fontSize: 13 }} />
                    </IconButton>
                </Tooltip>
            </Box>

            {/* Filter row */}
            {showFilters && (
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        backgroundColor: '#F3F4F6',
                        borderBottom: '2px solid #E5E7EB',
                        minHeight: 32,
                        px: 1.5,
                        pl: '15px',
                        flexShrink: 0,
                        gap: 0,
                    }}
                >
                    {COLUMNS.map((col) => (
                        <Box
                            key={col.label}
                            sx={{
                                width: col.width,
                                minWidth: col.width,
                                maxWidth: col.width,
                                px: 0.5,
                            }}
                        >
                            {col.filterKey ? (
                                <input
                                    type="text"
                                    placeholder={FILTER_PLACEHOLDERS[col.filterKey] || ''}
                                    value={columnFilters[col.filterKey]}
                                    onChange={(e) =>
                                        handleFilterChange(col.filterKey!, e.target.value)
                                    }
                                    style={{
                                        width: '100%',
                                        height: 24,
                                        padding: '0 6px',
                                        border: `1px solid ${
                                            columnFilters[col.filterKey]
                                                ? '#3B82F6'
                                                : '#D1D5DB'
                                        }`,
                                        borderRadius: 3,
                                        fontSize: '0.7rem',
                                        backgroundColor: columnFilters[col.filterKey]
                                            ? '#EFF6FF'
                                            : '#FFFFFF',
                                        outline: 'none',
                                        boxSizing: 'border-box',
                                    }}
                                />
                            ) : null}
                        </Box>
                    ))}
                    {/* Clear filters button */}
                    {hasActiveFilters && (
                        <Tooltip title="Clear all column filters" arrow>
                            <IconButton
                                size="small"
                                onClick={() =>
                                    onColumnFiltersChange({
                                        apiTask: '',
                                        path: '',
                                        httpStatus: '',
                                        minTotalTime: '',
                                        minDbTime: '',
                                        minQueries: '',
                                        minMemory: '',
                                        minSize: '',
                                    })
                                }
                                sx={{ ml: 0.5, p: 0.5, color: '#DC2626' }}
                            >
                                <i className="bi bi-x-circle" style={{ fontSize: 13 }} />
                            </IconButton>
                        </Tooltip>
                    )}
                </Box>
            )}

            {/* Empty state when filters active but no results */}
            {entries.length === 0 && hasActiveFilters ? (
                <EmptyState variant="no-match" />
            ) : (
                /* Virtualized rows */
                <Box sx={{ flex: 1, opacity: isLoading ? 0.5 : 1, transition: 'opacity 0.2s' }}>
                    <Virtuoso
                        style={{ height: '100%' }}
                        data={entries}
                        itemContent={(_index, entry) => (
                            <div key={entry._seq}>
                                <LogRow
                                    entry={entry}
                                    isNew={newEntrySeqs.has(entry._seq)}
                                    isExpanded={expandedSeq === entry._seq}
                                    onClick={() => handleRowClick(entry._seq)}
                                    userMap={userMap}
                                    enterpriseMap={enterpriseMap}
                                />
                                {expandedSeq === entry._seq && (
                                    <DetailCard entry={entry} maxConnections={maxConnections} userMap={userMap} enterpriseMap={enterpriseMap} />
                                )}
                            </div>
                        )}
                    />
                </Box>
            )}
        </Box>
    );
};

export default LogTable;

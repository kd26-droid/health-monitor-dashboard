import React, { useState, useCallback } from 'react';
import { Box, Typography, IconButton, Tooltip } from '@mui/material';
import { Virtuoso } from 'react-virtuoso';
import {
    ILogEntry,
    IColumnFilters,
    IUserInfo,
    IEnterpriseInfo,
    EMPTY_COLUMN_FILTERS,
} from '../Interfaces/healthMonitor.types';
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
    sortBy: string;
    onSortByChange: (key: string) => void;
    userMap: Map<string, IUserInfo>;
    enterpriseMap: Map<string, IEnterpriseInfo>;
}

interface ColumnDef {
    label: string;
    width: number;
    filterKey: keyof IColumnFilters | null;
    sortKey: string | null;
}

const COLUMNS: ColumnDef[] = [
    { label: 'Time',       width: COLUMN_WIDTHS.time,       filterKey: null,             sortKey: 'timestamp'     },
    { label: 'Status',     width: COLUMN_WIDTHS.status,     filterKey: null,             sortKey: null            },
    { label: 'Module',     width: COLUMN_WIDTHS.module,     filterKey: null,             sortKey: null            },
    { label: 'API / Task', width: COLUMN_WIDTHS.apiTask,    filterKey: 'apiTask',        sortKey: null            },
    { label: 'Method',     width: COLUMN_WIDTHS.method,     filterKey: null,             sortKey: null            },
    { label: 'Path',       width: COLUMN_WIDTHS.path,       filterKey: 'path',           sortKey: null            },
    { label: 'HTTP',       width: COLUMN_WIDTHS.http,       filterKey: 'httpStatus',     sortKey: 'status_code'   },
    { label: 'Total Time', width: COLUMN_WIDTHS.totalTime,  filterKey: 'minTotalTime',   sortKey: 'elapsed_s'     },
    { label: 'DB Time',    width: COLUMN_WIDTHS.dbTime,     filterKey: 'minDbTime',      sortKey: 'db_time_s'     },
    { label: 'Queries',    width: COLUMN_WIDTHS.queries,    filterKey: 'minQueries',     sortKey: 'db_queries'    },
    { label: 'Memory',     width: COLUMN_WIDTHS.memory,     filterKey: 'minMemory',      sortKey: 'mem_delta'     },
    { label: 'Size',       width: COLUMN_WIDTHS.size,       filterKey: 'minSize',        sortKey: 'response_bytes'},
    { label: 'Enterprise', width: COLUMN_WIDTHS.enterprise, filterKey: 'enterprise',     sortKey: null            },
    { label: 'User',       width: COLUMN_WIDTHS.user,       filterKey: 'user',           sortKey: null            },
];

const FILTER_PLACEHOLDERS: Record<string, string> = {
    apiTask:      'contains...',
    path:         'contains...',
    httpStatus:   'e.g. 5',
    minTotalTime: '>= sec',
    minDbTime:    '>= sec',
    minQueries:   '>=',
    minMemory:    '>= MB',
    minSize:      '>= KB',
    enterprise:   'name...',
    user:         'name/email...',
};

const LogTable: React.FC<LogTableProps> = ({
    entries,
    newEntrySeqs,
    isLoading,
    isFirstLoad,
    maxConnections,
    columnFilters,
    onColumnFiltersChange,
    sortBy,
    onSortByChange,
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

    const handleSortClick = useCallback((key: string) => {
        onSortByChange(sortBy === `-${key}` ? key : `-${key}`);
    }, [sortBy, onSortByChange]);

    const getSortIcon = (key: string): string => {
        if (sortBy === `-${key}`) return '↓';
        if (sortBy === key) return '↑';
        return '↕';
    };

    const hasActiveFilters = Object.values(columnFilters).some((v) => v !== '');

    if (isFirstLoad) return <EmptyState variant="loading" />;
    if (entries.length === 0 && !hasActiveFilters) return <EmptyState variant="no-match" />;

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
            {/* Loading bar — full width, outside scroll area */}
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
                            '0%':   { transform: 'scaleX(0)', transformOrigin: 'left' },
                            '50%':  { transform: 'scaleX(1)', transformOrigin: 'left' },
                            '51%':  { transformOrigin: 'right' },
                            '100%': { transform: 'scaleX(0)', transformOrigin: 'right' },
                        },
                    }}
                />
            )}

            {/* Single horizontally-scrollable wrapper — header and rows scroll together */}
            <Box
                sx={{
                    flex: 1,
                    overflowX: 'auto',
                    overflowY: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                <Box
                    sx={{
                        minWidth: 'max-content',
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
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
                                onClick={col.sortKey ? () => handleSortClick(col.sortKey!) : undefined}
                                sx={{
                                    width: col.width,
                                    minWidth: col.width,
                                    maxWidth: col.width,
                                    px: 0.5,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.4,
                                    cursor: col.sortKey ? 'pointer' : 'default',
                                    userSelect: 'none',
                                    '&:hover': col.sortKey ? { opacity: 0.7 } : {},
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
                                {col.sortKey && (
                                    <Typography
                                        component="span"
                                        sx={{
                                            fontSize: '0.62rem',
                                            lineHeight: 1,
                                            color:
                                                sortBy === `-${col.sortKey}` || sortBy === col.sortKey
                                                    ? '#3B82F6'
                                                    : '#D1D5DB',
                                        }}
                                    >
                                        {getSortIcon(col.sortKey)}
                                    </Typography>
                                )}
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
                                                    columnFilters[col.filterKey] ? '#3B82F6' : '#D1D5DB'
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

                            {/* Clear all button */}
                            {hasActiveFilters && (
                                <Tooltip title="Clear all column filters" arrow>
                                    <IconButton
                                        size="small"
                                        onClick={() => onColumnFiltersChange(EMPTY_COLUMN_FILTERS)}
                                        sx={{ ml: 0.5, p: 0.5, color: '#DC2626' }}
                                    >
                                        <i className="bi bi-x-circle" style={{ fontSize: 13 }} />
                                    </IconButton>
                                </Tooltip>
                            )}
                        </Box>
                    )}

                    {/* Rows */}
                    {entries.length === 0 && hasActiveFilters ? (
                        <EmptyState variant="no-match" />
                    ) : (
                        <Box
                            sx={{
                                flex: 1,
                                minHeight: 0,
                                opacity: isLoading ? 0.5 : 1,
                                transition: 'opacity 0.2s',
                            }}
                        >
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
                                            <DetailCard
                                                entry={entry}
                                                maxConnections={maxConnections}
                                                userMap={userMap}
                                                enterpriseMap={enterpriseMap}
                                            />
                                        )}
                                    </div>
                                )}
                            />
                        </Box>
                    )}
                </Box>
            </Box>
        </Box>
    );
};

export default LogTable;

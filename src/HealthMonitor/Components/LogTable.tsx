import React, { useState, useCallback } from 'react';
import { Box, Typography } from '@mui/material';
import { Virtuoso } from 'react-virtuoso';
import { ILogEntry } from '../Interfaces/healthMonitor.types';
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
}

const COLUMNS = [
    { label: 'Time', width: COLUMN_WIDTHS.time },
    { label: 'Status', width: COLUMN_WIDTHS.status },
    { label: 'API / Task', width: COLUMN_WIDTHS.apiTask },
    { label: 'Method', width: COLUMN_WIDTHS.method },
    { label: 'Path', width: COLUMN_WIDTHS.path },
    { label: 'HTTP', width: COLUMN_WIDTHS.http },
    { label: 'Total Time', width: COLUMN_WIDTHS.totalTime },
    { label: 'DB Time', width: COLUMN_WIDTHS.dbTime },
    { label: 'Queries', width: COLUMN_WIDTHS.queries },
    { label: 'Memory', width: COLUMN_WIDTHS.memory },
    { label: 'Size', width: COLUMN_WIDTHS.size },
];

const LogTable: React.FC<LogTableProps> = ({
    entries,
    newEntrySeqs,
    isLoading,
    isFirstLoad,
    maxConnections,
}) => {
    const [expandedSeq, setExpandedSeq] = useState<number | null>(null);

    const handleRowClick = useCallback((seq: number) => {
        setExpandedSeq((prev) => (prev === seq ? null : seq));
    }, []);

    if (isFirstLoad) {
        return <EmptyState variant="loading" />;
    }

    if (entries.length === 0) {
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
            {/* Loading overlay during filter change */}
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
                    borderBottom: '2px solid #E5E7EB',
                    minHeight: 36,
                    px: 1.5,
                    pl: '15px', // account for border-left on rows
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
            </Box>

            {/* Virtualized rows */}
            <Box sx={{ flex: 1, opacity: isLoading ? 0.5 : 1, transition: 'opacity 0.2s' }}>
                <Virtuoso
                    style={{ height: '100%' }}
                    data={entries}
                    itemContent={(index, entry) => (
                        <div key={entry._seq}>
                            <LogRow
                                entry={entry}
                                isNew={newEntrySeqs.has(entry._seq)}
                                isExpanded={expandedSeq === entry._seq}
                                onClick={() => handleRowClick(entry._seq)}
                            />
                            {expandedSeq === entry._seq && (
                                <DetailCard entry={entry} maxConnections={maxConnections} />
                            )}
                        </div>
                    )}
                />
            </Box>
        </Box>
    );
};

export default LogTable;

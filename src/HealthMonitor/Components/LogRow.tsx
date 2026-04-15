import React from 'react';
import { Box, Tooltip, Typography } from '@mui/material';
import { ILogEntry, IUserInfo, IEnterpriseInfo } from '../Interfaces/healthMonitor.types';
import { COLUMN_WIDTHS, THRESHOLDS } from '../Constants/healthMonitor.constants';
import {
    getEventBorderColor,
    getHttpStatusColor,
    getMethodColor,
    getThresholdColor,
    isTaskEvent,
} from '../Utils/colorRules';
import {
    formatElapsed,
    formatSize,
    formatMemDelta,
    formatTimestamp,
    formatQueryString,
} from '../Utils/formatters';
import StatusBadge from './StatusBadge';

interface LogRowProps {
    entry: ILogEntry;
    isNew: boolean;
    isExpanded: boolean;
    onClick: () => void;
    userMap: Map<string, IUserInfo>;
    enterpriseMap: Map<string, IEnterpriseInfo>;
}

function formatModuleLabel(module: string | undefined): string {
    if (!module || module === 'other') return '';
    return module.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

const THRESHOLD_COLORS = {
    default: 'inherit',
    warning: '#D97706',
    error: '#DC2626',
};

const LogRow: React.FC<LogRowProps> = ({ entry, isNew, isExpanded, onClick, userMap, enterpriseMap }) => {
    const borderColor = getEventBorderColor(entry.event);
    const isTask = isTaskEvent(entry.event);
    const queryString = formatQueryString(entry.query_params);
    const fullPathUrl = queryString ? `${entry.path}?${queryString}` : (entry.path ?? '');

    return (
        <Box
            onClick={onClick}
            sx={{
                display: 'flex',
                alignItems: 'center',
                borderLeft: `3px solid ${borderColor}`,
                borderBottom: '1px solid #F3F4F6',
                backgroundColor: isExpanded
                    ? '#F0F4FF'
                    : isNew
                    ? '#EFF6FF'
                    : entry.duplicate_call
                    ? '#FFF7ED'
                    : '#FFFFFF',
                cursor: 'pointer',
                minHeight: 40,
                px: 1.5,
                transition: 'background-color 0.5s ease',
                '&:hover': {
                    backgroundColor: isExpanded ? '#F0F4FF' : '#F9FAFB',
                },
            }}
        >
            {/* Time */}
            <Cell width={COLUMN_WIDTHS.time}>
                <Typography
                    variant="body2"
                    sx={{ fontSize: '0.78rem', color: 'text.secondary' }}
                >
                    {formatTimestamp(entry.ts)}
                </Typography>
            </Cell>

            {/* Status */}
            <Cell width={COLUMN_WIDTHS.status}>
                <StatusBadge
                    event={entry.event}
                    deadlock={entry.deadlock}
                    lockTimeout={entry.lock_timeout}
                    hasNPlusOne={!!(entry.n_plus_1 && entry.n_plus_1.length > 0)}
                    queueTimeS={entry.queue_time_s}
                    gatewayTimeout={entry.gateway_timeout}
                    isOpenApi={entry.api_source === 'open_api'}
                    duplicateCall={entry.duplicate_call}
                    duplicateCount={entry.duplicate_count}
                />
                {entry.worker_id && entry.worker_id !== '?' && (
                    <Typography
                        variant="caption"
                        sx={{
                            fontSize: '0.62rem',
                            fontWeight: 600,
                            color: '#6B7280',
                            backgroundColor: '#F3F4F6',
                            border: '1px solid #E5E7EB',
                            borderRadius: '3px',
                            px: 0.5,
                            mt: 0.3,
                            display: 'inline-block',
                            lineHeight: 1.5,
                        }}
                    >
                        W{entry.worker_id}
                    </Typography>
                )}
            </Cell>

            {/* Module */}
            <Cell width={COLUMN_WIDTHS.module}>
                {entry.module && entry.module !== 'other' && (
                    <Typography
                        variant="body2"
                        sx={{
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            color: '#6366F1',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {formatModuleLabel(entry.module)}
                    </Typography>
                )}
            </Cell>

            {/* API / Task */}
            <Cell width={COLUMN_WIDTHS.apiTask}>
                <Tooltip title={isTask ? entry.task || '' : entry.view || ''} arrow>
                    <Typography
                        variant="body2"
                        sx={{
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {isTask ? entry.task : entry.view}
                    </Typography>
                </Tooltip>
            </Cell>

            {/* Method */}
            <Cell width={COLUMN_WIDTHS.method}>
                {entry.method && (
                    <Typography
                        variant="body2"
                        sx={{
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            color: getMethodColor(entry.method),
                        }}
                    >
                        {entry.method}
                    </Typography>
                )}
            </Cell>

            {/* Path */}
            <Cell width={COLUMN_WIDTHS.path}>
                {entry.path && (
                    <Tooltip title={fullPathUrl} arrow>
                        <Box sx={{ overflow: 'hidden' }}>
                            <Typography
                                variant="body2"
                                sx={{
                                    fontSize: '0.75rem',
                                    fontFamily: 'monospace',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {entry.path}
                            </Typography>
                            {queryString && (
                                <Typography
                                    variant="body2"
                                    sx={{
                                        fontSize: '0.68rem',
                                        fontFamily: 'monospace',
                                        color: '#6366F1',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        lineHeight: 1.2,
                                    }}
                                >
                                    ?{queryString}
                                </Typography>
                            )}
                        </Box>
                    </Tooltip>
                )}
            </Cell>

            {/* HTTP Status */}
            <Cell width={COLUMN_WIDTHS.http}>
                {entry.status != null && (
                    <Typography
                        variant="body2"
                        sx={{
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            color: getHttpStatusColor(entry.status, entry.gateway_timeout),
                        }}
                    >
                        {entry.status}
                    </Typography>
                )}
            </Cell>

            {/* Total Time */}
            <Cell width={COLUMN_WIDTHS.totalTime}>
                <ColoredValue
                    value={entry.elapsed_s}
                    yellow={THRESHOLDS.elapsed_s.yellow}
                    red={THRESHOLDS.elapsed_s.red}
                >
                    {formatElapsed(entry.elapsed_s)}
                </ColoredValue>
            </Cell>

            {/* DB Time */}
            <Cell width={COLUMN_WIDTHS.dbTime}>
                <ColoredValue
                    value={entry.db_time_s}
                    yellow={THRESHOLDS.db_time_s.yellow}
                    red={THRESHOLDS.db_time_s.red}
                >
                    {formatElapsed(entry.db_time_s)}
                </ColoredValue>
            </Cell>

            {/* Queries */}
            <Cell width={COLUMN_WIDTHS.queries}>
                <ColoredValue
                    value={entry.db_queries}
                    yellow={THRESHOLDS.db_queries.yellow}
                    red={THRESHOLDS.db_queries.red}
                >
                    {entry.db_queries}
                </ColoredValue>
            </Cell>

            {/* Memory */}
            <Cell width={COLUMN_WIDTHS.memory}>
                <Tooltip
                    title={
                        entry.mem_used_pct != null
                            ? `${entry.mem_after_mb?.toFixed(1)} MB (${entry.mem_used_pct.toFixed(1)}% of ${entry.mem_total_mb?.toFixed(0)} MB system)`
                            : `${entry.mem_after_mb?.toFixed(1)} MB`
                    }
                    arrow
                >
                    <Box>
                        <Typography variant="body2" sx={{ fontSize: '0.75rem', lineHeight: 1.3, fontWeight: 500 }}>
                            {entry.mem_after_mb != null ? `${entry.mem_after_mb.toFixed(1)} MB` : '–'}
                        </Typography>
                        <ColoredValue
                            value={Math.abs(entry.mem_delta_mb)}
                            yellow={THRESHOLDS.mem_delta_mb.yellow}
                            red={THRESHOLDS.mem_delta_mb.red}
                        >
                            {formatMemDelta(entry.mem_delta_mb)}
                        </ColoredValue>
                    </Box>
                </Tooltip>
            </Cell>

            {/* Size */}
            <Cell width={COLUMN_WIDTHS.size}>
                <ColoredValue
                    value={entry.response_bytes || 0}
                    yellow={THRESHOLDS.response_bytes.yellow}
                    red={THRESHOLDS.response_bytes.red}
                >
                    {formatSize(entry.response_bytes)}
                </ColoredValue>
            </Cell>
            {/* Enterprise */}
            <Cell width={COLUMN_WIDTHS.enterprise}>
                {entry.enterprise_id && (
                    <Tooltip title={entry.enterprise_id} arrow>
                        <Typography
                            variant="body2"
                            sx={{
                                fontSize: '0.72rem',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                color: '#374151',
                            }}
                        >
                            {enterpriseMap.get(entry.enterprise_id)?.name ?? entry.enterprise_id.slice(0, 8) + '…'}
                        </Typography>
                    </Tooltip>
                )}
            </Cell>

            {/* User */}
            <Cell width={COLUMN_WIDTHS.user}>
                {entry.user_id && (
                    <Tooltip title={`${userMap.get(entry.user_id)?.email ?? ''}\n${entry.user_id}`} arrow>
                        <Typography
                            variant="body2"
                            sx={{
                                fontSize: '0.72rem',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                color: '#374151',
                            }}
                        >
                            {userMap.get(entry.user_id)?.name ?? entry.user_id.slice(0, 8) + '…'}
                        </Typography>
                    </Tooltip>
                )}
            </Cell>
        </Box>
    );
};

// ── Helper components ──

const Cell: React.FC<{ width: number; children?: React.ReactNode }> = ({
    width,
    children,
}) => (
    <Box
        sx={{
            width,
            minWidth: width,
            maxWidth: width,
            px: 0.5,
            overflow: 'hidden',
        }}
    >
        {children}
    </Box>
);

const ColoredValue: React.FC<{
    value: number;
    yellow: number;
    red: number;
    children: React.ReactNode;
}> = ({ value, yellow, red, children }) => {
    const level = getThresholdColor(value, yellow, red);
    return (
        <Typography
            variant="body2"
            sx={{
                fontSize: '0.78rem',
                fontWeight: level !== 'default' ? 600 : 400,
                color: THRESHOLD_COLORS[level],
            }}
        >
            {children}
        </Typography>
    );
};

export default React.memo(LogRow, (prev, next) => {
    return (
        prev.entry._seq === next.entry._seq &&
        prev.isNew === next.isNew &&
        prev.isExpanded === next.isExpanded &&
        prev.userMap === next.userMap &&
        prev.enterpriseMap === next.enterpriseMap
    );
});

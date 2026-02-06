import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { ILogEntry } from '../Interfaces/healthMonitor.types';
import { isTaskEvent } from '../Utils/colorRules';
import TimingBreakdown from './DetailSections/TimingBreakdown';
import DatabaseQueries from './DetailSections/DatabaseQueries';
import MemoryUsage from './DetailSections/MemoryUsage';
import RequestResponseSize from './DetailSections/RequestResponseSize';
import ErrorDetails from './DetailSections/ErrorDetails';
import TaskArguments from './DetailSections/TaskArguments';
import RequestPayload from './DetailSections/RequestPayload';
import DeadlockDetails from './DetailSections/DeadlockDetails';
import LockTimeoutDetails from './DetailSections/LockTimeoutDetails';
import NPlusOneQueries from './DetailSections/NPlusOneQueries';
import QueueTime from './DetailSections/QueueTime';

interface DetailCardProps {
    entry: ILogEntry;
    maxConnections?: number;
}

const DetailCard: React.FC<DetailCardProps> = ({ entry, maxConnections }) => {
    const isTask = isTaskEvent(entry.event);
    const hasError = !!(entry.error_type || entry.error);
    const hasTaskArgs = isTask && !!entry.task_args;
    const hasResponseSize = entry.response_bytes != null;
    const hasRequestPayload = !!entry.request_payload;
    const hasNPlusOne = entry.n_plus_1 && entry.n_plus_1.length > 0;
    const hasQueueTime = isTask && entry.queue_time_s != null;

    return (
        <Box
            sx={{
                backgroundColor: '#F9FAFB',
                borderLeft: '3px solid #3B82F6',
                borderBottom: '1px solid #E5E7EB',
                p: 2.5,
                mx: 0,
            }}
            onClick={(e) => e.stopPropagation()}
        >
            {/* Meta info row */}
            <Box
                sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 1.5,
                    alignItems: 'center',
                    mb: 2.5,
                    pb: 2,
                    borderBottom: '1px solid #E5E7EB',
                }}
            >
                {isTask ? (
                    <>
                        <MetaItem label="Task ID" value={entry.task_id || '--'} mono />
                        <MetaItem label="PID" value={String(entry.pid)} />
                        {entry.task_state && (
                            <MetaItem label="State">
                                <Chip
                                    label={entry.task_state}
                                    size="small"
                                    sx={{
                                        fontWeight: 600,
                                        fontSize: '0.7rem',
                                        height: 20,
                                        backgroundColor:
                                            entry.task_state === 'FAILURE'
                                                ? '#FEE2E2'
                                                : '#D1FAE5',
                                        color:
                                            entry.task_state === 'FAILURE'
                                                ? '#991B1B'
                                                : '#065F46',
                                    }}
                                />
                            </MetaItem>
                        )}
                        {entry.retry != null && entry.max_retries != null && (
                            <MetaItem
                                label="Retry"
                                value={`${entry.retry} / ${entry.max_retries}`}
                            />
                        )}
                    </>
                ) : (
                    <>
                        <MetaItem
                            label="Request ID"
                            value={entry.request_id || '--'}
                            mono
                        />
                        <MetaItem label="PID" value={String(entry.pid)} />
                        {entry.user_id && (
                            <MetaItem
                                label="User"
                                value={truncateId(entry.user_id)}
                                mono
                            />
                        )}
                        {entry.enterprise_id && (
                            <MetaItem
                                label="Enterprise"
                                value={truncateId(entry.enterprise_id)}
                                mono
                            />
                        )}
                    </>
                )}
            </Box>

            {/* 2-column grid for detail sections */}
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 2.5,
                }}
            >
                <TimingBreakdown entry={entry} />
                <DatabaseQueries entry={entry} maxConnections={maxConnections} />
                <MemoryUsage entry={entry} />
                {hasResponseSize && <RequestResponseSize entry={entry} />}
            </Box>

            {/* Full-width sections */}
            {hasQueueTime && (
                <Box sx={{ mt: 2.5 }}>
                    <QueueTime queueTimeS={entry.queue_time_s!} />
                </Box>
            )}
            {hasNPlusOne && (
                <Box sx={{ mt: 2.5 }}>
                    <NPlusOneQueries patterns={entry.n_plus_1} />
                </Box>
            )}
            {entry.deadlock && (
                <Box sx={{ mt: 2.5 }}>
                    <DeadlockDetails entry={entry} />
                </Box>
            )}
            {entry.lock_timeout && (
                <Box sx={{ mt: 2.5 }}>
                    <LockTimeoutDetails entry={entry} />
                </Box>
            )}
            {hasError && (
                <Box sx={{ mt: 2.5 }}>
                    <ErrorDetails entry={entry} />
                </Box>
            )}
            {hasRequestPayload && (
                <Box sx={{ mt: 2.5 }}>
                    <RequestPayload entry={entry} />
                </Box>
            )}
            {hasTaskArgs && (
                <Box sx={{ mt: 2.5 }}>
                    <TaskArguments entry={entry} />
                </Box>
            )}
        </Box>
    );
};

// ── Helper components ──

interface MetaItemProps {
    label: string;
    value?: string;
    mono?: boolean;
    children?: React.ReactNode;
}

const MetaItem: React.FC<MetaItemProps> = ({ label, value, mono, children }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Typography
            variant="caption"
            sx={{ color: 'text.secondary', fontSize: '0.7rem' }}
        >
            {label}:
        </Typography>
        {children || (
            <Typography
                variant="caption"
                sx={{
                    fontWeight: 600,
                    fontSize: '0.7rem',
                    fontFamily: mono ? 'monospace' : 'inherit',
                }}
            >
                {value}
            </Typography>
        )}
    </Box>
);

function truncateId(id: string): string {
    if (id.length <= 12) return id;
    return id.substring(0, 8) + '...';
}

export default React.memo(DetailCard);

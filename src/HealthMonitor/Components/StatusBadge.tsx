import React from 'react';
import { Chip } from '@mui/material';
import { TEventType } from '../Interfaces/healthMonitor.types';
import { getEventSeverity, isTaskEvent } from '../Utils/colorRules';
import {
    EVENT_BG_COLORS,
    EVENT_TEXT_COLORS,
} from '../Constants/healthMonitor.constants';

interface StatusBadgeProps {
    event: TEventType;
    deadlock?: boolean;
    lockTimeout?: boolean;
    hasNPlusOne?: boolean;
    queueTimeS?: number | null;
    gatewayTimeout?: boolean;
    isOpenApi?: boolean;
    duplicateCall?: boolean;
    duplicateCount?: number;
}

const BADGE_LABELS: Record<string, string> = {
    ok: 'OK',
    slow: 'SLOW',
    error: 'ERROR',
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ event, deadlock, lockTimeout, hasNPlusOne, queueTimeS, gatewayTimeout, isOpenApi, duplicateCall, duplicateCount }) => {
    const severity = getEventSeverity(event);
    const isTask = isTaskEvent(event);
    const isQueued = queueTimeS != null && queueTimeS > 5;

    return (
        <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
            <Chip
                label={BADGE_LABELS[severity]}
                size="small"
                sx={{
                    backgroundColor: EVENT_BG_COLORS[severity],
                    color: EVENT_TEXT_COLORS[severity],
                    fontWeight: 600,
                    fontSize: '0.7rem',
                    height: 22,
                    borderRadius: '4px',
                }}
            />
            {duplicateCall && (
                <Chip
                    label={`DUPE ×${duplicateCount ?? 2}`}
                    size="small"
                    sx={{
                        backgroundColor: '#FFF7ED',
                        color: '#C2410C',
                        fontWeight: 700,
                        fontSize: '0.65rem',
                        height: 22,
                        borderRadius: '4px',
                        border: '1px solid #FDBA74',
                    }}
                />
            )}
            {gatewayTimeout && (
                <Chip
                    label="TIMEOUT"
                    size="small"
                    sx={{
                        backgroundColor: '#FEF3C7',
                        color: '#B45309',
                        fontWeight: 700,
                        fontSize: '0.65rem',
                        height: 22,
                        borderRadius: '4px',
                    }}
                />
            )}
            {isOpenApi && (
                <Chip
                    label="OPEN API"
                    size="small"
                    sx={{
                        backgroundColor: '#ECFDF5',
                        color: '#065F46',
                        fontWeight: 700,
                        fontSize: '0.65rem',
                        height: 22,
                        borderRadius: '4px',
                    }}
                />
            )}
            {isTask && (
                <Chip
                    label="TASK"
                    size="small"
                    sx={{
                        backgroundColor: '#DBEAFE',
                        color: '#1E40AF',
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        height: 22,
                        borderRadius: '4px',
                    }}
                />
            )}
            {deadlock && (
                <Chip
                    label="DEADLOCK"
                    size="small"
                    sx={{
                        backgroundColor: '#FEE2E2',
                        color: '#991B1B',
                        fontWeight: 700,
                        fontSize: '0.65rem',
                        height: 22,
                        borderRadius: '4px',
                    }}
                />
            )}
            {lockTimeout && (
                <Chip
                    label="LOCK WAIT"
                    size="small"
                    sx={{
                        backgroundColor: '#FEF3C7',
                        color: '#92400E',
                        fontWeight: 700,
                        fontSize: '0.65rem',
                        height: 22,
                        borderRadius: '4px',
                    }}
                />
            )}
            {hasNPlusOne && (
                <Chip
                    label="N+1"
                    size="small"
                    sx={{
                        backgroundColor: '#EDE9FE',
                        color: '#6D28D9',
                        fontWeight: 700,
                        fontSize: '0.65rem',
                        height: 22,
                        borderRadius: '4px',
                    }}
                />
            )}
            {isQueued && (
                <Chip
                    label="QUEUED"
                    size="small"
                    sx={{
                        backgroundColor: '#FEF3C7',
                        color: '#92400E',
                        fontWeight: 700,
                        fontSize: '0.65rem',
                        height: 22,
                        borderRadius: '4px',
                    }}
                />
            )}
        </span>
    );
};

export default React.memo(StatusBadge);

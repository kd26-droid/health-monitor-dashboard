import React from 'react';
import { Chip } from '@mui/material';
import { TEventType, INPlusOnePattern } from '../Interfaces/healthMonitor.types';
import { getEventSeverity, isTaskEvent } from '../Utils/colorRules';
import {
    EVENT_BG_COLORS,
    EVENT_TEXT_COLORS,
} from '../Constants/healthMonitor.constants';

interface StatusBadgeProps {
    event: TEventType;
    deadlock?: boolean;
    lockTimeout?: boolean;
    nPlusOne?: INPlusOnePattern[] | null;
    queueTimeS?: number | null;
}

const BADGE_LABELS: Record<string, string> = {
    ok: 'OK',
    slow: 'SLOW',
    error: 'ERROR',
};

const StatusBadge: React.FC<StatusBadgeProps> = ({
    event,
    deadlock,
    lockTimeout,
    nPlusOne,
    queueTimeS,
}) => {
    const severity = getEventSeverity(event);
    const isTask = isTaskEvent(event);
    const hasNPlusOne = nPlusOne && nPlusOne.length > 0;
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
                        backgroundColor: '#FFEDD5',
                        color: '#C2410C',
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

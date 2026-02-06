import React from 'react';
import { Box, Typography } from '@mui/material';
import { formatElapsed } from '../../Utils/formatters';

interface QueueTimeProps {
    queueTimeS: number;
}

const QueueTime: React.FC<QueueTimeProps> = ({ queueTimeS }) => {
    const isHigh = queueTimeS > 5;
    const isVeryHigh = queueTimeS > 30;

    const getColor = () => {
        if (isVeryHigh) return '#DC2626';
        if (isHigh) return '#D97706';
        return '#059669';
    };

    const getExplanation = () => {
        if (isVeryHigh) {
            return `Critical: Task waited ${formatElapsed(queueTimeS)} in the queue before a worker picked it up. Workers are severely overloaded. Consider adding more Celery workers or investigating what's consuming worker capacity.`;
        }
        if (isHigh) {
            return `Warning: Task waited ${formatElapsed(queueTimeS)} in the queue. This indicates workers are busy. Monitor worker capacity and consider scaling if this persists.`;
        }
        return `Task was picked up quickly (${formatElapsed(queueTimeS)} queue time). Worker capacity is healthy.`;
    };

    return (
        <Box>
            <Typography
                variant="caption"
                sx={{
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    fontSize: '0.7rem',
                    letterSpacing: 0.5,
                    color: 'text.secondary',
                    display: 'block',
                    mb: 1,
                }}
            >
                Queue Wait Time
            </Typography>

            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    mb: 1.5,
                }}
            >
                <Typography
                    variant="h5"
                    sx={{
                        fontWeight: 700,
                        color: getColor(),
                    }}
                >
                    {formatElapsed(queueTimeS)}
                </Typography>
                {isHigh && (
                    <Box
                        sx={{
                            backgroundColor: isVeryHigh ? '#FEE2E2' : '#FEF3C7',
                            color: isVeryHigh ? '#991B1B' : '#92400E',
                            px: 1,
                            py: 0.25,
                            borderRadius: 0.5,
                            fontSize: '0.7rem',
                            fontWeight: 700,
                        }}
                    >
                        {isVeryHigh ? 'CRITICAL' : 'HIGH'}
                    </Box>
                )}
            </Box>

            {/* Explanation */}
            <Box
                sx={{
                    backgroundColor: isVeryHigh ? '#FEF2F2' : isHigh ? '#FFFBEB' : '#ECFDF5',
                    borderLeft: `3px solid ${getColor()}`,
                    p: 1.5,
                    borderRadius: 1,
                }}
            >
                <Typography variant="body2" sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>
                    {getExplanation()}
                </Typography>
            </Box>
        </Box>
    );
};

export default React.memo(QueueTime);

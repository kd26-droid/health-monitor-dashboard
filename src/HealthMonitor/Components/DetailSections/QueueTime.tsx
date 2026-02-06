import React from 'react';
import { Box, Typography } from '@mui/material';
import { formatElapsed } from '../../Utils/formatters';

interface QueueTimeProps {
    queueTimeS: number;
}

const QueueTime: React.FC<QueueTimeProps> = ({ queueTimeS }) => {
    const isHigh = queueTimeS > 5;
    const isVeryHigh = queueTimeS > 30;

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

            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5, mb: 1 }}>
                <Typography
                    variant="h6"
                    sx={{
                        fontWeight: 700,
                        color: isVeryHigh ? '#DC2626' : isHigh ? '#D97706' : '#059669',
                    }}
                >
                    {formatElapsed(queueTimeS)}
                </Typography>
                {isHigh && (
                    <Typography
                        variant="caption"
                        sx={{
                            backgroundColor: isVeryHigh ? '#FEE2E2' : '#FEF3C7',
                            color: isVeryHigh ? '#991B1B' : '#92400E',
                            px: 1,
                            py: 0.25,
                            borderRadius: 0.5,
                            fontWeight: 600,
                            fontSize: '0.7rem',
                        }}
                    >
                        {isVeryHigh ? 'CRITICAL' : 'HIGH'}
                    </Typography>
                )}
            </Box>

            <Box
                sx={{
                    backgroundColor: isVeryHigh ? '#FEF2F2' : isHigh ? '#FFFBEB' : '#ECFDF5',
                    borderLeft: `3px solid ${isVeryHigh ? '#DC2626' : isHigh ? '#D97706' : '#059669'}`,
                    p: 1.5,
                    borderRadius: 1,
                }}
            >
                <Typography variant="body2" sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>
                    {isVeryHigh
                        ? 'Task waited over 30s in queue. Workers are severely overloaded. Add more Celery workers.'
                        : isHigh
                        ? 'Task waited over 5s in queue. Workers may be overloaded. Monitor worker capacity.'
                        : 'Task was picked up quickly. Worker capacity is healthy.'}
                </Typography>
            </Box>
        </Box>
    );
};

export default React.memo(QueueTime);

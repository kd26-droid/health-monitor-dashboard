import React from 'react';
import { Box, Typography } from '@mui/material';
import { ILogEntry } from '../../Interfaces/healthMonitor.types';
import { formatElapsed } from '../../Utils/formatters';
import { getTimingExplanation } from '../../Utils/explanations';

interface TimingBreakdownProps {
    entry: ILogEntry;
}

const TimingBreakdown: React.FC<TimingBreakdownProps> = ({ entry }) => {
    const { elapsed_s, db_time_s, app_time_s } = entry;
    const dbPercent =
        elapsed_s > 0 ? Math.round((db_time_s / elapsed_s) * 100) : 0;
    const appPercent = 100 - dbPercent;
    const explanation = getTimingExplanation(elapsed_s, db_time_s);

    return (
        <Box>
            <Typography
                variant="caption"
                sx={{
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: 'text.secondary',
                    fontSize: '0.7rem',
                    letterSpacing: 0.5,
                }}
            >
                Timing Breakdown
            </Typography>

            <Typography
                variant="h6"
                sx={{ fontWeight: 700, mt: 1, fontSize: '1.1rem' }}
            >
                {formatElapsed(elapsed_s)} total
            </Typography>

            {/* Stacked bar */}
            {elapsed_s > 0 && (
                <Box
                    sx={{
                        display: 'flex',
                        height: 20,
                        borderRadius: 1,
                        overflow: 'hidden',
                        mt: 1.5,
                        mb: 1,
                    }}
                >
                    {dbPercent > 0 && (
                        <Box
                            sx={{
                                width: `${dbPercent}%`,
                                backgroundColor: '#3B82F6',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            {dbPercent >= 15 && (
                                <Typography
                                    variant="caption"
                                    sx={{
                                        color: '#FFF',
                                        fontSize: '0.65rem',
                                        fontWeight: 600,
                                    }}
                                >
                                    DB {dbPercent}%
                                </Typography>
                            )}
                        </Box>
                    )}
                    {appPercent > 0 && (
                        <Box
                            sx={{
                                width: `${appPercent}%`,
                                backgroundColor: '#10B981',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            {appPercent >= 15 && (
                                <Typography
                                    variant="caption"
                                    sx={{
                                        color: '#FFF',
                                        fontSize: '0.65rem',
                                        fontWeight: 600,
                                    }}
                                >
                                    App {appPercent}%
                                </Typography>
                            )}
                        </Box>
                    )}
                </Box>
            )}

            <Typography variant="body2" sx={{ fontSize: '0.8rem', mb: 1.5 }}>
                DB: {formatElapsed(db_time_s)} ({dbPercent}%) &nbsp;&nbsp; App:{' '}
                {formatElapsed(app_time_s)} ({appPercent}%)
            </Typography>

            {/* Explanation */}
            <Box
                sx={{
                    backgroundColor: '#F0F9FF',
                    borderLeft: '3px solid #3B82F6',
                    borderRadius: '0 4px 4px 0',
                    p: 1.5,
                }}
            >
                <Typography variant="body2" sx={{ fontSize: '0.8rem', lineHeight: 1.5 }}>
                    {explanation}
                </Typography>
            </Box>
        </Box>
    );
};

export default TimingBreakdown;

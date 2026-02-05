import React from 'react';
import { Box, Typography } from '@mui/material';
import { ILogEntry } from '../../Interfaces/healthMonitor.types';
import { formatMemDelta } from '../../Utils/formatters';
import { getMemoryExplanation } from '../../Utils/explanations';

interface MemoryUsageProps {
    entry: ILogEntry;
}

const MemoryUsage: React.FC<MemoryUsageProps> = ({ entry }) => {
    const { mem_delta_mb, mem_before_mb, mem_after_mb } = entry;
    const explanation = getMemoryExplanation(mem_delta_mb);

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
                Memory Usage
            </Typography>

            <Typography
                variant="h6"
                sx={{
                    fontWeight: 700,
                    mt: 1,
                    fontSize: '1.1rem',
                    color:
                        mem_delta_mb > 50
                            ? 'error.main'
                            : mem_delta_mb > 20
                            ? 'warning.main'
                            : 'text.primary',
                }}
            >
                {formatMemDelta(mem_delta_mb)}
            </Typography>

            <Typography variant="body2" sx={{ fontSize: '0.8rem', mt: 0.5, mb: 1.5 }}>
                Before: {mem_before_mb} MB &nbsp;&rarr;&nbsp; After:{' '}
                {mem_after_mb} MB
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

export default MemoryUsage;

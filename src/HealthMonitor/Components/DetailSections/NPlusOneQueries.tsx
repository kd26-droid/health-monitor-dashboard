import React from 'react';
import { Box, Typography } from '@mui/material';
import { INPlusOnePattern } from '../../Interfaces/healthMonitor.types';

interface NPlusOneQueriesProps {
    patterns: INPlusOnePattern[] | null | undefined;
}

const NPlusOneQueries: React.FC<NPlusOneQueriesProps> = ({ patterns }) => {
    if (!patterns || patterns.length === 0) return null;

    return (
        <Box>
            <Typography
                variant="caption"
                sx={{
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    fontSize: '0.7rem',
                    letterSpacing: 0.5,
                    color: '#6D28D9',
                    display: 'block',
                    mb: 1,
                }}
            >
                N+1 Queries Detected
            </Typography>

            {patterns.map((pattern, idx) => (
                <Box
                    key={idx}
                    sx={{
                        mb: 1,
                        backgroundColor: '#F5F3FF',
                        border: '1px solid #DDD6FE',
                        borderRadius: 1,
                        p: 1.5,
                    }}
                >
                    <Typography
                        variant="body2"
                        sx={{
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            color: '#6D28D9',
                            mb: 0.5,
                        }}
                    >
                        {pattern.count}x repeated query
                    </Typography>
                    <Box
                        component="pre"
                        sx={{
                            backgroundColor: '#1F2937',
                            color: '#E5E7EB',
                            p: 1,
                            borderRadius: 0.5,
                            fontSize: '0.72rem',
                            fontFamily: 'monospace',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-all',
                            m: 0,
                            maxHeight: 80,
                            overflow: 'auto',
                        }}
                    >
                        {pattern.pattern}
                    </Box>
                </Box>
            ))}

            {/* Explanation */}
            <Box
                sx={{
                    backgroundColor: '#FDF4FF',
                    borderLeft: '3px solid #A855F7',
                    p: 1.5,
                    borderRadius: 1,
                    mt: 1,
                }}
            >
                <Typography variant="body2" sx={{ fontSize: '0.78rem', color: '#6B21A8' }}>
                    <strong>What this means:</strong> The same query pattern was executed{' '}
                    {patterns.reduce((sum, p) => sum + p.count, 0)} times in a single request.
                    This usually indicates a loop fetching related records one at a time instead
                    of using a JOIN or prefetch. Consider using <code>select_related()</code> or{' '}
                    <code>prefetch_related()</code> in Django.
                </Typography>
            </Box>
        </Box>
    );
};

export default React.memo(NPlusOneQueries);

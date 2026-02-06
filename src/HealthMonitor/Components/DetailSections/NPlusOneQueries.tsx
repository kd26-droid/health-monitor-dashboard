import React from 'react';
import { Box, Typography } from '@mui/material';

interface NPlusOnePattern {
    pattern: string;
    count: number;
}

interface NPlusOneQueriesProps {
    patterns: NPlusOnePattern[] | null | undefined;
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

            {patterns.map((p, idx) => (
                <Box
                    key={idx}
                    sx={{
                        backgroundColor: '#F5F3FF',
                        border: '1px solid #DDD6FE',
                        borderRadius: 1,
                        p: 1.5,
                        mb: 1,
                    }}
                >
                    <Typography
                        variant="body2"
                        sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#6D28D9', mb: 0.5 }}
                    >
                        {p.count}x repeated query
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
                        {p.pattern}
                    </Box>
                </Box>
            ))}

            <Box
                sx={{
                    backgroundColor: '#FDF4FF',
                    borderLeft: '3px solid #A855F7',
                    p: 1.5,
                    borderRadius: 1,
                }}
            >
                <Typography variant="body2" sx={{ fontSize: '0.78rem', color: '#6B21A8' }}>
                    <strong>Fix:</strong> Use <code>select_related()</code> or <code>prefetch_related()</code> in Django
                    to fetch related objects in a single query instead of N+1 queries.
                </Typography>
            </Box>
        </Box>
    );
};

export default React.memo(NPlusOneQueries);

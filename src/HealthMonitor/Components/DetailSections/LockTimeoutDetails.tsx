import React from 'react';
import { Box, Typography } from '@mui/material';
import { ILogEntry } from '../../Interfaces/healthMonitor.types';

interface LockTimeoutDetailsProps {
    entry: ILogEntry;
}

const LockTimeoutDetails: React.FC<LockTimeoutDetailsProps> = ({ entry }) => {
    if (!entry.lock_timeout) return null;

    return (
        <Box
            sx={{
                backgroundColor: '#FFFBEB',
                border: '1px solid #FDE68A',
                borderLeft: '4px solid #F59E0B',
                borderRadius: 1,
                p: 2.5,
            }}
        >
            <Typography
                variant="caption"
                sx={{
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: '#92400E',
                    fontSize: '0.75rem',
                    letterSpacing: 0.5,
                }}
            >
                Lock Timeout
            </Typography>

            {/* Query that was waiting */}
            {entry.lock_timeout_query && (
                <Box sx={{ mt: 1.5 }}>
                    <Typography
                        variant="body2"
                        sx={{ fontSize: '0.8rem', fontWeight: 600, mb: 0.5 }}
                    >
                        Query that was waiting:
                    </Typography>
                    <Box
                        component="pre"
                        sx={{
                            backgroundColor: '#1F2937',
                            color: '#FDE68A',
                            p: 1.5,
                            borderRadius: 1,
                            fontSize: '0.75rem',
                            fontFamily: 'monospace',
                            overflow: 'auto',
                            maxHeight: 120,
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-all',
                        }}
                    >
                        {entry.lock_timeout_query}
                    </Box>
                </Box>
            )}

            {/* Explanation */}
            <Box
                sx={{
                    backgroundColor: '#FFFFFF',
                    borderLeft: '3px solid #F59E0B',
                    borderRadius: '0 4px 4px 0',
                    p: 1.5,
                    mt: 1.5,
                }}
            >
                <Typography variant="body2" sx={{ fontSize: '0.8rem', lineHeight: 1.5 }}>
                    This query tried to update or lock a row, but another transaction was
                    already holding the lock. After waiting too long, PostgreSQL killed this
                    query. The other transaction is probably a long-running request or a
                    transaction that was left open. Check /monitor/db/ for currently blocked
                    queries.
                </Typography>
            </Box>
        </Box>
    );
};

export default LockTimeoutDetails;

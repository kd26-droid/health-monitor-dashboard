import React from 'react';
import { Box, Typography } from '@mui/material';
import { ILogEntry } from '../../Interfaces/healthMonitor.types';
import SqlBlock from '../SqlBlock';

interface DeadlockDetailsProps {
    entry: ILogEntry;
}

const DeadlockDetails: React.FC<DeadlockDetailsProps> = ({ entry }) => {
    if (!entry.deadlock) return null;

    return (
        <Box
            sx={{
                backgroundColor: '#FEF2F2',
                border: '1px solid #FECACA',
                borderLeft: '4px solid #DC2626',
                borderRadius: 1,
                p: 2.5,
            }}
        >
            <Typography
                variant="caption"
                sx={{
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: '#991B1B',
                    fontSize: '0.75rem',
                    letterSpacing: 0.5,
                }}
            >
                Deadlock Detected
            </Typography>

            {/* Query that caused it */}
            {entry.deadlock_query && (
                <Box sx={{ mt: 1.5 }}>
                    <Typography
                        variant="body2"
                        sx={{ fontSize: '0.8rem', fontWeight: 600, mb: 0.5 }}
                    >
                        Query that caused it:
                    </Typography>
                    <SqlBlock sql={entry.deadlock_query} />
                </Box>
            )}

            {/* PostgreSQL detail */}
            {entry.deadlock_detail && (
                <Box sx={{ mt: 1.5 }}>
                    <Typography
                        variant="body2"
                        sx={{ fontSize: '0.8rem', fontWeight: 600, mb: 0.5 }}
                    >
                        What happened:
                    </Typography>
                    <SqlBlock sql={entry.deadlock_detail} previewLength={120} />
                </Box>
            )}

            {/* Explanation */}
            <Box
                sx={{
                    backgroundColor: '#FFFFFF',
                    borderLeft: '3px solid #DC2626',
                    borderRadius: '0 4px 4px 0',
                    p: 1.5,
                    mt: 1.5,
                }}
            >
                <Typography variant="body2" sx={{ fontSize: '0.8rem', lineHeight: 1.5 }}>
                    Two database operations tried to lock the same rows in opposite order.
                    PostgreSQL detected the circular wait and killed this request to break
                    the deadlock. The other operation completed successfully. Check the
                    DETAIL above — it shows exactly which processes (PIDs) and which
                    table/row were involved.
                </Typography>
            </Box>
        </Box>
    );
};

export default DeadlockDetails;

import React, { useState } from 'react';
import { Box, Typography, Collapse, IconButton } from '@mui/material';
import { IDbResponse } from '../Interfaces/healthMonitor.types';

interface DbDiagnosticsPanelProps {
    dbData: IDbResponse | null;
}

const DbDiagnosticsPanel: React.FC<DbDiagnosticsPanelProps> = ({ dbData }) => {
    const [open, setOpen] = useState(false);

    if (!dbData) return null;

    const blockedQueries = dbData.blocked_queries || [];
    const lockSummary = dbData.lock_summary || [];
    const deadlocksTotal = dbData.deadlocks_total ?? 0;
    const hasIssues = blockedQueries.length > 0 || deadlocksTotal > 0;

    return (
        <Box
            sx={{
                mx: 3,
                mb: 1,
                border: '1px solid #E5E7EB',
                borderRadius: 1,
                backgroundColor: '#FFFFFF',
                overflow: 'hidden',
            }}
        >
            {/* Header */}
            <Box
                onClick={() => setOpen(!open)}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    px: 2,
                    py: 1,
                    cursor: 'pointer',
                    '&:hover': { backgroundColor: '#F9FAFB' },
                }}
            >
                <IconButton size="small" sx={{ mr: 1, p: 0 }}>
                    <i
                        className={`bi bi-chevron-${open ? 'down' : 'right'}`}
                        style={{ fontSize: 12 }}
                    />
                </IconButton>
                <Typography
                    variant="caption"
                    sx={{
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        fontSize: '0.7rem',
                        letterSpacing: 0.5,
                        color: 'text.secondary',
                    }}
                >
                    DB Diagnostics
                </Typography>
                {hasIssues && (
                    <Box
                        sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            backgroundColor: '#EF4444',
                            ml: 1,
                        }}
                    />
                )}
                <Box sx={{ flex: 1 }} />
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                    {blockedQueries.length} blocked &bull; {deadlocksTotal} deadlocks total
                </Typography>
            </Box>

            <Collapse in={open}>
                <Box sx={{ px: 2, pb: 2, borderTop: '1px solid #E5E7EB' }}>
                    {/* Blocked Queries */}
                    <SectionTitle>Blocked Queries (live)</SectionTitle>
                    {blockedQueries.length === 0 ? (
                        <Typography variant="body2" sx={{ fontSize: '0.8rem', color: 'text.secondary', py: 1 }}>
                            No queries are currently blocked.
                        </Typography>
                    ) : (
                        blockedQueries.map((bq, i) => {
                            const waitSeconds = parseFloat(bq.wait_duration_s);
                            const blockerSeconds = parseFloat(bq.blocker_duration_s);
                            const waitColor =
                                waitSeconds > 30 ? '#DC2626' : waitSeconds > 5 ? '#D97706' : '#059669';
                            const isIdleInTx = bq.blocker_state === 'idle in transaction';

                            return (
                                <Box
                                    key={i}
                                    sx={{
                                        border: '1px solid #E5E7EB',
                                        borderRadius: 1,
                                        p: 1.5,
                                        mb: 1,
                                        backgroundColor: '#FAFAFA',
                                    }}
                                >
                                    <Typography variant="body2" sx={{ fontSize: '0.78rem' }}>
                                        <strong>PID {bq.blocked_pid}</strong> waiting{' '}
                                        <span style={{ color: waitColor, fontWeight: 600 }}>
                                            {waitSeconds.toFixed(1)}s
                                        </span>{' '}
                                        for {bq.lock_mode} on{' '}
                                        <code style={{ fontSize: '0.75rem' }}>"{bq.locked_table}"</code>
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
                                            mt: 0.5,
                                            mb: 1,
                                            maxHeight: 60,
                                            overflow: 'auto',
                                        }}
                                    >
                                        {bq.blocked_query}
                                    </Box>

                                    <Typography variant="body2" sx={{ fontSize: '0.78rem', pl: 2 }}>
                                        &darr; Blocked by{' '}
                                        <strong>PID {bq.blocker_pid}</strong> (
                                        <span
                                            style={{
                                                color: isIdleInTx ? '#DC2626' : 'inherit',
                                                fontWeight: isIdleInTx ? 700 : 400,
                                            }}
                                        >
                                            {bq.blocker_state}
                                        </span>
                                        , {blockerSeconds.toFixed(1)}s)
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
                                            mt: 0.5,
                                            ml: 2,
                                            maxHeight: 60,
                                            overflow: 'auto',
                                        }}
                                    >
                                        {bq.blocker_query}
                                    </Box>
                                </Box>
                            );
                        })
                    )}

                    {/* Lock Summary */}
                    {lockSummary.length > 0 && (
                        <>
                            <SectionTitle>Lock Summary</SectionTitle>
                            <Box
                                component="table"
                                sx={{
                                    width: '100%',
                                    borderCollapse: 'collapse',
                                    fontSize: '0.78rem',
                                    mb: 2,
                                }}
                            >
                                <thead>
                                    <tr>
                                        <ThCell>Mode</ThCell>
                                        <ThCell>Granted</ThCell>
                                        <ThCell>Count</ThCell>
                                    </tr>
                                </thead>
                                <tbody>
                                    {lockSummary.map((ls, i) => (
                                        <tr
                                            key={i}
                                            style={{
                                                backgroundColor: !ls.granted ? '#FEF2F2' : 'transparent',
                                            }}
                                        >
                                            <TdCell>{ls.mode}</TdCell>
                                            <TdCell>
                                                <span
                                                    style={{
                                                        color: ls.granted ? '#059669' : '#DC2626',
                                                        fontWeight: 600,
                                                    }}
                                                >
                                                    {ls.granted ? 'Yes' : 'No (waiting)'}
                                                </span>
                                            </TdCell>
                                            <TdCell>{ls.count}</TdCell>
                                        </tr>
                                    ))}
                                </tbody>
                            </Box>
                        </>
                    )}

                    {/* Deadlocks Total */}
                    <SectionTitle>Deadlocks</SectionTitle>
                    <Typography variant="body2" sx={{ fontSize: '0.8rem', py: 0.5 }}>
                        Total deadlocks since DB start:{' '}
                        <strong style={{ color: deadlocksTotal > 0 ? '#D97706' : 'inherit' }}>
                            {deadlocksTotal}
                        </strong>
                    </Typography>
                </Box>
            </Collapse>
        </Box>
    );
};

// ── Helper components ──

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <Typography
        variant="caption"
        sx={{
            fontWeight: 700,
            textTransform: 'uppercase',
            fontSize: '0.7rem',
            letterSpacing: 0.5,
            color: 'text.secondary',
            display: 'block',
            mt: 2,
            mb: 1,
        }}
    >
        {children}
    </Typography>
);

const ThCell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <Box
        component="th"
        sx={{
            textAlign: 'left',
            p: '6px 12px',
            borderBottom: '2px solid #E5E7EB',
            fontSize: '0.72rem',
            fontWeight: 700,
            color: 'text.secondary',
            textTransform: 'uppercase',
        }}
    >
        {children}
    </Box>
);

const TdCell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <Box
        component="td"
        sx={{
            p: '6px 12px',
            borderBottom: '1px solid #F3F4F6',
        }}
    >
        {children}
    </Box>
);

export default React.memo(DbDiagnosticsPanel);

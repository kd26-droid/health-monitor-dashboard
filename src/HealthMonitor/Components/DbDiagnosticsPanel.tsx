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
    const longRunningTxns = dbData.long_running_transactions || [];
    const tableBloat = dbData.table_bloat || [];
    const lowIndexUsage = dbData.low_index_usage || [];

    const hasIssues = blockedQueries.length > 0 || deadlocksTotal > 0 || longRunningTxns.length > 0;

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
                    {blockedQueries.length} blocked &bull; {deadlocksTotal} deadlocks
                    {longRunningTxns.length > 0 && ` \u2022 ${longRunningTxns.length} long txns`}
                    {tableBloat.length > 0 && ` \u2022 ${tableBloat.length} bloated`}
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

                    {/* Long Running Transactions */}
                    {longRunningTxns.length > 0 && (
                        <>
                            <SectionTitle>Long Running Transactions (&gt;60s)</SectionTitle>
                            <Box
                                sx={{
                                    backgroundColor: '#FEF2F2',
                                    border: '1px solid #FECACA',
                                    borderRadius: 1,
                                    p: 1.5,
                                    mb: 1,
                                }}
                            >
                                <Typography variant="body2" sx={{ fontSize: '0.78rem', color: '#991B1B', mb: 1 }}>
                                    {longRunningTxns.length} transaction(s) open &gt;60 seconds. These hold locks and block autovacuum.
                                </Typography>
                                {longRunningTxns.map((txn, i) => {
                                    const txnSeconds = parseFloat(txn.txn_duration_s);
                                    const isVeryLong = txnSeconds > 300;
                                    return (
                                        <Box
                                            key={i}
                                            sx={{
                                                border: '1px solid #E5E7EB',
                                                borderRadius: 1,
                                                p: 1.5,
                                                mb: 1,
                                                backgroundColor: isVeryLong ? '#FEE2E2' : '#FFFFFF',
                                            }}
                                        >
                                            <Typography variant="body2" sx={{ fontSize: '0.78rem' }}>
                                                <strong>PID {txn.pid}</strong> ({txn.usename}) &mdash;{' '}
                                                <span style={{ color: isVeryLong ? '#DC2626' : '#D97706', fontWeight: 600 }}>
                                                    {txnSeconds.toFixed(1)}s
                                                </span>{' '}
                                                transaction, state: <code>{txn.state}</code>
                                                {txn.wait_event_type && txn.wait_event_type !== 'None' && (
                                                    <>, waiting: {txn.wait_event_type}</>
                                                )}
                                            </Typography>
                                            {txn.query_preview && (
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
                                                        maxHeight: 60,
                                                        overflow: 'auto',
                                                    }}
                                                >
                                                    {txn.query_preview}
                                                </Box>
                                            )}
                                        </Box>
                                    );
                                })}
                            </Box>
                        </>
                    )}

                    {/* Table Bloat */}
                    {tableBloat.length > 0 && (
                        <>
                            <SectionTitle>Table Bloat (Dead Tuples)</SectionTitle>
                            <Box
                                sx={{
                                    backgroundColor: '#FFFBEB',
                                    border: '1px solid #FDE68A',
                                    borderRadius: 1,
                                    p: 1.5,
                                    mb: 1,
                                }}
                            >
                                <Typography variant="body2" sx={{ fontSize: '0.78rem', color: '#92400E', mb: 1 }}>
                                    Tables with &gt;10% dead tuples. Consider running VACUUM ANALYZE.
                                </Typography>
                                <Box
                                    component="table"
                                    sx={{
                                        width: '100%',
                                        borderCollapse: 'collapse',
                                        fontSize: '0.78rem',
                                    }}
                                >
                                    <thead>
                                        <tr>
                                            <ThCell>Table</ThCell>
                                            <ThCell>Live</ThCell>
                                            <ThCell>Dead</ThCell>
                                            <ThCell>Dead %</ThCell>
                                            <ThCell>Last Autovacuum</ThCell>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {tableBloat.map((tb, i) => {
                                            const deadPct = parseFloat(tb.dead_pct);
                                            return (
                                                <tr key={i}>
                                                    <TdCell>
                                                        <code style={{ fontSize: '0.72rem' }}>{tb.relname}</code>
                                                    </TdCell>
                                                    <TdCell>{tb.n_live_tup}</TdCell>
                                                    <TdCell>{tb.n_dead_tup}</TdCell>
                                                    <TdCell>
                                                        <span
                                                            style={{
                                                                color: deadPct > 30 ? '#DC2626' : deadPct > 20 ? '#D97706' : '#059669',
                                                                fontWeight: 600,
                                                            }}
                                                        >
                                                            {deadPct.toFixed(1)}%
                                                        </span>
                                                    </TdCell>
                                                    <TdCell>
                                                        {tb.last_autovacuum
                                                            ? new Date(tb.last_autovacuum).toLocaleString()
                                                            : <span style={{ color: '#9CA3AF' }}>Never</span>}
                                                    </TdCell>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </Box>
                            </Box>
                        </>
                    )}

                    {/* Low Index Usage */}
                    {lowIndexUsage.length > 0 && (
                        <>
                            <SectionTitle>Low Index Usage</SectionTitle>
                            <Box
                                sx={{
                                    backgroundColor: '#EFF6FF',
                                    border: '1px solid #BFDBFE',
                                    borderRadius: 1,
                                    p: 1.5,
                                    mb: 1,
                                }}
                            >
                                <Typography variant="body2" sx={{ fontSize: '0.78rem', color: '#1E40AF', mb: 1 }}>
                                    Tables with &lt;80% index usage. Consider adding indexes or reviewing queries.
                                </Typography>
                                <Box
                                    component="table"
                                    sx={{
                                        width: '100%',
                                        borderCollapse: 'collapse',
                                        fontSize: '0.78rem',
                                    }}
                                >
                                    <thead>
                                        <tr>
                                            <ThCell>Table</ThCell>
                                            <ThCell>Seq Scans</ThCell>
                                            <ThCell>Index Scans</ThCell>
                                            <ThCell>Rows</ThCell>
                                            <ThCell>Idx Usage %</ThCell>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {lowIndexUsage.map((liu, i) => {
                                            const idxPct = parseFloat(liu.idx_usage_pct);
                                            return (
                                                <tr key={i}>
                                                    <TdCell>
                                                        <code style={{ fontSize: '0.72rem' }}>{liu.relname}</code>
                                                    </TdCell>
                                                    <TdCell>{liu.seq_scan}</TdCell>
                                                    <TdCell>{liu.idx_scan}</TdCell>
                                                    <TdCell>{liu.n_live_tup}</TdCell>
                                                    <TdCell>
                                                        <span
                                                            style={{
                                                                color: idxPct < 50 ? '#DC2626' : idxPct < 70 ? '#D97706' : '#059669',
                                                                fontWeight: 600,
                                                            }}
                                                        >
                                                            {idxPct.toFixed(1)}%
                                                        </span>
                                                    </TdCell>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </Box>
                            </Box>
                        </>
                    )}
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

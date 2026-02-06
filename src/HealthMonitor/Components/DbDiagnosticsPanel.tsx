import React, { useState } from 'react';
import { Box, Typography, Collapse, IconButton, Tooltip } from '@mui/material';
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
    const cacheHitRatio = dbData.cache_hit_ratio;
    const cacheBlocksHit = dbData.cache_blocks_hit;
    const cacheBlocksRead = dbData.cache_blocks_read;
    const connectionPoolPct = dbData.connection_pool_pct;

    const hasIssues =
        blockedQueries.length > 0 ||
        deadlocksTotal > 0 ||
        longRunningTxns.length > 0 ||
        tableBloat.some((t) => parseFloat(t.dead_pct) > 50);

    // Summary counts for header
    const issueCount =
        blockedQueries.length +
        (deadlocksTotal > 0 ? 1 : 0) +
        longRunningTxns.length +
        tableBloat.filter((t) => parseFloat(t.dead_pct) > 100).length +
        lowIndexUsage.filter((t) => parseFloat(t.idx_usage_pct) < 50).length;

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
                    {issueCount} issues • {blockedQueries.length} blocked • {longRunningTxns.length} long txns
                </Typography>
            </Box>

            <Collapse in={open}>
                <Box sx={{ px: 2, pb: 2, borderTop: '1px solid #E5E7EB' }}>
                    {/* Cache Hit Ratio */}
                    {cacheHitRatio != null && (
                        <>
                            <SectionTitle tooltip="Ratio of data served from RAM vs disk. Below 99% means the database needs more memory or the working set is too large.">
                                Cache Hit Ratio
                            </SectionTitle>
                            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 2, mb: 1 }}>
                                <Typography
                                    variant="h5"
                                    sx={{
                                        fontWeight: 700,
                                        color:
                                            cacheHitRatio < 95
                                                ? '#DC2626'
                                                : cacheHitRatio < 99
                                                ? '#D97706'
                                                : '#059669',
                                    }}
                                >
                                    {cacheHitRatio.toFixed(2)}%
                                </Typography>
                                {cacheBlocksHit != null && cacheBlocksRead != null && (
                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                        {cacheBlocksHit.toLocaleString()} hits / {cacheBlocksRead.toLocaleString()} reads
                                    </Typography>
                                )}
                            </Box>
                        </>
                    )}

                    {/* Connection Pool */}
                    {connectionPoolPct != null && (
                        <>
                            <SectionTitle tooltip="Active database connections vs max allowed. Above 80% risks connection exhaustion.">
                                Connection Pool
                            </SectionTitle>
                            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 2, mb: 1 }}>
                                <Typography
                                    variant="h5"
                                    sx={{
                                        fontWeight: 700,
                                        color:
                                            connectionPoolPct > 80
                                                ? '#DC2626'
                                                : connectionPoolPct > 60
                                                ? '#D97706'
                                                : '#059669',
                                    }}
                                >
                                    {connectionPoolPct.toFixed(0)}%
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                    {dbData.total_connections} / {dbData.max_connections} connections
                                </Typography>
                            </Box>
                        </>
                    )}

                    {/* Long-Running Transactions */}
                    <SectionTitle tooltip="Transactions open >5 seconds. Long transactions hold locks, block other queries, and prevent autovacuum from cleaning dead rows.">
                        Long-Running Transactions
                    </SectionTitle>
                    {longRunningTxns.length === 0 ? (
                        <Typography variant="body2" sx={{ fontSize: '0.8rem', color: 'text.secondary', py: 1 }}>
                            No long-running transactions.
                        </Typography>
                    ) : (
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
                                    <ThCell>PID</ThCell>
                                    <ThCell>User</ThCell>
                                    <ThCell>Txn Duration</ThCell>
                                    <ThCell>Query Duration</ThCell>
                                    <ThCell>State</ThCell>
                                    <ThCell>Query Preview</ThCell>
                                </tr>
                            </thead>
                            <tbody>
                                {longRunningTxns.map((txn, i) => {
                                    const txnDuration = parseFloat(txn.txn_duration_s);
                                    const isIdleInTx = txn.state === 'idle in transaction';
                                    return (
                                        <Box
                                            component="tr"
                                            key={i}
                                            sx={{ backgroundColor: isIdleInTx ? '#FEF2F2' : 'transparent' }}
                                        >
                                            <TdCell>{txn.pid}</TdCell>
                                            <TdCell>{txn.usename}</TdCell>
                                            <TdCell>
                                                <span style={{ color: txnDuration > 60 ? '#DC2626' : '#D97706', fontWeight: 600 }}>
                                                    {txnDuration.toFixed(1)}s
                                                </span>
                                            </TdCell>
                                            <TdCell>{parseFloat(txn.query_duration_s).toFixed(1)}s</TdCell>
                                            <TdCell>
                                                <span style={{ color: isIdleInTx ? '#DC2626' : 'inherit', fontWeight: isIdleInTx ? 700 : 400 }}>
                                                    {txn.state}
                                                </span>
                                            </TdCell>
                                            <TdCell>
                                                <Tooltip title={txn.query_preview} arrow>
                                                    <code style={{ fontSize: '0.7rem' }}>
                                                        {txn.query_preview.substring(0, 50)}...
                                                    </code>
                                                </Tooltip>
                                            </TdCell>
                                        </Box>
                                    );
                                })}
                            </tbody>
                        </Box>
                    )}

                    {/* Table Bloat */}
                    {tableBloat.length > 0 && (
                        <>
                            <SectionTitle tooltip="Dead rows from UPDATE/DELETE that haven't been cleaned by autovacuum. High bloat slows down queries and wastes disk space.">
                                Table Bloat
                            </SectionTitle>
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
                                        <ThCell>Table</ThCell>
                                        <ThCell align="right">Live Rows</ThCell>
                                        <ThCell align="right">Dead Rows</ThCell>
                                        <ThCell align="right">Dead%</ThCell>
                                        <ThCell>Last Autovacuum</ThCell>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tableBloat.map((tb, i) => {
                                        const deadPct = parseFloat(tb.dead_pct);
                                        const bgColor = deadPct > 100 ? '#FEF2F2' : deadPct > 50 ? '#FFFBEB' : 'transparent';
                                        const textColor = deadPct > 100 ? '#DC2626' : deadPct > 50 ? '#D97706' : 'inherit';
                                        return (
                                            <Box component="tr" key={i} sx={{ backgroundColor: bgColor }}>
                                                <TdCell>
                                                    <code style={{ fontSize: '0.72rem' }}>{tb.relname}</code>
                                                </TdCell>
                                                <TdCell align="right">{parseInt(tb.n_live_tup).toLocaleString()}</TdCell>
                                                <TdCell align="right">{parseInt(tb.n_dead_tup).toLocaleString()}</TdCell>
                                                <TdCell align="right">
                                                    <span style={{ color: textColor, fontWeight: 600 }}>
                                                        {deadPct.toFixed(1)}%
                                                    </span>
                                                </TdCell>
                                                <TdCell>{tb.last_autovacuum || 'Never'}</TdCell>
                                            </Box>
                                        );
                                    })}
                                </tbody>
                            </Box>
                        </>
                    )}

                    {/* Low Index Usage */}
                    {lowIndexUsage.length > 0 && (
                        <>
                            <SectionTitle tooltip="Tables where most queries do full table scans instead of using indexes. Add indexes to improve performance.">
                                Low Index Usage
                            </SectionTitle>
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
                                        <ThCell>Table</ThCell>
                                        <ThCell align="right">Seq Scans</ThCell>
                                        <ThCell align="right">Index Scans</ThCell>
                                        <ThCell align="right">Live Rows</ThCell>
                                        <ThCell align="right">Index Usage%</ThCell>
                                    </tr>
                                </thead>
                                <tbody>
                                    {lowIndexUsage.map((liu, i) => {
                                        const idxPct = parseFloat(liu.idx_usage_pct);
                                        const bgColor = idxPct < 50 ? '#FEF2F2' : idxPct < 80 ? '#FFFBEB' : 'transparent';
                                        const textColor = idxPct < 50 ? '#DC2626' : idxPct < 80 ? '#D97706' : '#059669';
                                        return (
                                            <Box component="tr" key={i} sx={{ backgroundColor: bgColor }}>
                                                <TdCell>
                                                    <code style={{ fontSize: '0.72rem' }}>{liu.relname}</code>
                                                </TdCell>
                                                <TdCell align="right">{parseInt(liu.seq_scan).toLocaleString()}</TdCell>
                                                <TdCell align="right">{parseInt(liu.idx_scan).toLocaleString()}</TdCell>
                                                <TdCell align="right">{parseInt(liu.n_live_tup).toLocaleString()}</TdCell>
                                                <TdCell align="right">
                                                    <span style={{ color: textColor, fontWeight: 600 }}>
                                                        {idxPct.toFixed(1)}%
                                                    </span>
                                                </TdCell>
                                            </Box>
                                        );
                                    })}
                                </tbody>
                            </Box>
                        </>
                    )}

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

const SectionTitle: React.FC<{ children: React.ReactNode; tooltip?: string }> = ({ children, tooltip }) => {
    const content = (
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
                cursor: tooltip ? 'help' : 'default',
            }}
        >
            {children}
            {tooltip && (
                <i className="bi bi-info-circle" style={{ marginLeft: 4, fontSize: 10, opacity: 0.6 }} />
            )}
        </Typography>
    );

    if (tooltip) {
        return <Tooltip title={tooltip} arrow>{content}</Tooltip>;
    }
    return content;
};

const ThCell: React.FC<{ children: React.ReactNode; align?: 'left' | 'right' }> = ({ children, align = 'left' }) => (
    <Box
        component="th"
        sx={{
            textAlign: align,
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

const TdCell: React.FC<{ children: React.ReactNode; align?: 'left' | 'right' }> = ({ children, align = 'left' }) => (
    <Box
        component="td"
        sx={{
            textAlign: align,
            p: '6px 12px',
            borderBottom: '1px solid #F3F4F6',
        }}
    >
        {children}
    </Box>
);

export default React.memo(DbDiagnosticsPanel);

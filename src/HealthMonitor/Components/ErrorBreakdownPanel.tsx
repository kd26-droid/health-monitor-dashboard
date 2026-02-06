import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Collapse, IconButton, Select, MenuItem } from '@mui/material';
import { IErrorsResponse } from '../Interfaces/healthMonitor.types';
import { fetchErrors } from '../Services/healthMonitor.service';

interface ErrorBreakdownPanelProps {
    isConnected: boolean;
}

const ErrorBreakdownPanel: React.FC<ErrorBreakdownPanelProps> = ({ isConnected }) => {
    const [open, setOpen] = useState(false);
    const [minutes, setMinutes] = useState(5);
    const [data, setData] = useState<IErrorsResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        if (!isConnected) return;
        setLoading(true);
        setError(null);
        try {
            const result = await fetchErrors(minutes);
            setData(result);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch error data');
        } finally {
            setLoading(false);
        }
    }, [isConnected, minutes]);

    // Load data when panel opens or minutes changes
    useEffect(() => {
        if (open && isConnected) {
            loadData();
        }
    }, [open, isConnected, minutes, loadData]);

    // Auto-refresh every 30 seconds when open
    useEffect(() => {
        if (!open || !isConnected) return;
        const interval = setInterval(loadData, 30000);
        return () => clearInterval(interval);
    }, [open, isConnected, loadData]);

    const hasErrors = data && data.endpoints.some(e => e.errors > 0);
    const totalErrors = data?.endpoints.reduce((sum, e) => sum + e.errors, 0) ?? 0;

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
                    Error Breakdown
                </Typography>
                {hasErrors && (
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
                    {data ? `${totalErrors} errors in last ${minutes}m` : 'Click to load'}
                </Typography>
            </Box>

            <Collapse in={open}>
                <Box sx={{ px: 2, pb: 2, borderTop: '1px solid #E5E7EB' }}>
                    {/* Time window selector */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, my: 1.5 }}>
                        <Typography variant="caption" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                            Time window:
                        </Typography>
                        <Select
                            size="small"
                            value={minutes}
                            onChange={(e) => setMinutes(Number(e.target.value))}
                            sx={{ minWidth: 100, fontSize: '0.75rem', height: 28 }}
                        >
                            <MenuItem value={1}>Last 1 min</MenuItem>
                            <MenuItem value={5}>Last 5 min</MenuItem>
                            <MenuItem value={15}>Last 15 min</MenuItem>
                            <MenuItem value={30}>Last 30 min</MenuItem>
                            <MenuItem value={60}>Last 1 hour</MenuItem>
                        </Select>
                        {loading && (
                            <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                                Loading...
                            </Typography>
                        )}
                    </Box>

                    {error && (
                        <Box sx={{ backgroundColor: '#FEE2E2', p: 1.5, borderRadius: 1, mb: 1 }}>
                            <Typography variant="body2" sx={{ fontSize: '0.8rem', color: '#991B1B' }}>
                                {error}
                            </Typography>
                        </Box>
                    )}

                    {data && data.endpoints.length === 0 && (
                        <Typography variant="body2" sx={{ fontSize: '0.8rem', color: 'text.secondary', py: 1 }}>
                            No requests in the last {minutes} minutes.
                        </Typography>
                    )}

                    {data && data.endpoints.length > 0 && (
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
                                    <ThCell>Endpoint</ThCell>
                                    <ThCell align="right">Total</ThCell>
                                    <ThCell align="right">Errors</ThCell>
                                    <ThCell align="right">Error %</ThCell>
                                    <ThCell align="right">Slow</ThCell>
                                    <ThCell align="right">N+1</ThCell>
                                    <ThCell align="right">Avg Time</ThCell>
                                    <ThCell align="right">Max Time</ThCell>
                                    <ThCell>Error Types</ThCell>
                                </tr>
                            </thead>
                            <tbody>
                                {data.endpoints.map((ep, i) => (
                                    <tr
                                        key={i}
                                        style={{
                                            backgroundColor: ep.error_pct > 10 ? '#FEF2F2' : 'transparent',
                                        }}
                                    >
                                        <TdCell>
                                            <code style={{ fontSize: '0.72rem' }}>{ep.endpoint}</code>
                                        </TdCell>
                                        <TdCell align="right">{ep.total}</TdCell>
                                        <TdCell align="right">
                                            <span style={{ color: ep.errors > 0 ? '#DC2626' : 'inherit', fontWeight: ep.errors > 0 ? 600 : 400 }}>
                                                {ep.errors}
                                            </span>
                                        </TdCell>
                                        <TdCell align="right">
                                            <span
                                                style={{
                                                    color: ep.error_pct > 10 ? '#DC2626' : ep.error_pct > 5 ? '#D97706' : 'inherit',
                                                    fontWeight: ep.error_pct > 5 ? 600 : 400,
                                                }}
                                            >
                                                {ep.error_pct.toFixed(1)}%
                                            </span>
                                        </TdCell>
                                        <TdCell align="right">
                                            <span style={{ color: ep.slow > 0 ? '#D97706' : 'inherit' }}>
                                                {ep.slow}
                                            </span>
                                        </TdCell>
                                        <TdCell align="right">
                                            <span style={{ color: ep.n_plus_1_count > 0 ? '#6D28D9' : 'inherit' }}>
                                                {ep.n_plus_1_count}
                                            </span>
                                        </TdCell>
                                        <TdCell align="right">
                                            {ep.avg_time_s < 1
                                                ? `${(ep.avg_time_s * 1000).toFixed(0)}ms`
                                                : `${ep.avg_time_s.toFixed(2)}s`}
                                        </TdCell>
                                        <TdCell align="right">
                                            <span style={{ color: ep.max_time_s > 5 ? '#DC2626' : ep.max_time_s > 1 ? '#D97706' : 'inherit' }}>
                                                {ep.max_time_s < 1
                                                    ? `${(ep.max_time_s * 1000).toFixed(0)}ms`
                                                    : `${ep.max_time_s.toFixed(2)}s`}
                                            </span>
                                        </TdCell>
                                        <TdCell>
                                            {Object.entries(ep.error_types || {}).length > 0 ? (
                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                    {Object.entries(ep.error_types).map(([type, count]) => (
                                                        <Box
                                                            key={type}
                                                            sx={{
                                                                backgroundColor: '#FEE2E2',
                                                                color: '#991B1B',
                                                                px: 0.75,
                                                                py: 0.25,
                                                                borderRadius: 0.5,
                                                                fontSize: '0.65rem',
                                                                fontWeight: 600,
                                                            }}
                                                        >
                                                            {type}: {count}
                                                        </Box>
                                                    ))}
                                                </Box>
                                            ) : (
                                                <span style={{ color: '#9CA3AF' }}>--</span>
                                            )}
                                        </TdCell>
                                    </tr>
                                ))}
                            </tbody>
                        </Box>
                    )}

                    {data && (
                        <Typography
                            variant="caption"
                            sx={{ display: 'block', mt: 1.5, color: 'text.secondary', fontSize: '0.7rem' }}
                        >
                            Based on {data.total_entries} entries in the last {data.window_minutes} minutes.
                            Auto-refreshes every 30s.
                        </Typography>
                    )}
                </Box>
            </Collapse>
        </Box>
    );
};

// ── Helper components ──

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
            p: '6px 12px',
            borderBottom: '1px solid #F3F4F6',
            textAlign: align,
        }}
    >
        {children}
    </Box>
);

export default React.memo(ErrorBreakdownPanel);

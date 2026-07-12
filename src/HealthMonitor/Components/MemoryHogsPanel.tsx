import React, { useState, useCallback, useEffect } from 'react';
import { Box, Typography, Collapse, IconButton, TextField, Button, Chip, Tooltip } from '@mui/material';
import { IMemoryHogsResponse, IMemoryHogEndpoint, IMemoryHogEvent } from '../Interfaces/healthMonitor.types';
import { fetchMemoryHogs } from '../Services/healthMonitor.service';

interface MemoryHogsPanelProps {
    enterpriseId: string;
    onEnterpriseIdChange: (v: string) => void;
}

const WINDOWS: { label: string; hours: number }[] = [
    { label: '1h', hours: 1 },
    { label: '6h', hours: 6 },
    { label: '24h', hours: 24 },
    { label: '3d', hours: 72 },
    { label: '7d', hours: 168 },
];

// Colour scale for a memory delta (MB). The whole point is that a big number
// SCREAMS — so the user's eye lands on the real hog instantly.
function deltaColor(mb: number): string {
    if (mb >= 300) return '#B91C1C'; // red-700
    if (mb >= 150) return '#EA580C'; // orange-600
    if (mb >= 60) return '#CA8A04';  // yellow-600
    return '#6B7280';                // gray-500
}

function fmtTime(ts: string | null): string {
    if (!ts) return '—';
    const d = new Date(ts);
    if (isNaN(d.getTime())) return ts;
    return d.toLocaleString(undefined, {
        month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
}

const MemoryHogsPanel: React.FC<MemoryHogsPanelProps> = ({ enterpriseId, onEnterpriseIdChange }) => {
    const [open, setOpen] = useState(false);
    const [hours, setHours] = useState(24);
    const [minDelta, setMinDelta] = useState(25);
    const [includeColdStart, setIncludeColdStart] = useState(false);
    const [data, setData] = useState<IMemoryHogsResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [expanded, setExpanded] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetchMemoryHogs({
                hours,
                min_delta_mb: minDelta,
                enterprise_id: enterpriseId.trim() || undefined,
                include_cold_start: includeColdStart,
            });
            setData(res);
            if (res.error) setError(res.error);
        } catch (err: any) {
            setError(err?.message || 'Failed to load memory hogs');
            setData(null);
        } finally {
            setLoading(false);
        }
    }, [hours, minDelta, enterpriseId, includeColdStart]);

    // Auto-load when the window/enterprise/threshold changes and panel is open.
    useEffect(() => {
        if (open) load();
    }, [open, load]);

    const endpoints = data?.by_endpoint ?? [];
    const eventsByEndpoint = (ep: IMemoryHogEndpoint): IMemoryHogEvent[] =>
        (data?.worst_events ?? []).filter(
            (e) => e.path === ep.path && e.view === ep.view && e.enterprise_id === ep.enterprise_id
        );

    const rowKey = (ep: IMemoryHogEndpoint) => `${ep.enterprise_id}|${ep.method}|${ep.path}`;

    return (
        <Box sx={{ mx: 3, mb: 1, border: '1px solid #E5E7EB', borderRadius: 1, backgroundColor: '#FFFFFF', overflow: 'hidden' }}>
            {/* Header */}
            <Box
                onClick={() => setOpen(!open)}
                sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1, cursor: 'pointer', '&:hover': { backgroundColor: '#F9FAFB' } }}
            >
                <IconButton size="small" sx={{ mr: 1, p: 0 }}>
                    <i className={`bi bi-chevron-${open ? 'down' : 'right'}`} style={{ fontSize: 12 }} />
                </IconButton>
                <i className="bi bi-memory" style={{ fontSize: 14, marginRight: 6, color: '#B91C1C' }} />
                <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: 0.5, color: 'text.secondary' }}>
                    Memory Hogs
                </Typography>
                <Box sx={{ flex: 1 }} />
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                    Which API ballooned memory — ranked by growth on warm workers (cold-start excluded)
                </Typography>
            </Box>

            <Collapse in={open}>
                <Box sx={{ px: 2, pb: 2, borderTop: '1px solid #E5E7EB' }}>
                    {/* Controls */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, my: 1.5, flexWrap: 'wrap' }}>
                        <TextField
                            size="small"
                            placeholder="Filter by enterprise id (blank = all)"
                            value={enterpriseId}
                            onChange={(e) => onEnterpriseIdChange(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && load()}
                            sx={{ minWidth: 260, '& input': { fontSize: '0.78rem', py: 0.75 } }}
                        />
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                            {WINDOWS.map((w) => (
                                <Button
                                    key={w.hours}
                                    size="small"
                                    variant={hours === w.hours ? 'contained' : 'outlined'}
                                    onClick={() => setHours(w.hours)}
                                    sx={{ fontSize: '0.7rem', textTransform: 'none', minWidth: 0, py: 0.25, px: 1 }}
                                >
                                    {w.label}
                                </Button>
                            ))}
                        </Box>
                        <Tooltip title="Ignore requests that grew RSS by less than this many MB">
                            <TextField
                                size="small"
                                type="number"
                                label="min Δ MB"
                                value={minDelta}
                                onChange={(e) => setMinDelta(Number(e.target.value) || 0)}
                                sx={{ width: 100, '& input': { fontSize: '0.78rem', py: 0.75 }, '& label': { fontSize: '0.72rem' } }}
                            />
                        </Tooltip>
                        <Button
                            size="small"
                            variant={includeColdStart ? 'contained' : 'outlined'}
                            onClick={() => setIncludeColdStart((v) => !v)}
                            sx={{ fontSize: '0.68rem', textTransform: 'none', py: 0.25 }}
                        >
                            {includeColdStart ? '✓ ' : ''}show cold-start
                        </Button>
                        <Button size="small" variant="contained" disabled={loading} onClick={load} sx={{ fontSize: '0.72rem', textTransform: 'none' }}>
                            {loading ? 'Loading…' : '↻ Refresh'}
                        </Button>
                        {data?.cached && (
                            <Chip label="cached" size="small" sx={{ height: 18, fontSize: '0.62rem', backgroundColor: '#F3F4F6' }} />
                        )}
                    </Box>

                    {error && (
                        <Box sx={{ backgroundColor: '#FEF3C7', p: 1.5, borderRadius: 1, mb: 1 }}>
                            <Typography variant="body2" sx={{ fontSize: '0.8rem', color: '#92400E' }}>
                                {error}
                            </Typography>
                        </Box>
                    )}

                    {!error && endpoints.length === 0 && !loading && (
                        <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary', py: 1 }}>
                            No endpoint grew memory by ≥{minDelta}MB on a warm worker in the last{' '}
                            {WINDOWS.find((w) => w.hours === hours)?.label || `${hours}h`}
                            {enterpriseId.trim() ? ` for enterprise ${enterpriseId.trim()}` : ''}. That's good — nothing is ballooning.
                        </Typography>
                    )}

                    {endpoints.length > 0 && (
                        <Box sx={{ overflowX: 'auto' }}>
                            <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                                <Box component="thead">
                                    <Box component="tr" sx={{ '& th': { textAlign: 'left', py: 0.5, px: 1, borderBottom: '1px solid #E5E7EB', color: '#6B7280', fontWeight: 700, fontSize: '0.66rem', textTransform: 'uppercase', whiteSpace: 'nowrap' } }}>
                                        <th style={{ width: 24 }}></th>
                                        <th>Endpoint</th>
                                        <th>Enterprise</th>
                                        <th style={{ textAlign: 'right' }}>Max Δ</th>
                                        <th style={{ textAlign: 'right' }}>Avg Δ</th>
                                        <th style={{ textAlign: 'right' }}>Peak RSS</th>
                                        <th style={{ textAlign: 'right' }}>Hits</th>
                                        <th>Worst at</th>
                                    </Box>
                                </Box>
                                <Box component="tbody">
                                    {endpoints.map((ep) => {
                                        const k = rowKey(ep);
                                        const isOpen = expanded === k;
                                        const evs = isOpen ? eventsByEndpoint(ep) : [];
                                        return (
                                            <React.Fragment key={k}>
                                                <Box
                                                    component="tr"
                                                    onClick={() => setExpanded(isOpen ? null : k)}
                                                    sx={{ cursor: 'pointer', '&:hover': { backgroundColor: '#F9FAFB' }, '& td': { py: 0.6, px: 1, borderBottom: '1px solid #F3F4F6', verticalAlign: 'top' } }}
                                                >
                                                    <td>
                                                        <i className={`bi bi-chevron-${isOpen ? 'down' : 'right'}`} style={{ fontSize: 10, color: '#9CA3AF' }} />
                                                    </td>
                                                    <td>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                                            <MethodChip method={ep.method} />
                                                            <span style={{ fontFamily: 'monospace', fontSize: '0.74rem' }}>{ep.path || ep.view || '—'}</span>
                                                        </Box>
                                                        {ep.view && ep.path && (
                                                            <Typography sx={{ fontSize: '0.66rem', color: '#9CA3AF', ml: 4 }}>{ep.view}</Typography>
                                                        )}
                                                    </td>
                                                    <td style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: '#6B7280', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {ep.enterprise_id || '—'}
                                                    </td>
                                                    <td style={{ textAlign: 'right', fontWeight: 700, color: deltaColor(ep.max_delta_mb) }}>
                                                        +{Math.round(ep.max_delta_mb)}MB
                                                    </td>
                                                    <td style={{ textAlign: 'right', color: '#6B7280' }}>+{Math.round(ep.avg_delta_mb)}MB</td>
                                                    <td style={{ textAlign: 'right', color: '#6B7280' }}>{Math.round(ep.max_mem_after_mb)}MB</td>
                                                    <td style={{ textAlign: 'right' }}>
                                                        {ep.hits}
                                                        {ep.cold_start_hits > 0 && (
                                                            <Tooltip title={`${ep.cold_start_hits} of these were cold-start warmup`}>
                                                                <span style={{ color: '#9CA3AF', fontSize: '0.66rem' }}> ({ep.cold_start_hits}❄)</span>
                                                            </Tooltip>
                                                        )}
                                                    </td>
                                                    <td style={{ color: '#6B7280', whiteSpace: 'nowrap', fontSize: '0.72rem' }}>{fmtTime(ep.worst_ts)}</td>
                                                </Box>
                                                {isOpen && evs.map((e, i) => (
                                                    <Box component="tr" key={i} sx={{ backgroundColor: '#FCFCFD', '& td': { py: 0.4, px: 1, borderBottom: '1px solid #F3F4F6' } }}>
                                                        <td></td>
                                                        <td colSpan={7}>
                                                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', fontSize: '0.72rem', color: '#374151', pl: 3 }}>
                                                                <span><b style={{ color: deltaColor(e.mem_delta_mb ?? 0) }}>+{Math.round(e.mem_delta_mb ?? 0)}MB</b> ({Math.round(e.mem_before_mb ?? 0)}→{Math.round(e.mem_after_mb ?? 0)}MB)</span>
                                                                <span>⏱ {e.elapsed_s != null ? `${e.elapsed_s.toFixed(2)}s` : '—'}</span>
                                                                <span>🗄 {e.db_queries ?? '—'} queries</span>
                                                                {e.mem_used_pct != null && <span>host {e.mem_used_pct}%</span>}
                                                                {e.status != null && <span>status {e.status}</span>}
                                                                {e.is_cold_start && <Chip label="cold start" size="small" sx={{ height: 16, fontSize: '0.6rem', backgroundColor: '#EFF6FF', color: '#1D4ED8' }} />}
                                                                <span style={{ color: '#9CA3AF' }}>{fmtTime(e.ts)} · {e.worker_id || ''} · {e.request_id || ''}</span>
                                                            </Box>
                                                        </td>
                                                    </Box>
                                                ))}
                                            </React.Fragment>
                                        );
                                    })}
                                </Box>
                            </Box>
                        </Box>
                    )}
                </Box>
            </Collapse>
        </Box>
    );
};

const MethodChip: React.FC<{ method: string | null }> = ({ method }) => {
    const m = (method || '').toUpperCase();
    const color = m === 'GET' ? '#34C759' : m === 'POST' ? '#007AFF' : m === 'DELETE' ? '#FF3B30' : '#6366F1';
    return (
        <span style={{ color, fontWeight: 700, fontSize: '0.64rem', minWidth: 34, display: 'inline-block' }}>{m || '—'}</span>
    );
};

export default React.memo(MemoryHogsPanel);

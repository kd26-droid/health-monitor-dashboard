import React, { useState, useCallback, useEffect } from 'react';
import { Box, Typography, Collapse, IconButton, Button, Chip } from '@mui/material';
import { IOomEventsResponse, IOomEvent, IOomCulprit, TOomConfidence } from '../Interfaces/healthMonitor.types';
import { fetchOomEvents } from '../Services/healthMonitor.service';
import TimeRangeControl, { ITimeRange, toUtcIso } from './TimeRangeControl';

const OOM_PRESETS = [
    { label: '24h', hours: 24 },
    { label: '3d', hours: 72 },
    { label: '7d', hours: 168 },
];

function rangeLabel(r: ITimeRange): string {
    if (r.fromTs && r.toTs) return 'the selected range';
    const m: Record<number, string> = { 24: '24h', 72: '3d', 168: '7d' };
    return `the last ${m[r.hours] || r.hours + 'h'}`;
}

function fmtTime(ts?: string | null): string {
    if (!ts) return '—';
    const d = new Date(ts);
    if (isNaN(d.getTime())) return ts;
    return d.toLocaleString(undefined, {
        month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
}

const CONFIDENCE_META: Record<TOomConfidence, { label: string; bg: string; fg: string }> = {
    in_flight: { label: 'IN-FLIGHT AT KILL', bg: '#FEF2F2', fg: '#B91C1C' },
    peak_memory: { label: 'PEAK MEMORY BEFORE KILL', bg: '#FFF7ED', fg: '#C2410C' },
    none: { label: 'NO CULPRIT CAPTURED', bg: '#F3F4F6', fg: '#6B7280' },
};

function culpritLabel(c: IOomCulprit): string {
    if (c.kind === 'celery' || c.task) return c.task || 'unknown task';
    return `${c.method || ''} ${c.path || c.view || 'unknown'}`.trim();
}

const OomEventsPanel: React.FC = () => {
    const [open, setOpen] = useState(false);
    const [range, setRange] = useState<ITimeRange>({ hours: 72 });
    const [data, setData] = useState<IOomEventsResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [expanded, setExpanded] = useState<number | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetchOomEvents({
                hours: range.hours,
                from_ts: toUtcIso(range.fromTs),
                to_ts: toUtcIso(range.toTs),
            });
            setData(res);
            if (res.error) setError(res.error);
        } catch (err: any) {
            setError(err?.message || 'Failed to load OOM events');
            setData(null);
        } finally {
            setLoading(false);
        }
    }, [range]);

    useEffect(() => {
        if (open) load();
    }, [open, load]);

    const events = data?.events ?? [];

    return (
        <Box sx={{ mx: 3, mb: 1, border: '1px solid #E5E7EB', borderRadius: 1, backgroundColor: '#FFFFFF', overflow: 'hidden' }}>
            <Box
                onClick={() => setOpen(!open)}
                sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1, cursor: 'pointer', '&:hover': { backgroundColor: '#F9FAFB' } }}
            >
                <IconButton size="small" sx={{ mr: 1, p: 0 }}>
                    <i className={`bi bi-chevron-${open ? 'down' : 'right'}`} style={{ fontSize: 12 }} />
                </IconButton>
                <i className="bi bi-exclamation-octagon" style={{ fontSize: 14, marginRight: 6, color: '#B91C1C' }} />
                <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: 0.5, color: 'text.secondary' }}>
                    OOM &amp; Crash Events
                </Typography>
                {events.length > 0 && (
                    <Chip label={events.length} size="small" sx={{ ml: 1, height: 18, fontSize: '0.64rem', backgroundColor: '#FEF2F2', color: '#B91C1C' }} />
                )}
                <Box sx={{ flex: 1 }} />
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                    Each kill matched to the request/task that caused it — never by frequency
                </Typography>
            </Box>

            <Collapse in={open}>
                <Box sx={{ px: 2, pb: 2, borderTop: '1px solid #E5E7EB' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, my: 1.5, flexWrap: 'wrap' }}>
                        <TimeRangeControl value={range} onChange={setRange} presets={OOM_PRESETS} />
                        <Button size="small" variant="contained" disabled={loading} onClick={load} sx={{ fontSize: '0.72rem', textTransform: 'none' }}>
                            {loading ? 'Loading…' : '↻ Refresh'}
                        </Button>
                        {data?.cached && <Chip label="cached" size="small" sx={{ height: 18, fontSize: '0.62rem', backgroundColor: '#F3F4F6' }} />}
                    </Box>

                    {error && (
                        <Box sx={{ backgroundColor: '#FEF3C7', p: 1.5, borderRadius: 1, mb: 1 }}>
                            <Typography variant="body2" sx={{ fontSize: '0.8rem', color: '#92400E' }}>{error}</Typography>
                        </Box>
                    )}

                    {!error && events.length === 0 && !loading && (
                        <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary', py: 1 }}>
                            No container OOM kills (exit 137 / SIGKILL) in {rangeLabel(range)}. Deploys and manual restarts are not shown here.
                        </Typography>
                    )}

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {events.map((ev, idx) => (
                            <OomEventCard
                                key={idx}
                                ev={ev}
                                expanded={expanded === idx}
                                onToggle={() => setExpanded(expanded === idx ? null : idx)}
                            />
                        ))}
                    </Box>
                </Box>
            </Collapse>
        </Box>
    );
};

const OomEventCard: React.FC<{ ev: IOomEvent; expanded: boolean; onToggle: () => void }> = ({ ev, expanded, onToggle }) => {
    const conf = CONFIDENCE_META[ev.culprit_confidence] || CONFIDENCE_META.none;
    const c = ev.culprit;
    return (
        <Box sx={{ border: '1px solid #FECACA', borderRadius: 1, overflow: 'hidden' }}>
            {/* Kill header line */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.75, backgroundColor: '#FFFBFB', flexWrap: 'wrap' }}>
                <Chip label={ev.kind === 'celery' ? 'CELERY' : 'WEB'} size="small"
                    sx={{ height: 18, fontSize: '0.62rem', fontWeight: 700, backgroundColor: ev.kind === 'celery' ? '#F5F3FF' : '#EFF6FF', color: ev.kind === 'celery' ? '#6D28D9' : '#1D4ED8' }} />
                <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: '#111827' }}>
                    {fmtTime(ev.ts)}
                </Typography>
                <Typography sx={{ fontSize: '0.72rem', color: '#6B7280' }}>
                    exit {ev.exit_code || '?'} · {ev.reason || 'killed'}
                </Typography>
                <Box sx={{ flex: 1 }} />
                <Chip label={conf.label} size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, backgroundColor: conf.bg, color: conf.fg }} />
            </Box>

            {/* Culprit */}
            <Box sx={{ px: 1.5, py: 1, borderTop: '1px solid #FEE2E2' }}>
                {c ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.7rem', color: '#9CA3AF' }}>Culprit:</span>
                            <code style={{ fontSize: '0.8rem', fontWeight: 700, color: '#B91C1C' }}>{culpritLabel(c)}</code>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', fontSize: '0.72rem', color: '#374151' }}>
                            {c.enterprise_id && <span>ent <code>{c.enterprise_id}</code></span>}
                            {c.mem_after_mb != null && (
                                <span>mem {c.mem_before_mb != null ? `${Math.round(c.mem_before_mb)}→` : ''}<b>{Math.round(c.mem_after_mb)}MB</b>{c.mem_delta_mb != null ? ` (+${Math.round(c.mem_delta_mb)})` : ''}</span>
                            )}
                            {c.elapsed_s != null && <span>⏱ {c.elapsed_s.toFixed(2)}s</span>}
                            {c._gap_s != null && <span style={{ color: '#9CA3AF' }}>{c._gap_s}s before kill</span>}
                            {c.worker_id && <span style={{ color: '#9CA3AF' }}>{c.worker_id}</span>}
                        </Box>
                        {c.error && <Typography sx={{ fontSize: '0.7rem', color: '#7F1D1D', mt: 0.25 }}>{c.error}</Typography>}
                    </Box>
                ) : (
                    <Typography sx={{ fontSize: '0.76rem', color: 'text.secondary' }}>
                        No request/task captured on this replica in the 120s before the kill — the worker may have died during boot or between requests.
                    </Typography>
                )}

                {ev.recent.length > 0 && (
                    <Box sx={{ mt: 0.5 }}>
                        <Button size="small" onClick={onToggle} sx={{ fontSize: '0.68rem', textTransform: 'none', p: 0, minWidth: 0, color: '#6B7280' }}>
                            {expanded ? '▾ hide' : '▸ show'} what led up to it ({ev.recent.length})
                        </Button>
                        <Collapse in={expanded}>
                            <Box sx={{ mt: 0.5, pl: 1, borderLeft: '2px solid #FEE2E2', display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                                {ev.recent.map((r, i) => (
                                    <Box key={i} sx={{ display: 'flex', gap: 1.5, fontSize: '0.7rem', color: '#4B5563', flexWrap: 'wrap' }}>
                                        <span style={{ color: '#9CA3AF', minWidth: 70 }}>{r._gap_s != null ? `-${r._gap_s}s` : ''}</span>
                                        <code style={{ fontSize: '0.68rem' }}>{culpritLabel(r)}</code>
                                        {r.mem_after_mb != null && <span>{Math.round(r.mem_after_mb)}MB</span>}
                                        {r.enterprise_id && <span style={{ color: '#9CA3AF' }}>ent {r.enterprise_id}</span>}
                                    </Box>
                                ))}
                            </Box>
                        </Collapse>
                    </Box>
                )}
            </Box>
        </Box>
    );
};

export default React.memo(OomEventsPanel);

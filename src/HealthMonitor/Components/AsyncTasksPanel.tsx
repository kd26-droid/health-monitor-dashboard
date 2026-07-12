import React, { useState, useCallback, useEffect } from 'react';
import { Box, Typography, Collapse, IconButton, Button, Chip, Tooltip } from '@mui/material';
import { IAsyncTasksResponse, IAsyncTask } from '../Interfaces/healthMonitor.types';
import { fetchAsyncTasks } from '../Services/healthMonitor.service';

const WINDOWS: { label: string; hours: number }[] = [
    { label: '1h', hours: 1 },
    { label: '6h', hours: 6 },
    { label: '24h', hours: 24 },
    { label: '3d', hours: 72 },
];

const STATES: { label: string; value: string }[] = [
    { label: 'All', value: '' },
    { label: 'Success', value: 'SUCCESS' },
    { label: 'Failure', value: 'FAILURE' },
];

function fmtTime(ts: string): string {
    if (!ts) return '—';
    const d = new Date(ts);
    if (isNaN(d.getTime())) return ts;
    return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// Trim the long dotted task path to the last two segments for readability.
function shortTask(name: string | null): string {
    if (!name) return '—';
    const parts = name.split('.');
    return parts.length <= 2 ? name : `…${parts.slice(-2).join('.')}`;
}

function stateChip(state: string): { bg: string; fg: string } {
    const s = (state || '').toUpperCase();
    if (s === 'SUCCESS') return { bg: '#ECFDF5', fg: '#047857' };
    if (s === 'FAILURE') return { bg: '#FEF2F2', fg: '#B91C1C' };
    if (s.includes('RETRY')) return { bg: '#FFF7ED', fg: '#C2410C' };
    return { bg: '#F3F4F6', fg: '#6B7280' };
}

const AsyncTasksPanel: React.FC = () => {
    const [open, setOpen] = useState(false);
    const [hours, setHours] = useState(24);
    const [state, setState] = useState('');
    const [slowOnly, setSlowOnly] = useState(false);
    const [data, setData] = useState<IAsyncTasksResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetchAsyncTasks({
                hours,
                state: state || undefined,
                min_elapsed_s: slowOnly ? 5 : undefined,
            });
            setData(res);
            if (res.error) setError(res.error);
        } catch (err: any) {
            setError(err?.message || 'Failed to load async tasks');
            setData(null);
        } finally {
            setLoading(false);
        }
    }, [hours, state, slowOnly]);

    useEffect(() => {
        if (open) load();
    }, [open, load]);

    const tasks = data?.tasks ?? [];

    return (
        <Box sx={{ mx: 3, mb: 1, border: '1px solid #E5E7EB', borderRadius: 1, backgroundColor: '#FFFFFF', overflow: 'hidden' }}>
            <Box
                onClick={() => setOpen(!open)}
                sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1, cursor: 'pointer', '&:hover': { backgroundColor: '#F9FAFB' } }}
            >
                <IconButton size="small" sx={{ mr: 1, p: 0 }}>
                    <i className={`bi bi-chevron-${open ? 'down' : 'right'}`} style={{ fontSize: 12 }} />
                </IconButton>
                <i className="bi bi-gear-wide-connected" style={{ fontSize: 14, marginRight: 6, color: '#6D28D9' }} />
                <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: 0.5, color: 'text.secondary' }}>
                    Async Tasks (Celery)
                </Typography>
                <Box sx={{ flex: 1 }} />
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                    Background tasks and their result — separate from HTTP request/response
                </Typography>
            </Box>

            <Collapse in={open}>
                <Box sx={{ px: 2, pb: 2, borderTop: '1px solid #E5E7EB' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, my: 1.5, flexWrap: 'wrap' }}>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                            {WINDOWS.map((w) => (
                                <Button key={w.hours} size="small" variant={hours === w.hours ? 'contained' : 'outlined'}
                                    onClick={() => setHours(w.hours)} sx={{ fontSize: '0.7rem', textTransform: 'none', minWidth: 0, py: 0.25, px: 1 }}>
                                    {w.label}
                                </Button>
                            ))}
                        </Box>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                            {STATES.map((s) => (
                                <Button key={s.value} size="small" variant={state === s.value ? 'contained' : 'outlined'}
                                    onClick={() => setState(s.value)} sx={{ fontSize: '0.7rem', textTransform: 'none', minWidth: 0, py: 0.25, px: 1 }}>
                                    {s.label}
                                </Button>
                            ))}
                        </Box>
                        <Button size="small" variant={slowOnly ? 'contained' : 'outlined'} onClick={() => setSlowOnly((v) => !v)}
                            sx={{ fontSize: '0.68rem', textTransform: 'none', py: 0.25 }}>
                            {slowOnly ? '✓ ' : ''}slow only (&gt;5s)
                        </Button>
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

                    {!error && tasks.length === 0 && !loading && (
                        <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary', py: 1 }}>
                            No Celery tasks{state ? ` with state ${state}` : ''}{slowOnly ? ' slower than 5s' : ''} in the last {WINDOWS.find((w) => w.hours === hours)?.label}.
                        </Typography>
                    )}

                    {tasks.length > 0 && (
                        <Box sx={{ overflowX: 'auto' }}>
                            <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                                <Box component="thead">
                                    <Box component="tr" sx={{ '& th': { textAlign: 'left', py: 0.5, px: 1, borderBottom: '1px solid #E5E7EB', color: '#6B7280', fontWeight: 700, fontSize: '0.66rem', textTransform: 'uppercase', whiteSpace: 'nowrap' } }}>
                                        <th>Time</th>
                                        <th>Task</th>
                                        <th>Result</th>
                                        <th style={{ textAlign: 'right' }}>Elapsed</th>
                                        <th style={{ textAlign: 'right' }}>Mem Δ</th>
                                        <th style={{ textAlign: 'right' }}>Queries</th>
                                        <th></th>
                                    </Box>
                                </Box>
                                <Box component="tbody">
                                    {tasks.map((t, i) => (
                                        <TaskRow key={i} t={t} />
                                    ))}
                                </Box>
                            </Box>
                        </Box>
                    )}
                </Box>
            </Collapse>
        </Box>
    );
};

const TaskRow: React.FC<{ t: IAsyncTask }> = ({ t }) => {
    const chip = stateChip(t.state);
    const slow = (t.elapsed_s ?? 0) >= 5;
    const bigMem = (t.mem_delta_mb ?? 0) >= 50;
    return (
        <Box component="tr" sx={{ '& td': { py: 0.5, px: 1, borderBottom: '1px solid #F3F4F6', verticalAlign: 'top' } }}>
            <td style={{ color: '#6B7280', whiteSpace: 'nowrap', fontSize: '0.72rem' }}>{fmtTime(t.ts)}</td>
            <td>
                <Tooltip title={t.task || ''}>
                    <code style={{ fontSize: '0.74rem' }}>{shortTask(t.task)}</code>
                </Tooltip>
                {t.n_plus_1 && t.n_plus_1 !== 'null' && (
                    <Chip label="N+1" size="small" sx={{ ml: 0.5, height: 15, fontSize: '0.58rem', backgroundColor: '#F5F3FF', color: '#6D28D9' }} />
                )}
            </td>
            <td>
                <Chip label={t.state} size="small" sx={{ height: 18, fontSize: '0.62rem', fontWeight: 700, backgroundColor: chip.bg, color: chip.fg }} />
            </td>
            <td style={{ textAlign: 'right', color: slow ? '#C2410C' : '#374151', fontWeight: slow ? 700 : 400 }}>
                {t.elapsed_s != null ? `${t.elapsed_s.toFixed(2)}s` : '—'}
            </td>
            <td style={{ textAlign: 'right', color: bigMem ? '#B91C1C' : '#6B7280', fontWeight: bigMem ? 700 : 400 }}>
                {t.mem_delta_mb != null ? `${t.mem_delta_mb >= 0 ? '+' : ''}${Math.round(t.mem_delta_mb)}MB` : '—'}
            </td>
            <td style={{ textAlign: 'right', color: '#6B7280' }}>{t.db_queries ?? '—'}</td>
            <td style={{ color: '#7F1D1D', fontSize: '0.7rem', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {t.error && t.error !== 'null' ? t.error : ''}
            </td>
        </Box>
    );
};

export default React.memo(AsyncTasksPanel);

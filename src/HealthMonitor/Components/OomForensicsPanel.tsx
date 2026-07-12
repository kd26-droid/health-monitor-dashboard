import React, { useState, useCallback } from 'react';
import { Box, Typography, Collapse, IconButton, TextField, Button, FormControlLabel, Checkbox } from '@mui/material';
import { IOomReport } from '../Interfaces/healthMonitor.types';
import { fetchOomReport } from '../Services/healthMonitor.service';

interface OomForensicsPanelProps {
    isConnected: boolean;
}

type TLookupField = 'worker_id' | 'task' | 'pid';

const OomForensicsPanel: React.FC<OomForensicsPanelProps> = ({ isConnected }) => {
    const [open, setOpen] = useState(false);
    const [field, setField] = useState<TLookupField>('worker_id');
    const [value, setValue] = useState('');
    const [withClarity, setWithClarity] = useState(false);
    const [report, setReport] = useState<IOomReport | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadReport = useCallback(async () => {
        if (!isConnected || !value.trim()) return;
        setLoading(true);
        setError(null);
        try {
            const params: any =
                field === 'pid'
                    ? { pid: Number(value.trim()) }
                    : { [field]: value.trim() };
            if (withClarity) params.clarity = 1;
            const res = await fetchOomReport(params);
            setReport(res.report);
            if (!res.report.worker.entries_seen) {
                setError('No log entries found for that worker/task/pid in the recent window.');
            }
        } catch (err: any) {
            setError(err?.message || 'Failed to reconstruct OOM report');
            setReport(null);
        } finally {
            setLoading(false);
        }
    }, [isConnected, field, value, withClarity]);

    const w = report?.worker;

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
                    <i className={`bi bi-chevron-${open ? 'down' : 'right'}`} style={{ fontSize: 12 }} />
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
                    OOM Forensics
                </Typography>
                <Box sx={{ flex: 1 }} />
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                    Reconstruct what a worker was doing when it died
                </Typography>
            </Box>

            <Collapse in={open}>
                <Box sx={{ px: 2, pb: 2, borderTop: '1px solid #E5E7EB' }}>
                    {/* Lookup form */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, my: 1.5, flexWrap: 'wrap' }}>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                            {(['worker_id', 'task', 'pid'] as TLookupField[]).map((f) => (
                                <Button
                                    key={f}
                                    size="small"
                                    variant={field === f ? 'contained' : 'outlined'}
                                    onClick={() => setField(f)}
                                    sx={{ fontSize: '0.7rem', textTransform: 'none', minWidth: 0, py: 0.25 }}
                                >
                                    {f}
                                </Button>
                            ))}
                        </Box>
                        <TextField
                            size="small"
                            placeholder={
                                field === 'worker_id'
                                    ? 'e.g. a1b2c3d4-w2'
                                    : field === 'task'
                                    ? 'e.g. a1b2c3d4'
                                    : 'e.g. 1234'
                            }
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && loadReport()}
                            sx={{ minWidth: 220, '& input': { fontSize: '0.78rem', py: 0.75 } }}
                        />
                        <Button
                            size="small"
                            variant="contained"
                            disabled={loading || !value.trim()}
                            onClick={loadReport}
                            sx={{ fontSize: '0.72rem', textTransform: 'none' }}
                        >
                            {loading ? 'Reconstructing…' : 'Reconstruct'}
                        </Button>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    size="small"
                                    checked={withClarity}
                                    onChange={(e) => setWithClarity(e.target.checked)}
                                />
                            }
                            label="Clarity signals"
                            title="Pull Clarity behaviour signals (rate-limited API — use sparingly)"
                            sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.72rem', color: 'text.secondary' } }}
                        />
                    </Box>

                    {error && (
                        <Box sx={{ backgroundColor: '#FEF3C7', p: 1.5, borderRadius: 1, mb: 1 }}>
                            <Typography variant="body2" sx={{ fontSize: '0.8rem', color: '#92400E' }}>
                                {error}
                            </Typography>
                        </Box>
                    )}

                    {report && w && w.entries_seen > 0 && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            {/* Worker */}
                            <Section title="Worker">
                                <KV k="Worker" v={<code>{w.worker_id || '—'}</code>} />
                                {w.ecs_task && <KV k="ECS task / slot" v={`${w.ecs_task} / ${w.slot ?? '?'}`} />}
                                <KV k="PID" v={String(w.pid ?? '—')} />
                                <KV k="Died" v={w.dead_ts || 'unknown'} />
                                <KV k="Entries reconstructed" v={String(w.entries_seen)} />
                            </Section>

                            {/* What happened */}
                            <Section title="What was happening">
                                <KV
                                    k="Last successful request"
                                    v={
                                        report.last_successful_request
                                            ? `${report.last_successful_request}${report.last_successful_at ? ` (${report.last_successful_at})` : ''}`
                                            : '—'
                                    }
                                />
                                {report.in_flight_requests.length > 0 ? (
                                    <Box sx={{ mt: 0.5 }}>
                                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#B91C1C' }}>
                                            In-flight when killed ({report.in_flight_requests.length}) — likely the trigger:
                                        </Typography>
                                        {report.in_flight_requests.map((r, i) => (
                                            <Typography key={i} sx={{ fontSize: '0.75rem', ml: 1 }}>
                                                • <code>{r.what}</code>{' '}
                                                <span style={{ color: '#6B7280' }}>
                                                    (ent {r.enterprise_id ?? '—'}, user {r.user_id ?? '—'})
                                                </span>
                                            </Typography>
                                        ))}
                                    </Box>
                                ) : (
                                    <KV k="In-flight when killed" v="none captured" />
                                )}
                            </Section>

                            {/* Memory */}
                            <Section title="Memory">
                                <KV k="Peak RSS" v={w && report.memory.peak_mb != null ? `${report.memory.peak_mb} MB` : '—'} />
                                {report.memory.biggest_jump && (
                                    <KV
                                        k="Biggest single-request jump"
                                        v={`+${report.memory.biggest_jump.mem_delta_mb} MB on ${report.memory.biggest_jump.what}`}
                                    />
                                )}
                            </Section>

                            {/* Suspected cause */}
                            <Section title="Suspected cause">
                                {report.prime_suspect ? (
                                    <Box
                                        sx={{
                                            backgroundColor: '#FEF2F2',
                                            border: '1px solid #FECACA',
                                            borderRadius: 1,
                                            p: 1,
                                        }}
                                    >
                                        <Typography sx={{ fontSize: '0.78rem', fontWeight: 600 }}>
                                            <code>{report.prime_suspect.what}</code>{' '}
                                            <span style={{ color: '#9CA3AF' }}>(score {report.prime_suspect.score})</span>
                                        </Typography>
                                        {report.prime_suspect.reasons.map((r, i) => (
                                            <Typography key={i} sx={{ fontSize: '0.73rem', color: '#7F1D1D', ml: 1 }}>
                                                • {r}
                                            </Typography>
                                        ))}
                                    </Box>
                                ) : (
                                    <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>
                                        No standout suspect — memory likely grew gradually across many requests.
                                    </Typography>
                                )}
                            </Section>

                            {/* Correlated session */}
                            <Section title="Correlated session">
                                {report.session.frontend_session_id ? (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                        <KV k="session_id" v={<code>{report.session.frontend_session_id}</code>} />
                                        {report.session.clarity_url && (
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                href={report.session.clarity_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                sx={{ fontSize: '0.7rem', textTransform: 'none' }}
                                            >
                                                ▶ Clarity replay
                                            </Button>
                                        )}
                                        {report.session.bugsink_url && (
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                href={report.session.bugsink_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                sx={{ fontSize: '0.7rem', textTransform: 'none' }}
                                            >
                                                🐛 Bugsink
                                            </Button>
                                        )}
                                    </Box>
                                ) : (
                                    <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>
                                        No frontend session id on the killed requests (background task or unauthenticated path).
                                    </Typography>
                                )}
                            </Section>

                            {/* Clarity behaviour signals (only when ?clarity=1 was requested) */}
                            {report.clarity_insights && (
                                <Section title={`Clarity behaviour signals (last ${report.clarity_insights.num_days}d, project-wide)`}>
                                    {report.clarity_insights.top_signals.length > 0 ? (
                                        report.clarity_insights.top_signals.slice(0, 6).map((s, i) => (
                                            <Typography key={i} sx={{ fontSize: '0.75rem' }}>
                                                <b>{s.metric}</b> ×{s.occurrences}{' '}
                                                <span style={{ color: '#6B7280' }}>({s.sessions} sessions)</span>{' '}
                                                — <code style={{ fontSize: '0.7rem' }}>{s.url}</code>
                                            </Typography>
                                        ))
                                    ) : (
                                        <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>
                                            No notable behavioural signals.
                                        </Typography>
                                    )}
                                </Section>
                            )}
                        </Box>
                    )}
                </Box>
            </Collapse>
        </Box>
    );
};

// ── Helper presentational components ──

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <Box>
        <Typography
            variant="caption"
            sx={{ fontWeight: 700, fontSize: '0.68rem', color: 'text.secondary', textTransform: 'uppercase' }}
        >
            {title}
        </Typography>
        <Box sx={{ mt: 0.25 }}>{children}</Box>
    </Box>
);

const KV: React.FC<{ k: string; v: React.ReactNode }> = ({ k, v }) => (
    <Typography sx={{ fontSize: '0.78rem' }}>
        <span style={{ color: '#6B7280' }}>{k}:</span> {v}
    </Typography>
);

export default React.memo(OomForensicsPanel);

import React from 'react';
import { Box, Typography } from '@mui/material';
import { ILogEntry } from '../../Interfaces/healthMonitor.types';
import { formatElapsed } from '../../Utils/formatters';
import { getTimingExplanation } from '../../Utils/explanations';

interface TimingBreakdownProps {
    entry: ILogEntry;
}

const TimingBreakdown: React.FC<TimingBreakdownProps> = ({ entry }) => {
    const { elapsed_s, db_time_s, app_time_s, db_time_pct, app_time_pct, outgoing_time_s, outgoing_time_pct } = entry;

    // Use backend percentages when available; fall back to client-side calculation
    const hasOutgoing = outgoing_time_s != null && outgoing_time_s > 0;
    const dbPct = db_time_pct != null ? Math.round(db_time_pct) : (elapsed_s > 0 ? Math.round((db_time_s / elapsed_s) * 100) : 0);
    const extPct = outgoing_time_pct != null ? Math.round(outgoing_time_pct) : 0;
    const appPct = app_time_pct != null ? Math.round(app_time_pct) : (100 - dbPct - extPct);

    const explanation = getTimingExplanation(elapsed_s, db_time_s);

    const Segment: React.FC<{ pct: number; color: string; label: string }> = ({ pct, color, label }) => (
        pct > 0 ? (
            <Box
                sx={{
                    width: `${pct}%`,
                    backgroundColor: color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: pct > 0 ? 2 : 0,
                }}
            >
                {pct >= 12 && (
                    <Typography variant="caption" sx={{ color: '#FFF', fontSize: '0.62rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {label} {pct}%
                    </Typography>
                )}
            </Box>
        ) : null
    );

    return (
        <Box>
            <Typography
                variant="caption"
                sx={{
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: 'text.secondary',
                    fontSize: '0.7rem',
                    letterSpacing: 0.5,
                }}
            >
                Timing Breakdown
            </Typography>

            <Typography
                variant="h6"
                sx={{ fontWeight: 700, mt: 1, fontSize: '1.1rem' }}
            >
                {formatElapsed(elapsed_s)} total
            </Typography>

            {/* Stacked bar: DB (blue) | External (orange) | App (gray) */}
            {elapsed_s > 0 && (
                <Box
                    sx={{
                        display: 'flex',
                        height: 20,
                        borderRadius: 1,
                        overflow: 'hidden',
                        mt: 1.5,
                        mb: 1,
                    }}
                >
                    <Segment pct={dbPct} color="#3B82F6" label="DB" />
                    <Segment pct={extPct} color="#F97316" label="Ext" />
                    <Segment pct={appPct} color="#6B7280" label="App" />
                </Box>
            )}

            <Typography variant="body2" sx={{ fontSize: '0.8rem', mb: 1.5 }}>
                <span style={{ color: '#3B82F6', fontWeight: 600 }}>DB</span> {formatElapsed(db_time_s)} ({dbPct}%)
                {hasOutgoing && (
                    <>&nbsp;&nbsp;<span style={{ color: '#F97316', fontWeight: 600 }}>Ext</span> {formatElapsed(outgoing_time_s!)} ({extPct}%)</>
                )}
                &nbsp;&nbsp;<span style={{ color: '#6B7280', fontWeight: 600 }}>App</span> {formatElapsed(app_time_s)} ({appPct}%)
            </Typography>

            {/* Explanation */}
            <Box
                sx={{
                    backgroundColor: '#F0F9FF',
                    borderLeft: '3px solid #3B82F6',
                    borderRadius: '0 4px 4px 0',
                    p: 1.5,
                }}
            >
                <Typography variant="body2" sx={{ fontSize: '0.8rem', lineHeight: 1.5 }}>
                    {explanation}
                </Typography>
            </Box>
        </Box>
    );
};

export default TimingBreakdown;

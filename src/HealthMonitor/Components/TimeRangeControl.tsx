import React, { useState } from 'react';
import { Box, Button, TextField } from '@mui/material';

// Shared time-range picker for the forensics panels: preset windows PLUS a
// custom from/to range, mirroring the live-log historical mode. When a custom
// range is set it overrides the preset.
export interface ITimeRange {
    hours: number;       // relative window, used when fromTs/toTs are empty
    fromTs?: string;     // datetime-local value (local time)
    toTs?: string;
}

interface Preset {
    label: string;
    hours: number;
}

const DEFAULT_PRESETS: Preset[] = [
    { label: '1h', hours: 1 },
    { label: '6h', hours: 6 },
    { label: '24h', hours: 24 },
    { label: '3d', hours: 72 },
    { label: '7d', hours: 168 },
];

interface Props {
    value: ITimeRange;
    onChange: (r: ITimeRange) => void;
    presets?: Preset[];
}

// Convert a datetime-local value (local time) to a UTC ISO string for the API.
// The backend filters on Azure ingestion time (real UTC), so this is accurate
// regardless of any container-clock skew.
export function toUtcIso(local?: string): string | undefined {
    if (!local) return undefined;
    const d = new Date(local);
    return isNaN(d.getTime()) ? undefined : d.toISOString();
}

const TimeRangeControl: React.FC<Props> = ({ value, onChange, presets = DEFAULT_PRESETS }) => {
    const [showCustom, setShowCustom] = useState(Boolean(value.fromTs && value.toTs));
    const [from, setFrom] = useState(value.fromTs || '');
    const [to, setTo] = useState(value.toTs || '');

    const isCustom = Boolean(value.fromTs && value.toTs);

    const applyPreset = (hours: number) => {
        onChange({ hours });          // drops any custom range
    };

    const applyCustom = () => {
        if (from && to) onChange({ hours: value.hours, fromTs: from, toTs: to });
    };

    const clearCustom = () => {
        setFrom('');
        setTo('');
        onChange({ hours: value.hours }); // back to the preset window
    };

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
                {presets.map((p) => (
                    <Button
                        key={p.hours}
                        size="small"
                        variant={!isCustom && value.hours === p.hours ? 'contained' : 'outlined'}
                        onClick={() => applyPreset(p.hours)}
                        sx={{ fontSize: '0.7rem', textTransform: 'none', minWidth: 0, py: 0.25, px: 1 }}
                    >
                        {p.label}
                    </Button>
                ))}
            </Box>

            <Button
                size="small"
                variant={isCustom ? 'contained' : 'outlined'}
                onClick={() => setShowCustom((v) => !v)}
                sx={{ fontSize: '0.68rem', textTransform: 'none', py: 0.25 }}
            >
                <i className="bi bi-calendar-range" style={{ marginRight: 4, fontSize: 12 }} />
                {isCustom ? 'custom range ✓' : 'custom range'}
            </Button>

            {showCustom && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
                    <TextField
                        type="datetime-local"
                        size="small"
                        label="from"
                        InputLabelProps={{ shrink: true }}
                        value={from}
                        onChange={(e) => setFrom(e.target.value)}
                        sx={{ '& input': { fontSize: '0.72rem', py: 0.6 }, '& label': { fontSize: '0.72rem' } }}
                    />
                    <TextField
                        type="datetime-local"
                        size="small"
                        label="to"
                        InputLabelProps={{ shrink: true }}
                        value={to}
                        onChange={(e) => setTo(e.target.value)}
                        sx={{ '& input': { fontSize: '0.72rem', py: 0.6 }, '& label': { fontSize: '0.72rem' } }}
                    />
                    <Button size="small" variant="contained" disabled={!from || !to} onClick={applyCustom}
                        sx={{ fontSize: '0.68rem', textTransform: 'none', py: 0.25 }}>
                        Apply
                    </Button>
                    {isCustom && (
                        <Button size="small" variant="text" onClick={clearCustom}
                            sx={{ fontSize: '0.68rem', textTransform: 'none', py: 0.25, color: '#6B7280' }}>
                            Clear
                        </Button>
                    )}
                </Box>
            )}
        </Box>
    );
};

export default TimeRangeControl;

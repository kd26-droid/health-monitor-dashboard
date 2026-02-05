import React from 'react';
import {
    Box,
    TextField,
    Select,
    MenuItem,
    Button,
    Typography,
    InputAdornment,
} from '@mui/material';
import {
    TEventType,
    THttpMethod,
} from '../Interfaces/healthMonitor.types';
import {
    EVENT_OPTIONS,
    METHOD_OPTIONS,
} from '../Constants/healthMonitor.constants';

interface ToolbarProps {
    search: string;
    event: TEventType | '';
    method: THttpMethod | '';
    fromTs: string;
    toTs: string;
    entryCount: number;
    isLive: boolean;
    isLoading: boolean;
    onSearchChange: (value: string) => void;
    onEventChange: (value: TEventType | '') => void;
    onMethodChange: (value: THttpMethod | '') => void;
    onFromTsChange: (value: string) => void;
    onToTsChange: (value: string) => void;
    onToggleLive: () => void;
    onClear: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({
    search,
    event,
    method,
    fromTs,
    toTs,
    entryCount,
    isLive,
    isLoading,
    onSearchChange,
    onEventChange,
    onMethodChange,
    onFromTsChange,
    onToTsChange,
    onToggleLive,
    onClear,
}) => {
    return (
        <Box
            sx={{
                position: 'sticky',
                top: 48,
                zIndex: 90,
                height: 56,
                backgroundColor: '#FFFFFF',
                borderBottom: '1px solid #E5E7EB',
                display: 'flex',
                alignItems: 'center',
                px: 3,
                gap: 1.5,
                flexShrink: 0,
            }}
        >
            {/* Search */}
            <TextField
                size="small"
                placeholder="Search APIs, paths, errors..."
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                sx={{ width: 260 }}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <i
                                className="bi bi-search"
                                style={{
                                    fontSize: 14,
                                    color: '#9CA3AF',
                                }}
                            />
                        </InputAdornment>
                    ),
                    sx: { fontSize: '0.85rem', height: 36 },
                }}
            />

            {/* Event filter */}
            <Select
                size="small"
                value={event}
                onChange={(e) =>
                    onEventChange(e.target.value as TEventType | '')
                }
                displayEmpty
                sx={{ minWidth: 130, height: 36, fontSize: '0.85rem' }}
            >
                {EVENT_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                    </MenuItem>
                ))}
            </Select>

            {/* Method filter */}
            <Select
                size="small"
                value={method}
                onChange={(e) =>
                    onMethodChange(e.target.value as THttpMethod | '')
                }
                displayEmpty
                sx={{ minWidth: 120, height: 36, fontSize: '0.85rem' }}
            >
                {METHOD_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                    </MenuItem>
                ))}
            </Select>

            {/* From timestamp */}
            <input
                type="datetime-local"
                value={fromTs}
                onChange={(e) => onFromTsChange(e.target.value)}
                style={{
                    height: 36,
                    padding: '0 8px',
                    border: '1px solid #D1D5DB',
                    borderRadius: 4,
                    fontSize: '0.8rem',
                    color: fromTs ? '#1F2937' : '#9CA3AF',
                    backgroundColor: '#FFFFFF',
                }}
                title="From"
            />

            {/* To timestamp */}
            <input
                type="datetime-local"
                value={toTs}
                onChange={(e) => onToTsChange(e.target.value)}
                style={{
                    height: 36,
                    padding: '0 8px',
                    border: '1px solid #D1D5DB',
                    borderRadius: 4,
                    fontSize: '0.8rem',
                    color: toTs ? '#1F2937' : '#9CA3AF',
                    backgroundColor: '#FFFFFF',
                }}
                title="To"
            />

            {/* Spacer */}
            <Box sx={{ flex: 1 }} />

            {/* Entry count */}
            <Typography
                variant="body2"
                sx={{ color: 'text.secondary', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
            >
                {entryCount.toLocaleString()} entries
            </Typography>

            {/* LIVE / PAUSED */}
            <Button
                size="small"
                variant="contained"
                onClick={onToggleLive}
                sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    minWidth: 80,
                    height: 32,
                    backgroundColor: isLive ? '#10B981' : '#F59E0B',
                    '&:hover': {
                        backgroundColor: isLive ? '#059669' : '#D97706',
                    },
                }}
            >
                {isLive ? (
                    <>
                        <Box
                            sx={{
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                backgroundColor: '#FFFFFF',
                                mr: 0.75,
                                animation: 'pulse 1.5s infinite',
                                '@keyframes pulse': {
                                    '0%, 100%': { opacity: 1 },
                                    '50%': { opacity: 0.4 },
                                },
                            }}
                        />
                        LIVE
                    </>
                ) : (
                    'PAUSED'
                )}
            </Button>

            {/* Clear */}
            <Button
                size="small"
                variant="outlined"
                onClick={onClear}
                sx={{
                    textTransform: 'none',
                    fontSize: '0.8rem',
                    height: 32,
                    color: '#6B7280',
                    borderColor: '#D1D5DB',
                }}
            >
                Clear
            </Button>
        </Box>
    );
};

export default React.memo(Toolbar);

import React from 'react';
import {
    Box,
    TextField,
    Select,
    MenuItem,
    Button,
    Typography,
    InputAdornment,
    Chip,
    Tooltip,
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
    source: 'buffer' | 'database';
    isHistoricalMode: boolean;
    onSearchChange: (value: string) => void;
    onEventChange: (value: TEventType | '') => void;
    onMethodChange: (value: THttpMethod | '') => void;
    onFromTsChange: (value: string) => void;
    onToTsChange: (value: string) => void;
    onToggleLive: () => void;
    onClear: () => void;
    onEnterHistorical: (from: string, to: string) => void;
    onExitHistorical: () => void;
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
    source,
    isHistoricalMode,
    onSearchChange,
    onEventChange,
    onMethodChange,
    onFromTsChange,
    onToTsChange,
    onToggleLive,
    onClear,
    onEnterHistorical,
    onExitHistorical,
}) => {
    const canQueryHistorical = fromTs && !isHistoricalMode;

    const handleQueryHistorical = () => {
        if (fromTs) {
            onEnterHistorical(fromTs, toTs);
        }
    };

    const handleBackToLive = () => {
        onFromTsChange('');
        onToTsChange('');
        onExitHistorical();
    };

    return (
        <Box
            sx={{
                position: 'sticky',
                top: 48,
                zIndex: 90,
                minHeight: 56,
                backgroundColor: '#FFFFFF',
                borderBottom: '1px solid #E5E7EB',
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                px: 3,
                py: 1,
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
                disabled={isHistoricalMode}
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
                disabled={isHistoricalMode}
            />

            {/* Query Historical button */}
            {canQueryHistorical && (
                <Button
                    size="small"
                    variant="contained"
                    onClick={handleQueryHistorical}
                    sx={{
                        textTransform: 'none',
                        fontWeight: 600,
                        fontSize: '0.8rem',
                        height: 32,
                        backgroundColor: '#6366F1',
                        '&:hover': { backgroundColor: '#4F46E5' },
                    }}
                >
                    Query History
                </Button>
            )}

            {/* Spacer */}
            <Box sx={{ flex: 1 }} />

            {/* Mode indicator */}
            {isHistoricalMode ? (
                <Tooltip title="Viewing historical data from database. Only errors, slow requests, N+1, and deadlocks are stored." arrow>
                    <Chip
                        label="HISTORICAL"
                        size="small"
                        sx={{
                            backgroundColor: '#EDE9FE',
                            color: '#6D28D9',
                            fontWeight: 700,
                            fontSize: '0.7rem',
                        }}
                    />
                </Tooltip>
            ) : (
                <Chip
                    label={source === 'buffer' ? 'LIVE' : 'DB'}
                    size="small"
                    sx={{
                        backgroundColor: source === 'buffer' ? '#D1FAE5' : '#EDE9FE',
                        color: source === 'buffer' ? '#065F46' : '#6D28D9',
                        fontWeight: 600,
                        fontSize: '0.7rem',
                    }}
                />
            )}

            {/* Entry count */}
            <Typography
                variant="body2"
                sx={{ color: 'text.secondary', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
            >
                {entryCount.toLocaleString()} entries
            </Typography>

            {/* LIVE / PAUSED / Back to Live */}
            {isHistoricalMode ? (
                <Button
                    size="small"
                    variant="contained"
                    onClick={handleBackToLive}
                    sx={{
                        textTransform: 'none',
                        fontWeight: 600,
                        fontSize: '0.8rem',
                        minWidth: 100,
                        height: 32,
                        backgroundColor: '#10B981',
                        '&:hover': { backgroundColor: '#059669' },
                    }}
                >
                    Back to Live
                </Button>
            ) : (
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
            )}

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

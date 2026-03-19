import React, { useState } from 'react';
import { Box, Typography, Collapse, IconButton, Select, MenuItem, Button } from '@mui/material';
import { toast } from 'react-toastify';
import { fetchCleanup } from '../Services/healthMonitor.service';
import { getEnvFromPath } from '../Constants/healthMonitor.constants';

interface CleanupPanelProps {
    isConnected: boolean;
}

const CleanupPanel: React.FC<CleanupPanelProps> = ({ isConnected }) => {
    const [open, setOpen] = useState(false);
    const [days, setDays] = useState(30);
    const [loading, setLoading] = useState(false);
    const [lastResult, setLastResult] = useState<{ deleted: number; days: number } | null>(null);

    const envName = getEnvFromPath();

    const handleCleanup = async () => {
        if (!isConnected) return;

        const confirmed = window.confirm(
            `This will permanently delete all monitor logs older than ${days} days on ${envName.toUpperCase()}. Continue?`
        );
        if (!confirmed) return;

        setLoading(true);
        try {
            const result = await fetchCleanup(days);
            setLastResult({ deleted: result.deleted, days: result.retention_days });
            toast.success(`Deleted ${result.deleted} old log entries.`, {
                toastId: 'cleanup-success',
                autoClose: 5000,
            });
        } catch (err: any) {
            toast.error(err.message || 'Cleanup failed.', {
                toastId: 'cleanup-error',
                autoClose: 5000,
            });
        } finally {
            setLoading(false);
        }
    };

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
                    Log Cleanup
                </Typography>
                <Box sx={{ flex: 1 }} />
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                    Delete old logs from database
                </Typography>
            </Box>

            <Collapse in={open}>
                <Box sx={{ px: 2, pb: 2, borderTop: '1px solid #E5E7EB' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, my: 1.5 }}>
                        <Typography variant="caption" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                            Keep logs from the last:
                        </Typography>
                        <Select
                            size="small"
                            value={days}
                            onChange={(e) => setDays(Number(e.target.value))}
                            sx={{ minWidth: 120, fontSize: '0.75rem', height: 28 }}
                        >
                            <MenuItem value={7}>7 days</MenuItem>
                            <MenuItem value={14}>14 days</MenuItem>
                            <MenuItem value={30}>30 days</MenuItem>
                            <MenuItem value={60}>60 days</MenuItem>
                            <MenuItem value={90}>90 days</MenuItem>
                        </Select>
                        <Button
                            variant="contained"
                            size="small"
                            color="error"
                            onClick={handleCleanup}
                            disabled={loading || !isConnected}
                            sx={{
                                textTransform: 'none',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                height: 28,
                            }}
                        >
                            {loading ? 'Deleting...' : 'Delete Old Logs'}
                        </Button>
                    </Box>

                    {lastResult && (
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                            Last cleanup: deleted {lastResult.deleted} entries older than {lastResult.days} days.
                        </Typography>
                    )}

                    <Typography
                        variant="caption"
                        sx={{ display: 'block', mt: 1, color: 'text.secondary', fontSize: '0.7rem' }}
                    >
                        Logs are stored permanently until manually cleaned up. This action is irreversible.
                    </Typography>
                </Box>
            </Collapse>
        </Box>
    );
};

export default React.memo(CleanupPanel);

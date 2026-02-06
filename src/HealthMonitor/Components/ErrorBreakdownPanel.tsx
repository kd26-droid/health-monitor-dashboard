import React, { useState } from 'react';
import {
    Box,
    Typography,
    Collapse,
    IconButton,
    Select,
    MenuItem,
    FormControl,
} from '@mui/material';
import { IErrorsResponse } from '../Interfaces/healthMonitor.types';
import { ERROR_WINDOW_OPTIONS } from '../Constants/healthMonitor.constants';
import { formatElapsed } from '../Utils/formatters';

interface ErrorBreakdownPanelProps {
    errorsData: IErrorsResponse | null;
    windowMinutes: number;
    onWindowChange: (minutes: number) => void;
    isLoading: boolean;
}

const ErrorBreakdownPanel: React.FC<ErrorBreakdownPanelProps> = ({
    errorsData,
    windowMinutes,
    onWindowChange,
    isLoading,
}) => {
    const [open, setOpen] = useState(true);
    const [expandedEndpoint, setExpandedEndpoint] = useState<string | null>(null);

    if (!errorsData) return null;

    const { endpoints, total_entries } = errorsData;
    const sortedEndpoints = [...endpoints].sort((a, b) => b.error_pct - a.error_pct);
    const hasErrors = endpoints.some((e) => e.errors > 0);

    const getRowColor = (errorPct: number): string => {
        if (errorPct > 10) return '#FEE2E2'; // red
        if (errorPct > 0) return '#FEF3C7'; // yellow
        return 'transparent';
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
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    px: 2,
                    py: 1,
                    cursor: 'pointer',
                    '&:hover': { backgroundColor: '#F9FAFB' },
                }}
                onClick={() => setOpen(!open)}
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
                    Error Breakdown by Endpoint
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
                <FormControl size="small" sx={{ mr: 2 }} onClick={(e) => e.stopPropagation()}>
                    <Select
                        value={windowMinutes}
                        onChange={(e) => onWindowChange(e.target.value as number)}
                        sx={{ fontSize: '0.75rem', height: 28 }}
                    >
                        {ERROR_WINDOW_OPTIONS.map((opt) => (
                            <MenuItem key={opt.value} value={opt.value} sx={{ fontSize: '0.75rem' }}>
                                {opt.label}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                    {total_entries} requests • {endpoints.length} endpoints
                    {isLoading && ' • Loading...'}
                </Typography>
            </Box>

            <Collapse in={open}>
                <Box sx={{ borderTop: '1px solid #E5E7EB', overflow: 'auto' }}>
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
                                <ThCell align="right">Error%</ThCell>
                                <ThCell align="right">Slow</ThCell>
                                <ThCell align="right">N+1</ThCell>
                                <ThCell align="right">Avg Time</ThCell>
                                <ThCell align="right">Max Time</ThCell>
                                <ThCell align="right">Avg Queries</ThCell>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedEndpoints.length === 0 ? (
                                <tr>
                                    <Box
                                        component="td"
                                        colSpan={9}
                                        sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}
                                    >
                                        No endpoint data in this time window.
                                    </Box>
                                </tr>
                            ) : (
                                sortedEndpoints.map((ep) => (
                                    <React.Fragment key={ep.endpoint}>
                                        <Box
                                            component="tr"
                                            onClick={() =>
                                                setExpandedEndpoint(
                                                    expandedEndpoint === ep.endpoint ? null : ep.endpoint
                                                )
                                            }
                                            sx={{
                                                backgroundColor: getRowColor(ep.error_pct),
                                                cursor: 'pointer',
                                                '&:hover': { filter: 'brightness(0.97)' },
                                            }}
                                        >
                                            <TdCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <i
                                                        className={`bi bi-chevron-${
                                                            expandedEndpoint === ep.endpoint ? 'down' : 'right'
                                                        }`}
                                                        style={{ fontSize: 10, marginRight: 6, color: '#6B7280' }}
                                                    />
                                                    <code style={{ fontSize: '0.72rem' }}>{ep.endpoint}</code>
                                                </Box>
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
                                                        color: ep.error_pct > 10 ? '#DC2626' : ep.error_pct > 0 ? '#D97706' : 'inherit',
                                                        fontWeight: ep.error_pct > 0 ? 600 : 400,
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
                                                <span style={{ color: ep.n_plus_1_count > 0 ? '#7C3AED' : 'inherit' }}>
                                                    {ep.n_plus_1_count}
                                                </span>
                                            </TdCell>
                                            <TdCell align="right">{formatElapsed(ep.avg_time_s)}</TdCell>
                                            <TdCell align="right">{formatElapsed(ep.max_time_s)}</TdCell>
                                            <TdCell align="right">{Math.round(ep.avg_db_queries)}</TdCell>
                                        </Box>
                                        {expandedEndpoint === ep.endpoint && (
                                            <tr>
                                                <Box
                                                    component="td"
                                                    colSpan={9}
                                                    sx={{ backgroundColor: '#F9FAFB', p: 1.5, pl: 4 }}
                                                >
                                                    <ErrorTypesDetail errorTypes={ep.error_types} />
                                                </Box>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))
                            )}
                        </tbody>
                    </Box>
                </Box>
            </Collapse>
        </Box>
    );
};

// ── Helper components ──

const ThCell: React.FC<{ children: React.ReactNode; align?: 'left' | 'right' }> = ({
    children,
    align = 'left',
}) => (
    <Box
        component="th"
        sx={{
            textAlign: align,
            p: '8px 12px',
            borderBottom: '2px solid #E5E7EB',
            fontSize: '0.7rem',
            fontWeight: 700,
            color: 'text.secondary',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
        }}
    >
        {children}
    </Box>
);

const TdCell: React.FC<{ children: React.ReactNode; align?: 'left' | 'right' }> = ({
    children,
    align = 'left',
}) => (
    <Box
        component="td"
        sx={{
            textAlign: align,
            p: '8px 12px',
            borderBottom: '1px solid #F3F4F6',
            whiteSpace: 'nowrap',
        }}
    >
        {children}
    </Box>
);

const ErrorTypesDetail: React.FC<{ errorTypes: { [key: string]: number } }> = ({ errorTypes }) => {
    const entries = Object.entries(errorTypes);
    if (entries.length === 0) {
        return (
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                No error breakdown available.
            </Typography>
        );
    }

    return (
        <Box>
            <Typography
                variant="caption"
                sx={{
                    fontWeight: 700,
                    fontSize: '0.68rem',
                    color: 'text.secondary',
                    textTransform: 'uppercase',
                    display: 'block',
                    mb: 0.5,
                }}
            >
                Error Types
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {entries.map(([type, count]) => (
                    <Box
                        key={type}
                        sx={{
                            backgroundColor: '#FEE2E2',
                            color: '#991B1B',
                            px: 1,
                            py: 0.25,
                            borderRadius: 0.5,
                            fontSize: '0.72rem',
                            fontWeight: 500,
                        }}
                    >
                        {type}: {count}
                    </Box>
                ))}
            </Box>
        </Box>
    );
};

export default React.memo(ErrorBreakdownPanel);

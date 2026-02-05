import React from 'react';
import { Box, Typography } from '@mui/material';
import {
    IHealthResponse,
    IDbResponse,
    ISystemResponse,
} from '../Interfaces/healthMonitor.types';

interface HealthBannerProps {
    healthData: IHealthResponse | null;
    dbData: IDbResponse | null;
    systemData: ISystemResponse | null;
    lastUpdated: Date | null;
    isConnected: boolean;
}

const STATUS_DOT_COLORS: Record<string, string> = {
    healthy: '#34C759',
    degraded: '#FF9500',
    unhealthy: '#FF3B30',
};

const HealthBanner: React.FC<HealthBannerProps> = ({
    healthData,
    dbData,
    systemData,
    lastUpdated,
    isConnected,
}) => {
    const status = healthData?.status;
    const dotColor = status
        ? STATUS_DOT_COLORS[status] || '#8E8E93'
        : '#8E8E93';
    const statusLabel = status
        ? status.toUpperCase()
        : isConnected
        ? 'CONNECTING...'
        : 'DISCONNECTED';

    const dbConns = dbData
        ? `${dbData.total_connections} / ${dbData.max_connections}`
        : '--';
    const blockedQueries = healthData?.checks?.blocked_queries ?? null;
    const deadlocksTotal = healthData?.checks?.deadlocks_total ?? null;
    const ram = systemData
        ? `${systemData.system.ram_used_percent.toFixed(1)}%`
        : '--';
    const cpu = systemData
        ? `${systemData.system.cpu_percent.toFixed(1)}%`
        : '--';
    const dbSize = dbData?.database_size || '--';
    const updated = lastUpdated
        ? lastUpdated.toLocaleTimeString('en-US', {
              hour12: true,
              hour: 'numeric',
              minute: '2-digit',
              second: '2-digit',
          })
        : '--';

    return (
        <Box
            sx={{
                position: 'sticky',
                top: 0,
                zIndex: 100,
                height: 48,
                backgroundColor: '#1A1A2E',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                px: 3,
                gap: 1.5,
                flexShrink: 0,
            }}
        >
            {/* Status dot */}
            <Box
                sx={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    backgroundColor: dotColor,
                    flexShrink: 0,
                    boxShadow: status
                        ? `0 0 6px ${dotColor}`
                        : 'none',
                }}
            />

            <Typography
                variant="body2"
                sx={{ fontWeight: 700, fontSize: '0.8rem', mr: 1 }}
            >
                {statusLabel}
            </Typography>

            <Separator />

            <Stat
                label="DB"
                value={
                    blockedQueries != null && blockedQueries > 0
                        ? `${dbConns} conn, ${blockedQueries} blocked`
                        : `${dbConns} connections`
                }
                alert={blockedQueries != null && blockedQueries > 0}
            />
            <Separator />
            <Stat
                label="Deadlocks"
                value={deadlocksTotal != null ? String(deadlocksTotal) : '--'}
                alert={deadlocksTotal != null && deadlocksTotal > 0}
            />
            <Separator />
            <Stat label="RAM" value={ram} />
            <Separator />
            <Stat label="CPU" value={cpu} />
            <Separator />
            <Stat label="DB Size" value={dbSize} />

            <Box sx={{ flex: 1 }} />

            <Typography
                variant="caption"
                sx={{ opacity: 0.6, fontSize: '0.75rem' }}
            >
                Updated {updated}
            </Typography>
        </Box>
    );
};

const Separator: React.FC = () => (
    <Box
        sx={{
            width: 1,
            height: 20,
            backgroundColor: 'rgba(255,255,255,0.2)',
            mx: 0.5,
        }}
    />
);

const Stat: React.FC<{ label: string; value: string; alert?: boolean }> = ({
    label,
    value,
    alert,
}) => (
    <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
        <span style={{ opacity: 0.6 }}>{label}:</span>{' '}
        <span
            style={{
                fontWeight: 600,
                color: alert ? '#FCA5A5' : 'inherit',
            }}
        >
            {value}
        </span>
    </Typography>
);

export default React.memo(HealthBanner);

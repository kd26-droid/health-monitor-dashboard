import React from 'react';
import { Box, Typography, Tooltip } from '@mui/material';
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
    const checks = healthData?.checks;
    const dotColor = status
        ? STATUS_DOT_COLORS[status] || '#8E8E93'
        : '#8E8E93';
    const statusLabel = status
        ? status.toUpperCase()
        : isConnected
        ? 'CONNECTING...'
        : 'DISCONNECTED';

    // Connection pool
    const poolPct = checks?.connection_pool_pct ?? dbData?.connection_pool_pct;
    const poolWarning = checks?.connection_pool_warning ?? dbData?.connection_pool_warning;
    const poolColor = poolPct != null ? (poolPct > 80 ? '#FCA5A5' : poolPct > 60 ? '#FCD34D' : 'inherit') : 'inherit';

    // Cache hit ratio
    const cacheHit = checks?.cache_hit_ratio ?? dbData?.cache_hit_ratio;
    const cacheWarning = checks?.cache_hit_warning ?? dbData?.cache_hit_warning;
    const cacheColor = cacheHit != null ? (cacheHit < 95 ? '#FCA5A5' : cacheHit < 99 ? '#FCD34D' : 'inherit') : 'inherit';

    // Long running transactions
    const longTxns = checks?.long_running_transactions ?? (dbData?.long_running_transactions?.length ?? 0);

    // Error rate
    const errorRate = checks?.error_rate;
    const errorPct = errorRate?.error_pct ?? 0;
    const errorColor = errorPct > 5 ? '#FCA5A5' : errorPct > 1 ? '#FCD34D' : 'inherit';

    // Dependencies
    const deps = checks?.dependencies;
    const depsWithErrors = deps ? Object.entries(deps).filter(([_, v]) => v !== 'ok') : [];

    const blockedQueries = checks?.blocked_queries ?? 0;
    const deadlocksTotal = checks?.deadlocks_total ?? 0;
    const ram = systemData
        ? `${systemData.system.ram_used_percent.toFixed(1)}%`
        : '--';
    const cpu = systemData
        ? `${systemData.system.cpu_percent.toFixed(1)}%`
        : '--';
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
                minHeight: 48,
                backgroundColor: '#1A1A2E',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                px: 3,
                py: 1,
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

            {/* Connection Pool */}
            <Tooltip title="Active database connections vs max allowed. Above 80% risks connection exhaustion." arrow>
                <span>
                    <Stat
                        label="Pool"
                        value={poolPct != null ? `${poolPct.toFixed(0)}%` : '--'}
                        color={poolColor}
                        alert={poolWarning}
                    />
                </span>
            </Tooltip>

            <Separator />

            {/* Cache Hit Ratio */}
            <Tooltip title="PostgreSQL buffer cache effectiveness. Below 99% means excessive disk I/O." arrow>
                <span>
                    <Stat
                        label="Cache"
                        value={cacheHit != null ? `${cacheHit.toFixed(1)}%` : '--'}
                        color={cacheColor}
                        alert={cacheWarning}
                    />
                </span>
            </Tooltip>

            <Separator />

            {/* Long Transactions */}
            <Tooltip title="Transactions open >60 seconds. These hold locks and block autovacuum." arrow>
                <span>
                    <Stat
                        label="Long Txns"
                        value={String(longTxns)}
                        alert={longTxns > 0}
                    />
                </span>
            </Tooltip>

            <Separator />

            {/* Error Rate */}
            {errorRate && (
                <>
                    <Tooltip title={`${errorRate.error_count} errors out of ${errorRate.total_requests} requests (last 5min)`} arrow>
                        <span>
                            <Stat
                                label="Errors"
                                value={`${errorPct.toFixed(1)}%`}
                                color={errorColor}
                                alert={errorPct > 1}
                            />
                        </span>
                    </Tooltip>
                    <Separator />
                </>
            )}

            {/* Blocked / Deadlocks */}
            {(blockedQueries > 0 || deadlocksTotal > 0) && (
                <>
                    <Stat
                        label="Blocked"
                        value={String(blockedQueries)}
                        alert={blockedQueries > 0}
                    />
                    <Separator />
                    <Stat
                        label="Deadlocks"
                        value={String(deadlocksTotal)}
                        alert={deadlocksTotal > 0}
                    />
                    <Separator />
                </>
            )}

            <Stat label="RAM" value={ram} />
            <Separator />
            <Stat label="CPU" value={cpu} />

            {/* Dependencies with errors */}
            {depsWithErrors.length > 0 && (
                <>
                    <Separator />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography variant="body2" sx={{ fontSize: '0.75rem', opacity: 0.6 }}>
                            Deps:
                        </Typography>
                        {depsWithErrors.map(([name, status]) => (
                            <Tooltip key={name} title={status} arrow>
                                <Box
                                    sx={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: '50%',
                                        backgroundColor: '#FF3B30',
                                        cursor: 'help',
                                    }}
                                />
                            </Tooltip>
                        ))}
                    </Box>
                </>
            )}

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

const Stat: React.FC<{ label: string; value: string; alert?: boolean; color?: string }> = ({
    label,
    value,
    alert,
    color,
}) => (
    <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
        <span style={{ opacity: 0.6 }}>{label}:</span>{' '}
        <span
            style={{
                fontWeight: 600,
                color: alert ? '#FCA5A5' : color || 'inherit',
            }}
        >
            {value}
        </span>
    </Typography>
);

export default React.memo(HealthBanner);

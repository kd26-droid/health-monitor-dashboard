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

    const dbConns = dbData
        ? `${dbData.total_connections}/${dbData.max_connections}`
        : '--';
    const blockedQueries = checks?.blocked_queries ?? null;
    const deadlocksTotal = checks?.deadlocks_total ?? null;
    const ram = systemData
        ? `${systemData.system.ram_used_percent.toFixed(0)}%`
        : '--';
    const cpu = systemData
        ? `${systemData.system.cpu_percent.toFixed(0)}%`
        : '--';

    // New optional fields
    const poolPct = checks?.connection_pool_pct ?? dbData?.connection_pool_pct;
    const cacheHit = checks?.cache_hit_ratio ?? dbData?.cache_hit_ratio;
    const longTxns = checks?.long_running_transactions ??
        (dbData?.long_running_transactions?.length ?? null);
    const errorRate = checks?.error_rate;
    const deps = checks?.dependencies;

    const updated = lastUpdated
        ? lastUpdated.toLocaleTimeString('en-US', {
              hour12: true,
              hour: 'numeric',
              minute: '2-digit',
              second: '2-digit',
          })
        : '--';

    // Color helpers
    const getPoolColor = (pct: number) => pct > 80 ? '#FCA5A5' : pct > 60 ? '#FCD34D' : undefined;
    const getCacheColor = (pct: number) => pct < 95 ? '#FCA5A5' : pct < 99 ? '#FCD34D' : undefined;
    const getErrorColor = (pct: number) => pct > 5 ? '#FCA5A5' : pct > 1 ? '#FCD34D' : undefined;

    // Check for dependency errors
    const depErrors = deps ? Object.entries(deps).filter(([_, v]) => v !== 'ok') : [];

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
                    boxShadow: status ? `0 0 6px ${dotColor}` : 'none',
                }}
            />

            <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.8rem', mr: 1 }}>
                {statusLabel}
            </Typography>

            <Separator />

            {/* Connection Pool % (if available) */}
            {poolPct != null && (
                <>
                    <Tooltip title="Active connections vs max. Red >80%, yellow >60%." arrow>
                        <span>
                            <Stat
                                label="Pool"
                                value={`${poolPct.toFixed(0)}%`}
                                color={getPoolColor(poolPct)}
                                alert={poolPct > 80}
                            />
                        </span>
                    </Tooltip>
                    <Separator />
                </>
            )}

            {/* DB Connections (fallback if no pool%) */}
            {poolPct == null && (
                <>
                    <Stat
                        label="DB"
                        value={blockedQueries != null && blockedQueries > 0
                            ? `${dbConns}, ${blockedQueries} blocked`
                            : dbConns}
                        alert={blockedQueries != null && blockedQueries > 0}
                    />
                    <Separator />
                </>
            )}

            {/* Cache Hit Ratio (if available) */}
            {cacheHit != null && (
                <>
                    <Tooltip title="PG buffer cache hit %. Red <95%, yellow <99%." arrow>
                        <span>
                            <Stat
                                label="Cache"
                                value={`${cacheHit.toFixed(1)}%`}
                                color={getCacheColor(cacheHit)}
                                alert={cacheHit < 95}
                            />
                        </span>
                    </Tooltip>
                    <Separator />
                </>
            )}

            {/* Long Running Transactions (if available and > 0) */}
            {longTxns != null && longTxns > 0 && (
                <>
                    <Tooltip title="Transactions open >60s. Hold locks, block autovacuum." arrow>
                        <span>
                            <Stat label="Long Txns" value={String(longTxns)} alert={true} />
                        </span>
                    </Tooltip>
                    <Separator />
                </>
            )}

            {/* Error Rate (if available) */}
            {errorRate != null && (
                <>
                    <Tooltip title={`${errorRate.error_count}/${errorRate.total_requests} requests failed`} arrow>
                        <span>
                            <Stat
                                label="Errors"
                                value={`${errorRate.error_pct.toFixed(1)}%`}
                                color={getErrorColor(errorRate.error_pct)}
                                alert={errorRate.error_pct > 5}
                            />
                        </span>
                    </Tooltip>
                    <Separator />
                </>
            )}

            {/* Deadlocks */}
            {deadlocksTotal != null && deadlocksTotal > 0 && (
                <>
                    <Stat label="Deadlocks" value={String(deadlocksTotal)} alert={true} />
                    <Separator />
                </>
            )}

            <Stat label="RAM" value={ram} />
            <Separator />
            <Stat label="CPU" value={cpu} />

            {/* Dependency errors (if any) */}
            {depErrors.length > 0 && (
                <>
                    <Separator />
                    <Tooltip
                        title={depErrors.map(([name, status]) => `${name}: ${status}`).join('\n')}
                        arrow
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography variant="body2" sx={{ fontSize: '0.75rem', opacity: 0.6 }}>
                                Deps:
                            </Typography>
                            {depErrors.map(([name]) => (
                                <Box
                                    key={name}
                                    sx={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: '50%',
                                        backgroundColor: '#FF3B30',
                                    }}
                                />
                            ))}
                        </Box>
                    </Tooltip>
                </>
            )}

            <Box sx={{ flex: 1 }} />

            <Typography variant="caption" sx={{ opacity: 0.6, fontSize: '0.75rem' }}>
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

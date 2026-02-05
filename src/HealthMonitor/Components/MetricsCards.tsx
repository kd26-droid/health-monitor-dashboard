import React from 'react';
import { Box, Card, Typography, Grid } from '@mui/material';
import { IMetrics, IDbResponse } from '../Interfaces/healthMonitor.types';
import { THRESHOLDS } from '../Constants/healthMonitor.constants';
import { getThresholdColor, getDbConnectionColor, ThresholdLevel } from '../Utils/colorRules';
import { formatElapsed } from '../Utils/formatters';

interface MetricsCardsProps {
    metrics: IMetrics;
    dbData: IDbResponse | null;
    totalInBuffer: number;
}

const ACCENT_COLORS: Record<ThresholdLevel, string> = {
    default: '#E5E7EB',
    warning: '#F59E0B',
    error: '#EF4444',
};

interface CardDef {
    title: string;
    getValue: (m: IMetrics, db: IDbResponse | null) => string;
    getSubtitle: (m: IMetrics, db: IDbResponse | null, buffer: number) => string;
    getColor: (m: IMetrics, db: IDbResponse | null) => ThresholdLevel;
}

const CARD_DEFS: CardDef[] = [
    {
        title: 'Total Requests',
        getValue: (m) => m.total.toLocaleString(),
        getSubtitle: (_, __, buffer) => `last ${buffer} in buffer`,
        getColor: () => 'default',
    },
    {
        title: 'Errors',
        getValue: (m) => m.errors.toLocaleString(),
        getSubtitle: (m) =>
            m.total > 0
                ? `${m.errorRate.toFixed(1)}% error rate`
                : '0% error rate',
        getColor: (m) => (m.errors > 0 ? 'error' : 'default'),
    },
    {
        title: 'Slow Requests',
        getValue: (m) => m.slow.toLocaleString(),
        getSubtitle: () => 'above 5s or slow queries',
        getColor: (m) => (m.slow > 0 ? 'warning' : 'default'),
    },
    {
        title: 'Avg Response Time',
        getValue: (m) =>
            m.total > 0 ? formatElapsed(m.avgTime) : '--',
        getSubtitle: () => 'across loaded entries',
        getColor: (m) =>
            m.total > 0
                ? getThresholdColor(
                      m.avgTime,
                      THRESHOLDS.avgTime.yellow,
                      THRESHOLDS.avgTime.red
                  )
                : 'default',
    },
    {
        title: 'Avg DB Queries',
        getValue: (m) =>
            m.total > 0 ? Math.round(m.avgQueries).toLocaleString() : '--',
        getSubtitle: () => 'per request',
        getColor: (m) =>
            m.total > 0
                ? getThresholdColor(
                      m.avgQueries,
                      THRESHOLDS.avgQueries.yellow,
                      THRESHOLDS.avgQueries.red
                  )
                : 'default',
    },
    {
        title: 'DB Connections',
        getValue: (_, db) =>
            db ? db.total_connections.toString() : '--',
        getSubtitle: (_, db) =>
            db
                ? `${db.total_connections} of ${db.max_connections} max`
                : '--',
        getColor: (_, db) =>
            db
                ? getDbConnectionColor(
                      db.total_connections,
                      db.max_connections
                  )
                : 'default',
    },
];

const MetricsCards: React.FC<MetricsCardsProps> = ({
    metrics,
    dbData,
    totalInBuffer,
}) => {
    return (
        <Grid container spacing={1.5} sx={{ px: 3, py: 1.5 }}>
            {CARD_DEFS.map((def) => {
                const color = def.getColor(metrics, dbData);
                return (
                    <Grid size={2} key={def.title}>
                        <Card
                            variant="outlined"
                            sx={{
                                p: 2,
                                borderLeft: `3px solid ${ACCENT_COLORS[color]}`,
                                backgroundColor: '#FFFFFF',
                                height: '100%',
                            }}
                        >
                            <Typography
                                variant="caption"
                                sx={{
                                    color: 'text.secondary',
                                    fontSize: '0.7rem',
                                    textTransform: 'uppercase',
                                    fontWeight: 600,
                                    letterSpacing: 0.5,
                                }}
                            >
                                {def.title}
                            </Typography>
                            <Box sx={{ mt: 0.5 }}>
                                <Typography
                                    variant="h5"
                                    sx={{
                                        fontWeight: 700,
                                        color:
                                            color === 'error'
                                                ? 'error.main'
                                                : color === 'warning'
                                                ? 'warning.main'
                                                : 'text.primary',
                                        lineHeight: 1.2,
                                    }}
                                >
                                    {def.getValue(metrics, dbData)}
                                </Typography>
                            </Box>
                            <Typography
                                variant="caption"
                                sx={{
                                    color: 'text.secondary',
                                    fontSize: '0.7rem',
                                    mt: 0.5,
                                    display: 'block',
                                }}
                            >
                                {def.getSubtitle(metrics, dbData, totalInBuffer)}
                            </Typography>
                        </Card>
                    </Grid>
                );
            })}
        </Grid>
    );
};

export default React.memo(MetricsCards);

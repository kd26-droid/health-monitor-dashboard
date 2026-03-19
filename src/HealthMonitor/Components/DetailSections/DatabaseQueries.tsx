import React from 'react';
import { Box, Typography } from '@mui/material';
import { ILogEntry } from '../../Interfaces/healthMonitor.types';
import { formatElapsed } from '../../Utils/formatters';
import { getQueryExplanation } from '../../Utils/explanations';
import SqlBlock from '../SqlBlock';

interface DatabaseQueriesProps {
    entry: ILogEntry;
    maxConnections?: number;
}

const DatabaseQueries: React.FC<DatabaseQueriesProps> = ({ entry, maxConnections }) => {
    const { db_queries, db_slow_count, db_slowest_s, db_avg_query_ms, slowest_query, elapsed_s, db_connections } =
        entry;
    const explanation = getQueryExplanation(db_queries, elapsed_s, db_slow_count);

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
                Database Queries
            </Typography>

            <Typography
                variant="h6"
                sx={{ fontWeight: 700, mt: 1, fontSize: '1.1rem' }}
            >
                {db_queries} queries
            </Typography>

            <Typography variant="body2" sx={{ fontSize: '0.8rem', mt: 0.5, mb: 1.5 }}>
                Slow: {db_slow_count} &nbsp;|&nbsp; Slowest: {formatElapsed(db_slowest_s)}
                {db_avg_query_ms != null && (
                    <> &nbsp;|&nbsp; Avg: {db_avg_query_ms.toFixed(1)}ms</>
                )}
                {db_connections != null && (
                    <>
                        {' '}&nbsp;|&nbsp; Connections: {db_connections}
                        {maxConnections ? ` / ${maxConnections}` : ''}
                        {maxConnections && db_connections > maxConnections * 0.8 && (
                            <span style={{ color: '#DC2626', fontWeight: 600 }}> (high!)</span>
                        )}
                    </>
                )}
            </Typography>

            {/* SQL block */}
            {slowest_query && (
                <Box sx={{ mb: 1.5 }}>
                    <SqlBlock sql={slowest_query} />
                </Box>
            )}

            {/* Explanation */}
            <Box
                sx={{
                    backgroundColor: '#F0F9FF',
                    borderLeft: '3px solid #3B82F6',
                    borderRadius: '0 4px 4px 0',
                    p: 1.5,
                    mt: slowest_query ? 0 : 0,
                }}
            >
                <Typography variant="body2" sx={{ fontSize: '0.8rem', lineHeight: 1.5 }}>
                    {explanation}
                </Typography>
            </Box>
        </Box>
    );
};

export default DatabaseQueries;

import React from 'react';
import { Box, Typography } from '@mui/material';
import { ILogEntry } from '../../Interfaces/healthMonitor.types';
import { getErrorExplanation } from '../../Utils/explanations';

interface ErrorDetailsProps {
    entry: ILogEntry;
}

const ErrorDetails: React.FC<ErrorDetailsProps> = ({ entry }) => {
    const { error_type, error } = entry;

    if (!error_type && !error) return null;

    const explanation = getErrorExplanation(error_type, error);

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
                Error Details
            </Typography>

            {error_type && (
                <Typography
                    variant="h6"
                    sx={{
                        fontWeight: 700,
                        mt: 1,
                        fontSize: '1.1rem',
                        color: 'error.main',
                    }}
                >
                    {error_type}
                </Typography>
            )}

            {/* Error message */}
            {error && (
                <Box
                    component="pre"
                    sx={{
                        backgroundColor: '#FEF2F2',
                        color: '#991B1B',
                        border: '1px solid #FECACA',
                        p: 1.5,
                        borderRadius: 1,
                        fontSize: '0.75rem',
                        fontFamily: 'monospace',
                        overflow: 'auto',
                        maxHeight: 120,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-all',
                        mt: 1,
                        mb: 1.5,
                    }}
                >
                    {error}
                </Box>
            )}

            {/* Explanation */}
            <Box
                sx={{
                    backgroundColor: '#FEF2F2',
                    borderLeft: '3px solid #EF4444',
                    borderRadius: '0 4px 4px 0',
                    p: 1.5,
                    mt: 1.5,
                }}
            >
                <Typography variant="body2" sx={{ fontSize: '0.8rem', lineHeight: 1.5 }}>
                    {explanation}
                </Typography>
            </Box>
        </Box>
    );
};

export default ErrorDetails;

import React from 'react';
import { Box, Typography } from '@mui/material';
import { ILogEntry } from '../../Interfaces/healthMonitor.types';
import { formatSize } from '../../Utils/formatters';
import { getResponseSizeExplanation } from '../../Utils/explanations';

interface RequestResponseSizeProps {
    entry: ILogEntry;
}

const RequestResponseSize: React.FC<RequestResponseSizeProps> = ({ entry }) => {
    const { request_bytes, response_bytes } = entry;
    const explanation = getResponseSizeExplanation(response_bytes);

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
                Request &amp; Response Size
            </Typography>

            <Typography
                variant="h6"
                sx={{ fontWeight: 700, mt: 1, fontSize: '1.1rem' }}
            >
                {formatSize(response_bytes)} response
            </Typography>

            <Typography variant="body2" sx={{ fontSize: '0.8rem', mt: 0.5, mb: 1.5 }}>
                Request body: {formatSize(request_bytes)}
            </Typography>

            {/* Explanation */}
            <Box
                sx={{
                    backgroundColor: '#F0F9FF',
                    borderLeft: '3px solid #3B82F6',
                    borderRadius: '0 4px 4px 0',
                    p: 1.5,
                }}
            >
                <Typography variant="body2" sx={{ fontSize: '0.8rem', lineHeight: 1.5 }}>
                    {explanation}
                </Typography>
            </Box>
        </Box>
    );
};

export default RequestResponseSize;

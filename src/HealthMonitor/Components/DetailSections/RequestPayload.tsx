import React from 'react';
import { Box, Typography } from '@mui/material';
import { ILogEntry } from '../../Interfaces/healthMonitor.types';
import { prettyPrintJson } from '../../Utils/formatters';
import SqlBlock from '../SqlBlock';

interface RequestPayloadProps {
    entry: ILogEntry;
}

const RequestPayload: React.FC<RequestPayloadProps> = ({ entry }) => {
    const { request_payload } = entry;

    if (!request_payload) return null;

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
                Request Payload
            </Typography>
            <Box sx={{ mt: 1 }}>
                <SqlBlock sql={prettyPrintJson(request_payload)} previewLength={120} />
            </Box>
        </Box>
    );
};

export default RequestPayload;

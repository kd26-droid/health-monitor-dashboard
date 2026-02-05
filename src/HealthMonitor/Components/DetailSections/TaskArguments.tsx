import React from 'react';
import { Box, Typography } from '@mui/material';
import { ILogEntry } from '../../Interfaces/healthMonitor.types';
import { prettyPrintJson } from '../../Utils/formatters';

interface TaskArgumentsProps {
    entry: ILogEntry;
}

const TaskArguments: React.FC<TaskArgumentsProps> = ({ entry }) => {
    const { task_args } = entry;

    if (!task_args) return null;

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
                Task Arguments
            </Typography>

            <Box
                component="pre"
                sx={{
                    backgroundColor: '#1F2937',
                    color: '#E5E7EB',
                    p: 1.5,
                    borderRadius: 1,
                    fontSize: '0.75rem',
                    fontFamily: 'monospace',
                    overflow: 'auto',
                    maxHeight: 200,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                    mt: 1,
                }}
            >
                {prettyPrintJson(task_args)}
            </Box>
        </Box>
    );
};

export default TaskArguments;

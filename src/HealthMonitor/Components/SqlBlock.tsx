import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';

interface SqlBlockProps {
    sql: string;
    /** Chars to show in collapsed preview (default 80) */
    previewLength?: number;
}

/**
 * Displays a SQL query safely — shows ~80 chars collapsed by default,
 * click to expand full text in a scrollable dark code block.
 * Handles queries up to 2000 chars without breaking layout.
 */
const SqlBlock: React.FC<SqlBlockProps> = ({ sql, previewLength = 80 }) => {
    const [expanded, setExpanded] = useState(false);
    const isLong = sql.length > previewLength;
    const preview = isLong ? sql.slice(0, previewLength) + '…' : sql;

    return (
        <Box>
            <Box
                component="pre"
                sx={{
                    backgroundColor: '#1F2937',
                    color: '#E5E7EB',
                    p: 1.5,
                    borderRadius: isLong ? '4px 4px 0 0' : 1,
                    fontSize: '0.72rem',
                    fontFamily: 'monospace',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                    overflow: expanded ? 'auto' : 'hidden',
                    maxHeight: expanded ? 320 : 'none',
                    m: 0,
                }}
            >
                {expanded ? sql : preview}
            </Box>

            {isLong && (
                <Box
                    onClick={() => setExpanded((v) => !v)}
                    sx={{
                        backgroundColor: '#111827',
                        color: '#60A5FA',
                        fontSize: '0.7rem',
                        px: 1.5,
                        py: 0.5,
                        borderRadius: '0 0 4px 4px',
                        cursor: 'pointer',
                        userSelect: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        '&:hover': { color: '#93C5FD' },
                    }}
                >
                    <i
                        className={`bi bi-${expanded ? 'chevron-up' : 'chevron-down'}`}
                        style={{ fontSize: 10 }}
                    />
                    <Typography component="span" sx={{ fontSize: '0.7rem', fontFamily: 'monospace' }}>
                        {expanded ? 'Collapse' : `Show full query (${sql.length} chars)`}
                    </Typography>
                </Box>
            )}
        </Box>
    );
};

export default SqlBlock;

import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

type EmptyStateVariant = 'loading' | 'empty' | 'no-match' | 'disconnected';

interface EmptyStateProps {
    variant: EmptyStateVariant;
    backendUrl?: string;
}

const MESSAGES: Record<
    EmptyStateVariant,
    { icon: string; title: string; subtitle: string }
> = {
    loading: {
        icon: '',
        title: 'Connecting to health monitor...',
        subtitle: '',
    },
    empty: {
        icon: 'bi-inbox',
        title: 'No API calls recorded yet',
        subtitle:
            'Use the Factwise app and requests will appear here in real time.',
    },
    'no-match': {
        icon: 'bi-funnel',
        title: 'No entries match your filters',
        subtitle:
            'Try adjusting the search, event type, or time range.',
    },
    disconnected: {
        icon: 'bi-wifi-off',
        title: 'Cannot connect to the health monitor backend',
        subtitle: 'Make sure the backend is running and try refreshing.',
    },
};

const EmptyState: React.FC<EmptyStateProps> = ({ variant, backendUrl }) => {
    const msg = MESSAGES[variant];

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                minHeight: 300,
                color: 'text.secondary',
                gap: 1.5,
                p: 4,
            }}
        >
            {variant === 'loading' ? (
                <CircularProgress size={36} sx={{ mb: 1 }} />
            ) : (
                <i
                    className={`bi ${msg.icon}`}
                    style={{ fontSize: 36, opacity: 0.5 }}
                />
            )}
            <Typography
                variant="body1"
                sx={{ fontWeight: 600, color: 'text.primary' }}
            >
                {msg.title}
            </Typography>
            <Typography variant="body2" sx={{ maxWidth: 400, textAlign: 'center' }}>
                {variant === 'disconnected' && backendUrl
                    ? `Make sure the backend is running at ${backendUrl} and try refreshing.`
                    : msg.subtitle}
            </Typography>
        </Box>
    );
};

export default EmptyState;

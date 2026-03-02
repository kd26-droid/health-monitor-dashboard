import React from 'react';
import { Box, Typography, Button } from '@mui/material';

interface ErrorBoundaryProps {
    children: React.ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100vh',
                        backgroundColor: '#F9FAFB',
                        p: 4,
                        gap: 2,
                    }}
                >
                    <Typography variant="h6" sx={{ color: '#DC2626', fontWeight: 700 }}>
                        Dashboard Error
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', maxWidth: 500 }}>
                        Something went wrong rendering the dashboard. This is usually caused by unexpected data from the backend.
                    </Typography>
                    <Box
                        component="pre"
                        sx={{
                            backgroundColor: '#1F2937',
                            color: '#E5E7EB',
                            p: 2,
                            borderRadius: 1,
                            fontSize: '0.75rem',
                            fontFamily: 'monospace',
                            maxWidth: 600,
                            overflow: 'auto',
                            maxHeight: 120,
                        }}
                    >
                        {this.state.error?.message || 'Unknown error'}
                    </Box>
                    <Button variant="contained" size="small" onClick={this.handleReset}>
                        Reload Dashboard
                    </Button>
                </Box>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;

import React, { useState } from 'react';
import { Box, Dialog, Typography, TextField, Button } from '@mui/material';

interface TokenPromptProps {
    onSubmit: (token: string) => void;
}

const TokenPrompt: React.FC<TokenPromptProps> = ({ onSubmit }) => {
    const [token, setToken] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (token.trim()) {
            onSubmit(token.trim());
        }
    };

    return (
        <Dialog open fullScreen>
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100vh',
                    backgroundColor: '#F9FAFB',
                }}
            >
                <Box
                    component="form"
                    onSubmit={handleSubmit}
                    sx={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: 2,
                        p: 4,
                        boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
                        maxWidth: 440,
                        width: '100%',
                        textAlign: 'center',
                    }}
                >
                    <Box
                        sx={{
                            width: 48,
                            height: 48,
                            borderRadius: '50%',
                            backgroundColor: '#FEE2E2',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mx: 'auto',
                            mb: 2,
                        }}
                    >
                        <i
                            className="bi bi-shield-lock"
                            style={{ fontSize: 24, color: '#DC2626' }}
                        />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                        Authentication Required
                    </Typography>
                    <Typography
                        variant="body2"
                        sx={{ color: 'text.secondary', mb: 3 }}
                    >
                        The backend requires a monitor token. Enter the value of{' '}
                        <code
                            style={{
                                backgroundColor: '#F3F4F6',
                                padding: '2px 6px',
                                borderRadius: 4,
                                fontSize: '0.85em',
                            }}
                        >
                            HEALTH_MONITOR_TOKEN
                        </code>{' '}
                        from the server environment.
                    </Typography>
                    <TextField
                        fullWidth
                        size="small"
                        placeholder="Enter monitor token..."
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                        type="password"
                        autoFocus
                        sx={{ mb: 2 }}
                    />
                    <Button
                        type="submit"
                        variant="contained"
                        fullWidth
                        disabled={!token.trim()}
                        sx={{
                            textTransform: 'none',
                            fontWeight: 600,
                        }}
                    >
                        Connect
                    </Button>
                </Box>
            </Box>
        </Dialog>
    );
};

export default TokenPrompt;

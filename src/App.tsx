import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import HealthMonitorPage from './HealthMonitor/Pages/HealthMonitorPage';
import ErrorBoundary from './HealthMonitor/Components/ErrorBoundary';

const theme = createTheme({
    palette: {
        mode: 'light',
    },
});

function App() {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <ErrorBoundary>
                <HealthMonitorPage />
            </ErrorBoundary>
        </ThemeProvider>
    );
}

export default App;

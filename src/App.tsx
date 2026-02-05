import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import HealthMonitorPage from './HealthMonitor/Pages/HealthMonitorPage';

const theme = createTheme({
    palette: {
        mode: 'light',
    },
});

function App() {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <HealthMonitorPage />
        </ThemeProvider>
    );
}

export default App;

export const POLL_INTERVAL_LOGS = 3000;
export const POLL_INTERVAL_HEALTH = 10000;
export const MAX_ENTRIES = 2000;
export const SEARCH_DEBOUNCE_MS = 800;
export const LOG_FETCH_LIMIT = 200;

export const MONITOR_TOKEN_KEY = 'health_monitor_token';

// ── Thresholds for color coding ──

export const THRESHOLDS = {
    elapsed_s: { yellow: 2, red: 5 },
    db_time_s: { yellow: 1, red: 2 },
    db_queries: { yellow: 50, red: 200 },
    mem_delta_mb: { yellow: 20, red: 50 },
    response_bytes: { yellow: 102400, red: 512000 },
    avgTime: { yellow: 2, red: 5 },
    avgQueries: { yellow: 30, red: 100 },
} as const;

// ── Dropdown options ──

export const EVENT_OPTIONS = [
    { value: '', label: 'All Events' },
    { value: 'request_ok', label: 'API OK' },
    { value: 'request_slow', label: 'API Slow' },
    { value: 'request_error', label: 'API Error' },
    { value: 'task_ok', label: 'Task OK' },
    { value: 'task_slow', label: 'Task Slow' },
    { value: 'task_error', label: 'Task Error' },
] as const;

export const METHOD_OPTIONS = [
    { value: '', label: 'All Methods' },
    { value: 'GET', label: 'GET' },
    { value: 'POST', label: 'POST' },
    { value: 'PUT', label: 'PUT' },
    { value: 'DELETE', label: 'DELETE' },
    { value: 'OPTIONS', label: 'OPTIONS' },
] as const;

// ── Colors ──

export const METHOD_COLORS: Record<string, string> = {
    GET: '#34C759',
    POST: '#007AFF',
    PUT: '#FF9500',
    DELETE: '#FF3B30',
    OPTIONS: '#8E8E93',
};

export const EVENT_BG_COLORS: Record<string, string> = {
    ok: '#D1FAE5',
    slow: '#FEF3C7',
    error: '#FEE2E2',
};

export const EVENT_TEXT_COLORS: Record<string, string> = {
    ok: '#065F46',
    slow: '#92400E',
    error: '#FFFFFF',
};

export const EVENT_BORDER_COLORS: Record<string, string> = {
    ok: '#34C759',
    slow: '#FF9500',
    error: '#FF3B30',
};

// ── Column widths ──

export const COLUMN_WIDTHS = {
    time: 160,
    status: 100,
    apiTask: 250,
    method: 70,
    path: 240,
    http: 60,
    totalTime: 100,
    dbTime: 100,
    queries: 80,
    memory: 90,
    size: 80,
} as const;

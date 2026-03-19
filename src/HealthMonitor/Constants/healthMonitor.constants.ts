export const POLL_INTERVAL_LOGS = 3000;
export const POLL_INTERVAL_HEALTH = 10000;
export const MAX_ENTRIES = 2000;
export const SEARCH_DEBOUNCE_MS = 800;
export const LOG_FETCH_LIMIT = 200;

// ── Environment URLs ──
// Path-based routing: /prod uses prod API, default uses dev API

export type TEnvName = 'dev' | 'prod';

export interface IEnvConfig {
    label: string;
    apiUrl: string;
}

export const ENV_CONFIGS: Record<TEnvName, IEnvConfig> = {
    dev: {
        label: 'DEV',
        apiUrl: 'https://poiigw0go0.execute-api.us-east-1.amazonaws.com/dev',
    },
    prod: {
        label: 'PROD',
        apiUrl: 'https://qc9s5bz8d7.execute-api.us-east-1.amazonaws.com/prod',
    },
};

/**
 * Determine environment from the current URL path.
 * /prod or /prod/* → 'prod', everything else → 'dev'
 */
export function getEnvFromPath(): TEnvName {
    if (typeof window === 'undefined') return 'dev';
    const path = window.location.pathname;
    if (path === '/prod' || path.startsWith('/prod/')) return 'prod';
    return 'dev';
}

// ── Thresholds for color coding ──

export const THRESHOLDS = {
    elapsed_s: { yellow: 2, red: 5 },
    db_time_s: { yellow: 1, red: 2 },
    db_queries: { yellow: 50, red: 200 },
    mem_delta_mb: { yellow: 5, red: 10 },
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

export const MODULE_OPTIONS = [
    { value: '', label: 'All Modules' },
    { value: 'rfq', label: 'RFQ' },
    { value: 'rfi', label: 'RFI' },
    { value: 'rfp', label: 'RFP' },
    { value: 'po_group', label: 'PO Group' },
    { value: 'events', label: 'Events' },
    { value: 'purchase_order', label: 'Purchase Order' },
    { value: 'contract', label: 'Contract' },
    { value: 'invoice', label: 'Invoice' },
    { value: 'requisition', label: 'Requisition' },
    { value: 'goods_receipt', label: 'Goods Receipt' },
    { value: 'quality_check', label: 'Quality Check' },
    { value: 'delivery_schedule', label: 'Delivery Schedule' },
    { value: 'payment', label: 'Payment' },
    { value: 'organization', label: 'Organization' },
    { value: 'dashboard', label: 'Dashboard' },
    { value: 'analytics', label: 'Analytics' },
    { value: 'authentication', label: 'Authentication' },
    { value: 'notification', label: 'Notification' },
    { value: 'attachment', label: 'Attachment' },
    { value: 'approval', label: 'Approval' },
    { value: 'templates', label: 'Templates' },
    { value: 'vendor', label: 'Vendor' },
    { value: 'item', label: 'Item' },
    { value: 'project', label: 'Project' },
    { value: 'costing_sheet', label: 'Costing Sheet' },
    { value: 'other', label: 'Other' },
] as const;

export const SORT_OPTIONS = [
    { value: '-timestamp', label: 'Newest First' },
    { value: 'timestamp', label: 'Oldest First' },
    { value: '-elapsed_s', label: 'Slowest First' },
    { value: '-db_queries', label: 'Most Queries' },
    { value: '-status_code', label: '5xx First' },
    { value: '-mem_delta', label: 'Memory Growth' },
    { value: '-mem_after', label: 'Highest Memory' },
    { value: '-mem_before', label: 'Memory Before (↓)' },
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
    module: 90,
    enterprise: 130,
    user: 120,
} as const;

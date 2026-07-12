// ── Event & Method Types ──

export type TEventType =
    | 'request_start'
    | 'request_ok'
    | 'request_slow'
    | 'request_error'
    | 'task_ok'
    | 'task_slow'
    | 'task_error';

export type THttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'OPTIONS';

// ── Outgoing HTTP Call ──

export interface IOutgoingCall {
    method: string;
    host: string;
    url: string;
    status?: number | null;
    duration_s: number;
    error?: string | null;
}

// ── Log Entry (from GET /monitor/logs/) ──

export interface ILogEntry {
    _seq: number;
    event: TEventType;
    ts: string; // ISO 8601 UTC
    pid: number;
    worker_id?: string;

    // API requests only
    request_id?: string;
    view?: string;
    method?: THttpMethod;
    path?: string;
    query_params?: Record<string, string | string[]> | null;
    user_id?: string | null;
    enterprise_id?: string | null;
    status?: number | null;
    request_bytes?: number;
    response_bytes?: number;
    request_payload?: string;

    // Tasks only
    task?: string;
    task_id?: string;
    task_args?: string;
    task_state?: string;
    retry?: number | null;
    max_retries?: number | null;
    queue_time_s?: number | null; // NEW: seconds task waited in queue before worker picked it up

    // Always present
    elapsed_s: number;
    db_queries: number;
    db_time_s: number;
    db_slow_count: number;
    db_slowest_s: number;
    app_time_s: number;
    mem_before_mb: number;
    mem_after_mb: number;
    mem_delta_mb: number;
    mem_total_mb?: number;   // Total system RAM (same for all entries from same server)
    mem_used_pct?: number;   // Process memory as % of total system RAM
    db_connections?: number;
    db_avg_query_ms?: number;  // Average time per DB query in milliseconds

    // Time breakdown percentages (sum to ~100%)
    db_time_pct?: number;
    app_time_pct?: number;
    outgoing_time_s?: number;
    outgoing_time_pct?: number;

    // Outgoing HTTP calls
    outgoing_calls?: IOutgoingCall[];
    outgoing_call_count?: number;

    // Human-readable sizes (pre-formatted by backend)
    request_size?: string;
    response_size?: string;

    // Errors only
    error_type?: string;
    error?: string;
    response_body?: string; // exact JSON body returned to client (error/slow/4xx only, capped 10KB)

    // Slow/error requests only
    slowest_query?: string;

    // Gateway timeout (API Gateway 504) — true only on timeout entries
    gateway_timeout?: boolean;

    // Duplicate call detection — only present when duplicate detected
    duplicate_call?: boolean;
    duplicate_count?: number;

    // API source — missing on old entries (treat as 'internal')
    api_source?: 'internal' | 'open_api';

    // Module derived from URL path (missing on old entries — treat as 'other')
    module?: string;

    // Deadlock fields (only when a deadlock occurred)
    deadlock?: boolean;
    deadlock_query?: string;
    deadlock_detail?: string;

    // Lock timeout fields (only when a lock timeout occurred)
    lock_timeout?: boolean;
    lock_timeout_query?: string;

    // N+1 query detection (NEW) - only present when detected
    n_plus_1?: Array<{ pattern: string; count: number }> | null;
}

export interface ILogsResponse {
    entries: ILogEntry[];
    source: 'buffer' | 'database';
    // Live mode (buffer) fields
    cursor?: number;
    total_in_buffer?: number;
    // Historical mode (database) fields
    count?: number;
    total_count?: number;   // Total matching entries across all pages
    offset?: number;        // Current offset used
    limit?: number;         // Page size used
    has_more?: boolean;     // True if more pages exist
    next_offset?: number | null; // Pass as offset on next request; null if no more
}

// ── Health (from GET /monitor/health/) ──

export type THealthStatus = 'healthy' | 'degraded' | 'unhealthy';

export interface IHealthResponse {
    status: THealthStatus;
    checks: {
        database: string;
        memory_rss_mb: number;
        cpu_percent: number;
        db_connections: number;
        max_connections?: number;
        blocked_queries?: number;
        deadlocks_total?: number;
        // NEW optional fields
        connection_pool_pct?: number;
        connection_pool_warning?: boolean;
        cache_hit_ratio?: number;
        cache_hit_warning?: boolean;
        long_running_transactions?: number;
        dependencies?: Record<string, string>; // service name -> "ok" or "error: ..."
        error_rate?: {
            total_requests: number;
            error_count: number;
            error_pct: number;
        };
    };
}

// ── DB (from GET /monitor/db/) ──

export interface IActiveQuery {
    pid: string;
    duration_s: string;
    state: string;
    wait_event_type: string;
    query_preview: string;
}

export interface IBlockedQuery {
    blocked_pid: string;
    wait_duration_s: string;
    wait_event_type: string;
    wait_event: string;
    blocked_query: string;
    lock_type: string;
    lock_mode: string;
    locked_table: string;
    blocker_pid: string;
    blocker_state: string;
    blocker_duration_s: string;
    blocker_query: string;
}

export interface ILockSummary {
    mode: string;
    granted: boolean;
    count: number;
}

export interface ISeqScanTable {
    relname: string;
    seq_scan: number;
    idx_scan: number;
    n_live_tup: number;
    n_dead_tup: number;
}

export interface IDbResponse {
    connections: { active: number; idle: number; 'idle in transaction'?: number };
    total_connections: number;
    max_connections: number;
    active_queries: IActiveQuery[];
    high_seq_scan_tables: ISeqScanTable[];
    database_size: string;
    blocked_queries?: IBlockedQuery[];
    lock_summary?: ILockSummary[];
    deadlocks_total?: number;
    // NEW optional fields
    connection_pool_pct?: number;
    connection_pool_warning?: boolean;
    cache_hit_ratio?: number;
    cache_blocks_hit?: number;
    cache_blocks_read?: number;
    cache_hit_warning?: boolean;
    long_running_transactions?: Array<{
        pid: string;
        usename: string;
        txn_duration_s: string;
        query_duration_s: string;
        state: string;
        wait_event_type: string;
        query_preview: string;
    }>;
    table_bloat?: Array<{
        relname: string;
        n_live_tup: string;
        n_dead_tup: string;
        dead_pct: string;
        last_autovacuum: string | null;
        last_autoanalyze: string | null;
    }>;
    low_index_usage?: Array<{
        relname: string;
        seq_scan: string;
        idx_scan: string;
        n_live_tup: string;
        idx_usage_pct: string;
    }>;
}

// ── System (from GET /monitor/system/) ──

export interface IGunicornWorker {
    pid: number;
    rss_mb: number;
    cpu_percent: number;
    status: string;
}

export interface ISystemResponse {
    system: {
        cpu_percent: number;
        cpu_count: number;
        ram_total_mb: number;
        ram_available_mb: number;
        ram_used_percent: number;
        disk_usage_percent: number;
    };
    process: {
        pid: number;
        rss_mb: number;
        vms_mb: number;
        num_threads: number;
        num_fds: number;
        cpu_percent: number;
    };
    gunicorn_workers?: IGunicornWorker[];
}

// ── Name Resolver (from POST /monitor/resolve-names/) ──

export interface IUserInfo {
    name: string;
    email: string;
}

export interface IEnterpriseInfo {
    name: string;
}

export interface IResolveNamesResponse {
    users: Record<string, IUserInfo>;
    enterprises: Record<string, IEnterpriseInfo>;
}

// ── Filter State ──

export interface IServerFilters {
    search: string;
    event: TEventType | '';
    method: THttpMethod | '';
    api_source: 'internal' | 'open_api' | '';
    module: string;
}

// ── Errors Breakdown (NEW: from GET /monitor/errors/) ──

export interface IErrorsResponse {
    window_minutes: number;
    total_entries: number;
    endpoints: Array<{
        endpoint: string;
        total: number;
        errors: number;
        error_pct: number;
        slow: number;
        n_plus_1_count: number;
        avg_time_s: number;
        max_time_s: number;
        avg_db_queries: number;
        max_db_queries: number;
        error_types: Record<string, number>;
    }>;
}

// ── Column Filters ──

export interface IColumnFilters {
    apiTask: string;
    path: string;
    httpStatus: string;
    minTotalTime: string;
    minDbTime: string;
    minQueries: string;
    minMemory: string;
    minSize: string;
    enterprise: string;
    user: string;
    worker: string;
}

export const EMPTY_COLUMN_FILTERS: IColumnFilters = {
    apiTask: '',
    path: '',
    httpStatus: '',
    minTotalTime: '',
    minDbTime: '',
    minQueries: '',
    minMemory: '',
    minSize: '',
    enterprise: '',
    user: '',
    worker: '',
};

// ── Computed Metrics ──

export interface IMetrics {
    total: number;
    errors: number;
    errorRate: number;
    slow: number;
    avgTime: number;
    avgQueries: number;
}

// ── OOM Forensics (GET /monitor/oom-event/) ──
// Mirrors the report dict from backend health_monitor/oom_forensics.py.

export interface IOomInFlight {
    what: string;
    request_id?: string;
    ts?: string;
    user_id?: string | null;
    enterprise_id?: string | null;
}

export interface IOomSuspect {
    what: string;
    event?: string;
    ts?: string;
    request_id?: string;
    score: number;
    reasons: string[];
    mem_after_mb?: number | null;
    mem_delta_mb?: number | null;
    user_id?: string | null;
    enterprise_id?: string | null;
}

export interface IOomMemoryPoint {
    ts?: string;
    mem_after_mb?: number | null;
    mem_delta_mb?: number | null;
    what?: string;
}

export interface IOomReport {
    worker: {
        worker_id: string | null;
        ecs_task: string | null;
        slot: string | null;
        pid: number | null;
        dead_ts: string | null;
        entries_seen: number;
    };
    last_successful_request: string | null;
    last_successful_at: string | null;
    in_flight_requests: IOomInFlight[];
    memory: {
        peak_mb: number | null;
        peak_at: string | null;
        biggest_jump: { what: string; mem_delta_mb: number | null; ts: string | null } | null;
        series: IOomMemoryPoint[];
    };
    prime_suspect: IOomSuspect | null;
    suspects: IOomSuspect[];
    session: {
        frontend_session_id: string | null;
        clarity_url: string | null;
        bugsink_url: string | null;
    };
    clarity_insights?: IOomClarityInsights | null;
    source?: string;
}

export interface IOomClaritySignal {
    metric: string;
    url: string;
    occurrences: number;
    sessions: number;
}

export interface IOomClarityInsights {
    num_days: number;
    note: string;
    top_signals: IOomClaritySignal[];
    by_metric: Record<string, Array<{ url: string; occurrences: number; sessions: number; pct?: number }>>;
}

export interface IOomReportResponse {
    report: IOomReport;
    markdown: string;
}

// ── Azure Log Analytics-backed forensics ──────────────────────────────────
// These come from /memory-hogs/, /oom-events/, /async-tasks/ which read from
// Azure (not the DB) — so history/forensics add zero load to Postgres.

export interface IMemoryHogEvent {
    ts: string;
    enterprise_id: string | null;
    view: string | null;
    method: string | null;
    path: string | null;
    status: number | null;
    mem_before_mb: number | null;
    mem_after_mb: number | null;
    mem_delta_mb: number | null;
    mem_used_pct: number | null;
    elapsed_s: number | null;
    db_queries: number | null;
    request_id: string | null;
    worker_id: string | null;
    is_cold_start: boolean;
}

export interface IMemoryHogEndpoint {
    enterprise_id: string | null;
    view: string | null;
    method: string | null;
    path: string | null;
    hits: number;
    max_delta_mb: number;
    avg_delta_mb: number;
    max_mem_after_mb: number;
    worst_ts: string | null;
    cold_start_hits: number;
}

export interface IMemoryHogsResponse {
    source: string;
    error: string | null;
    cached: boolean;
    window_hours: number;
    min_delta_mb: number;
    by_endpoint: IMemoryHogEndpoint[];
    worst_events: IMemoryHogEvent[];
}

export type TOomConfidence = 'in_flight' | 'peak_memory' | 'none';

export interface IOomCulprit {
    kind?: 'web' | 'celery';
    ts?: string | null;
    ts_azure?: string | null;
    enterprise_id?: string | null;
    view?: string | null;
    method?: string | null;
    path?: string | null;
    task?: string | null;
    task_id?: string | null;
    status?: number | null;
    request_id?: string | null;
    worker_id?: string | null;
    mem_before_mb?: number | null;
    mem_after_mb?: number | null;
    mem_delta_mb?: number | null;
    elapsed_s?: number | null;
    _gap_s?: number;
    error?: string | null;
}

export interface IOomEvent {
    ts: string;
    container: string;
    kind: 'web' | 'celery';
    replica: string | null;
    reason: string | null;
    exit_code: string | null;
    culprit: IOomCulprit | null;
    culprit_confidence: TOomConfidence;
    recent: IOomCulprit[];
}

export interface IOomEventsResponse {
    source: string;
    error: string | null;
    cached: boolean;
    window_hours: number;
    events: IOomEvent[];
}

export interface IAsyncTask {
    ts: string;
    task: string | null;
    task_id: string | null;
    state: string;
    elapsed_s: number | null;
    pid: number | null;
    hostname: string | null;
    mem_before_mb: number | null;
    mem_after_mb: number | null;
    mem_delta_mb: number | null;
    db_queries: number | null;
    db_time_s: number | null;
    n_plus_1: string | null;
    error: string | null;
}

export interface IAsyncTasksResponse {
    source: string;
    error: string | null;
    cached: boolean;
    window_hours: number;
    tasks: IAsyncTask[];
}

export interface ILogSourceResponse {
    configured: boolean;
    workspace_id: string | null;
    web_app: string;
    celery_app: string;
}

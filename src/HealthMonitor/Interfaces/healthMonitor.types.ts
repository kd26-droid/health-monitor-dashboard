// ── Event & Method Types ──

export type TEventType =
    | 'request_ok'
    | 'request_slow'
    | 'request_error'
    | 'task_ok'
    | 'task_slow'
    | 'task_error';

export type THttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'OPTIONS';

// ── N+1 Query Pattern ──

export interface INPlusOnePattern {
    pattern: string;
    count: number;
}

// ── Log Entry (from GET /monitor/logs/) ──

export interface ILogEntry {
    _seq: number;
    event: TEventType;
    ts: string; // ISO 8601 UTC
    pid: number;

    // API requests only
    request_id?: string;
    view?: string;
    method?: THttpMethod;
    path?: string;
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
    queue_time_s?: number | null; // NEW: seconds task waited in queue

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
    db_connections?: number;

    // N+1 query detection (NEW)
    n_plus_1?: INPlusOnePattern[] | null;

    // Errors only
    error_type?: string;
    error?: string;

    // Slow/error requests only
    slowest_query?: string;

    // Deadlock fields (only when a deadlock occurred)
    deadlock?: boolean;
    deadlock_query?: string;
    deadlock_detail?: string;

    // Lock timeout fields (only when a lock timeout occurred)
    lock_timeout?: boolean;
    lock_timeout_query?: string;
}

export interface ILogsResponse {
    entries: ILogEntry[];
    cursor: number;
    total_in_buffer: number;
}

// ── Health (from GET /monitor/health/) ──

export type THealthStatus = 'healthy' | 'degraded' | 'unhealthy';

export interface IHealthDependencies {
    [serviceName: string]: string; // "ok" or "error: ..."
}

export interface IHealthErrorRate {
    total_requests: number;
    error_count: number;
    error_pct: number;
}

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
        // NEW fields
        connection_pool_pct?: number;
        connection_pool_warning?: boolean;
        cache_hit_ratio?: number;
        cache_hit_warning?: boolean;
        long_running_transactions?: number;
        dependencies?: IHealthDependencies;
        error_rate?: IHealthErrorRate;
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

// NEW: Long-running transaction
export interface ILongRunningTransaction {
    pid: string;
    usename: string;
    txn_duration_s: string;
    query_duration_s: string;
    state: string;
    wait_event_type: string;
    query_preview: string;
}

// NEW: Table bloat info
export interface ITableBloat {
    relname: string;
    n_live_tup: string;
    n_dead_tup: string;
    dead_pct: string;
    last_autovacuum: string | null;
    last_autoanalyze: string | null;
}

// NEW: Low index usage table
export interface ILowIndexUsage {
    relname: string;
    seq_scan: string;
    idx_scan: string;
    n_live_tup: string;
    idx_usage_pct: string;
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
    // NEW fields
    connection_pool_pct?: number;
    connection_pool_warning?: boolean;
    cache_hit_ratio?: number;
    cache_blocks_hit?: number;
    cache_blocks_read?: number;
    cache_hit_warning?: boolean;
    long_running_transactions?: ILongRunningTransaction[];
    table_bloat?: ITableBloat[];
    low_index_usage?: ILowIndexUsage[];
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

// ── Errors Breakdown (from GET /monitor/errors/) ── NEW

export interface IEndpointErrorInfo {
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
    error_types: { [errorType: string]: number };
}

export interface IErrorsResponse {
    window_minutes: number;
    total_entries: number;
    endpoints: IEndpointErrorInfo[];
}

// ── Filter State ──

export interface IServerFilters {
    search: string;
    event: TEventType | '';
    method: THttpMethod | '';
}

// ── Computed Metrics ──

export interface IMetrics {
    total: number;
    errors: number;
    errorRate: number;
    slow: number;
    avgTime: number;
    avgQueries: number;
}

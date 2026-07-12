import axios, { AxiosInstance } from 'axios';
import {
    ILogsResponse,
    IHealthResponse,
    IDbResponse,
    ISystemResponse,
    IErrorsResponse,
    IResolveNamesResponse,
    IOomReportResponse,
    IMemoryHogsResponse,
    IOomEventsResponse,
    IAsyncTasksResponse,
    ILogSourceResponse,
    TEventType,
    THttpMethod,
} from '../Interfaces/healthMonitor.types';
import {
    TEnvName,
    ENV_CONFIGS,
    getEnvFromPath,
} from '../Constants/healthMonitor.constants';

// ── Path prefix ──
// Locally: /monitor/*  (Django direct, no API Gateway)
// Deployed (via API Gateway): /authentication/monitor/*
const isLocal = typeof window !== 'undefined' && window.location.hostname === 'localhost';
const MONITOR_PREFIX = isLocal ? '/monitor' : '/authentication/monitor';

// ── INCIDENT KILL-SWITCH ──
// The read endpoints (/logs/, /health/, /db/, /system/, /errors/, /oom-event/,
// /resolve-names/) run live queries against the prod DB and were adding load
// while it was saturated. While this is true, those calls short-circuit to empty
// responses and never hit the backend. The purge (/cleanup/) stays active.
// Re-enable monitoring by setting this to false.
// Typed as boolean (not literal true) so the guarded code stays reachable.
const MONITOR_APIS_DISABLED: boolean = false;

// ── Dedicated axios instance per environment ──

const instanceCache = new Map<TEnvName, AxiosInstance>();

function getMonitorInstance(env?: TEnvName): AxiosInstance {
    const envName = env ?? getEnvFromPath();

    const cached = instanceCache.get(envName);
    if (cached) return cached;

    const envConfig = ENV_CONFIGS[envName];
    const baseURL = isLocal
        ? (process.env.REACT_APP_API_URL || 'http://localhost:8000')
        : envConfig.apiUrl;

    const inst = axios.create({ baseURL });

    inst.interceptors.request.use((config) => {
        // Send token if stored (inactive unless backend enables HEALTH_MONITOR_TOKEN)
        const tokenKey = `health_monitor_token_${envName}`;
        const token = localStorage.getItem(tokenKey);
        if (token) {
            config.headers.set('X-Monitor-Token', token);
        }
        config.headers.set('Accept', 'application/json');
        return config;
    });

    instanceCache.set(envName, inst);
    return inst;
}

// ── API Functions ──

export interface IFetchLogsParams {
    // Live mode
    since?: number;
    // Historical mode
    from_ts?: string;
    to_ts?: string;
    offset?: number;
    // Common
    limit?: number;
    event?: TEventType | '';
    method?: THttpMethod | '';
    search?: string;
    view?: string;
    path?: string;
    task?: string;
    // New filters
    status_code?: number;
    user_id?: string;
    enterprise_id?: string;
    api_source?: 'internal' | 'open_api';
    module?: string;
    // Sort (historical mode only)
    sort_by?: string;
}

export async function fetchLogs(
    params: IFetchLogsParams
): Promise<ILogsResponse> {
    if (MONITOR_APIS_DISABLED) {
        return { entries: [], source: 'database', count: 0, total_count: 0 } as unknown as ILogsResponse;
    }
    // Strip empty string params so they aren't sent as query params
    const cleanParams: Record<string, string | number> = {};
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '' && value !== null) {
            cleanParams[key] = value;
        }
    });

    const res = await getMonitorInstance().get<ILogsResponse>(`${MONITOR_PREFIX}/logs/`, {
        params: cleanParams,
    });
    return res.data;
}

export async function fetchHealth(): Promise<IHealthResponse> {
    if (MONITOR_APIS_DISABLED) {
        return {
            status: 'disabled',
            checks: { database: 'disabled', memory_rss_mb: 0, cpu_percent: 0, db_connections: 0 },
        } as unknown as IHealthResponse;
    }
    const res = await getMonitorInstance().get<IHealthResponse>(`${MONITOR_PREFIX}/health/`);
    return res.data;
}

export async function fetchDb(): Promise<IDbResponse> {
    if (MONITOR_APIS_DISABLED) {
        return {
            connections: { active: 0, idle: 0 },
            total_connections: 0,
            max_connections: 0,
            active_queries: [],
            high_seq_scan_tables: [],
            database_size: '—',
        } as unknown as IDbResponse;
    }
    const res = await getMonitorInstance().get<IDbResponse>(`${MONITOR_PREFIX}/db/`);
    return res.data;
}

export async function fetchSystem(): Promise<ISystemResponse> {
    if (MONITOR_APIS_DISABLED) {
        return {
            system: { cpu_percent: 0, cpu_count: 0, ram_total_mb: 0, ram_available_mb: 0, ram_used_percent: 0, disk_usage_percent: 0 },
            process: { pid: 0, rss_mb: 0, vms_mb: 0, num_threads: 0, num_fds: 0, cpu_percent: 0 },
            gunicorn_workers: [],
        } as unknown as ISystemResponse;
    }
    const res = await getMonitorInstance().get<ISystemResponse>(`${MONITOR_PREFIX}/system/`);
    return res.data;
}

export async function fetchErrors(minutes: number = 5): Promise<IErrorsResponse> {
    if (MONITOR_APIS_DISABLED) {
        return { window_minutes: minutes, total_entries: 0, endpoints: [] } as unknown as IErrorsResponse;
    }
    const res = await getMonitorInstance().get<IErrorsResponse>(`${MONITOR_PREFIX}/errors/`, {
        params: { minutes },
    });
    return res.data;
}

export interface ICleanupResponse {
    deleted: number;
    retention_days: number;
}

export async function fetchCleanup(days: number = 30): Promise<ICleanupResponse> {
    const res = await getMonitorInstance().post<ICleanupResponse>(`${MONITOR_PREFIX}/cleanup/`, null, {
        params: { days },
    });
    return res.data;
}

export async function resolveNames(params: {
    user_ids: string[];
    enterprise_ids: string[];
}): Promise<IResolveNamesResponse> {
    if (MONITOR_APIS_DISABLED) {
        return { users: {}, enterprises: {} } as unknown as IResolveNamesResponse;
    }
    const res = await getMonitorInstance().post<IResolveNamesResponse>(
        `${MONITOR_PREFIX}/resolve-names/`,
        params
    );
    return res.data;
}

// ── Token Management (inactive unless backend enables HEALTH_MONITOR_TOKEN) ──

function getTokenKey(): string {
    const env = getEnvFromPath();
    return `health_monitor_token_${env}`;
}

export function setMonitorToken(token: string): void {
    localStorage.setItem(getTokenKey(), token);
    // Clear cached instance so the next request picks up the new token
    instanceCache.clear();
}

export function getMonitorToken(): string {
    return localStorage.getItem(getTokenKey()) || '';
}

export function clearMonitorToken(): void {
    localStorage.removeItem(getTokenKey());
    instanceCache.clear();
}

// ── OOM Forensics ──
// GET /monitor/oom-event/?worker_id=|task=|pid=  → reconstruct what a worker
// was doing when it died (last good request, in-flight request, memory spike,
// prime suspect, Clarity + Bugsink links).

export interface IFetchOomParams {
    worker_id?: string;
    task?: string;
    pid?: number;
    clarity?: 1; // enrich with Clarity behaviour signals (rate-limited API)
}

export async function fetchOomReport(
    params: IFetchOomParams
): Promise<IOomReportResponse> {
    if (MONITOR_APIS_DISABLED) {
        return {} as unknown as IOomReportResponse;
    }
    const res = await getMonitorInstance().get<IOomReportResponse>(
        `${MONITOR_PREFIX}/oom-event/`,
        { params }
    );
    return res.data;
}

// ── Azure Log Analytics-backed forensics ──────────────────────────────────
// These read from Azure (container stdout → Log Analytics), NOT the DB, so
// they are safe to keep live regardless of the DB kill-switch above.

export interface IFetchMemoryHogsParams {
    hours?: number;
    min_delta_mb?: number;
    enterprise_id?: string;
    include_cold_start?: boolean;
    limit?: number;
}

export async function fetchMemoryHogs(
    params: IFetchMemoryHogsParams = {}
): Promise<IMemoryHogsResponse> {
    const query: Record<string, unknown> = { ...params };
    if (params.include_cold_start) query.include_cold_start = 'true';
    else delete query.include_cold_start;
    const res = await getMonitorInstance().get<IMemoryHogsResponse>(
        `${MONITOR_PREFIX}/memory-hogs/`,
        { params: query }
    );
    return res.data;
}

export interface IFetchOomEventsParams {
    hours?: number;
    limit?: number;
}

export async function fetchOomEvents(
    params: IFetchOomEventsParams = {}
): Promise<IOomEventsResponse> {
    const res = await getMonitorInstance().get<IOomEventsResponse>(
        `${MONITOR_PREFIX}/oom-events/`,
        { params }
    );
    return res.data;
}

export interface IFetchAsyncTasksParams {
    hours?: number;
    state?: string;
    min_elapsed_s?: number;
    limit?: number;
}

export async function fetchAsyncTasks(
    params: IFetchAsyncTasksParams = {}
): Promise<IAsyncTasksResponse> {
    const res = await getMonitorInstance().get<IAsyncTasksResponse>(
        `${MONITOR_PREFIX}/async-tasks/`,
        { params }
    );
    return res.data;
}

export async function fetchLogSource(): Promise<ILogSourceResponse> {
    const res = await getMonitorInstance().get<ILogSourceResponse>(
        `${MONITOR_PREFIX}/log-source/`
    );
    return res.data;
}

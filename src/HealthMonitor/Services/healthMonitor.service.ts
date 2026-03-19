import axios, { AxiosInstance } from 'axios';
import {
    ILogsResponse,
    IHealthResponse,
    IDbResponse,
    ISystemResponse,
    IErrorsResponse,
    IResolveNamesResponse,
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
    const res = await getMonitorInstance().get<IHealthResponse>(`${MONITOR_PREFIX}/health/`);
    return res.data;
}

export async function fetchDb(): Promise<IDbResponse> {
    const res = await getMonitorInstance().get<IDbResponse>(`${MONITOR_PREFIX}/db/`);
    return res.data;
}

export async function fetchSystem(): Promise<ISystemResponse> {
    const res = await getMonitorInstance().get<ISystemResponse>(`${MONITOR_PREFIX}/system/`);
    return res.data;
}

export async function fetchErrors(minutes: number = 5): Promise<IErrorsResponse> {
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

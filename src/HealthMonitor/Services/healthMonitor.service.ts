import axios, { AxiosInstance } from 'axios';
import {
    ILogsResponse,
    IHealthResponse,
    IDbResponse,
    ISystemResponse,
    IErrorsResponse,
    TEventType,
    THttpMethod,
} from '../Interfaces/healthMonitor.types';
import { MONITOR_TOKEN_KEY } from '../Constants/healthMonitor.constants';

// ── Dedicated axios instance for /monitor/ endpoints ──

const createMonitorInstance = (): AxiosInstance => {
    const baseURL =
        process.env.REACT_APP_MONITOR_URL ||
        process.env.REACT_APP_API_URL ||
        '';

    const inst = axios.create({ baseURL });

    inst.interceptors.request.use((config) => {
        const token = localStorage.getItem(MONITOR_TOKEN_KEY);
        if (token) {
            config.headers.set('X-Monitor-Token', token);
        }
        config.headers.set('Accept', 'application/json');
        return config;
    });

    return inst;
};

const monitorApi = createMonitorInstance();

// ── API Functions ──

export interface IFetchLogsParams {
    // Live mode
    since?: number;
    // Historical mode
    from_ts?: string;
    to_ts?: string;
    // Common
    limit?: number;
    event?: TEventType | '';
    method?: THttpMethod | '';
    search?: string;
    view?: string;
    path?: string;
    task?: string;
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

    const res = await monitorApi.get<ILogsResponse>('/monitor/logs/', {
        params: cleanParams,
    });
    return res.data;
}

export async function fetchHealth(): Promise<IHealthResponse> {
    const res = await monitorApi.get<IHealthResponse>('/monitor/health/');
    return res.data;
}

export async function fetchDb(): Promise<IDbResponse> {
    const res = await monitorApi.get<IDbResponse>('/monitor/db/');
    return res.data;
}

export async function fetchSystem(): Promise<ISystemResponse> {
    const res = await monitorApi.get<ISystemResponse>('/monitor/system/');
    return res.data;
}

export async function fetchErrors(minutes: number = 5): Promise<IErrorsResponse> {
    const res = await monitorApi.get<IErrorsResponse>('/monitor/errors/', {
        params: { minutes },
    });
    return res.data;
}

// ── Token Management ──

export function setMonitorToken(token: string): void {
    localStorage.setItem(MONITOR_TOKEN_KEY, token);
}

export function getMonitorToken(): string {
    return localStorage.getItem(MONITOR_TOKEN_KEY) || '';
}

export function clearMonitorToken(): void {
    localStorage.removeItem(MONITOR_TOKEN_KEY);
}

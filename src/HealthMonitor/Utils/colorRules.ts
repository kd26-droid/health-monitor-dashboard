import { TEventType } from '../Interfaces/healthMonitor.types';
import { METHOD_COLORS, EVENT_BORDER_COLORS } from '../Constants/healthMonitor.constants';

export type ThresholdLevel = 'default' | 'warning' | 'error';

/**
 * Returns 'error', 'warning', or 'default' based on value vs thresholds.
 */
export function getThresholdColor(
    value: number,
    yellowThreshold: number,
    redThreshold: number
): ThresholdLevel {
    if (value > redThreshold) return 'error';
    if (value > yellowThreshold) return 'warning';
    return 'default';
}

/**
 * Extract severity from event type: 'ok' | 'slow' | 'error'
 */
export function getEventSeverity(event: TEventType): 'ok' | 'slow' | 'error' {
    if (event.includes('error')) return 'error';
    if (event.includes('slow')) return 'slow';
    return 'ok';
}

/**
 * Returns border color for an event type.
 */
export function getEventBorderColor(event: TEventType): string {
    return EVENT_BORDER_COLORS[getEventSeverity(event)] || '#E5E7EB';
}

/**
 * Returns whether the event is a task event.
 */
export function isTaskEvent(event: TEventType): boolean {
    return event.startsWith('task_');
}

/**
 * Returns color for HTTP status code.
 */
export function getHttpStatusColor(status: number | null | undefined): string {
    if (status == null) return '#8E8E93';
    if (status >= 200 && status < 300) return '#34C759';
    if (status >= 400 && status < 500) return '#FF9500';
    if (status >= 500) return '#FF3B30';
    return '#8E8E93';
}

/**
 * Returns color for HTTP method.
 */
export function getMethodColor(method: string | undefined): string {
    if (!method) return '#8E8E93';
    return METHOD_COLORS[method] || '#8E8E93';
}

/**
 * Returns MUI-compatible color string for DB connections metric card.
 */
export function getDbConnectionColor(
    total: number,
    max: number
): ThresholdLevel {
    if (max === 0) return 'default';
    if (total > max * 0.8) return 'error';
    if (total > max * 0.5) return 'warning';
    return 'default';
}

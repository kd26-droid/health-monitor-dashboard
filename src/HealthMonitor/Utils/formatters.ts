/**
 * Format elapsed seconds as "89ms" or "1.10s"
 */
export function formatElapsed(seconds: number): string {
    if (seconds < 1) {
        return `${Math.round(seconds * 1000)}ms`;
    }
    return `${seconds.toFixed(2)}s`;
}

/**
 * Format bytes as "951B", "94.5KB", or "1.2MB"
 */
export function formatSize(bytes: number | undefined): string {
    if (bytes == null) return '--';
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / 1048576).toFixed(1)}MB`;
}

/**
 * Format memory delta with sign for table column: "+1.38MB", "-0.50MB", "0MB"
 * Uses 2 decimal places for table display.
 */
export function formatMemDelta(mb: number): string {
    if (mb === 0) return '0MB';
    const sign = mb > 0 ? '+' : '';
    return `${sign}${mb.toFixed(2)}MB`;
}

/**
 * Format ISO timestamp for display:
 * - Today: "14:15:03"
 * - Yesterday: "Yesterday 14:15:03"
 * - Older: "Feb 03 14:15:03"
 */
export function formatTimestamp(isoString: string): string {
    const date = new Date(isoString);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);

    const time = date.toLocaleTimeString('en-US', { hour12: false });

    if (date.toDateString() === now.toDateString()) {
        return time;
    }
    if (date.toDateString() === yesterday.toDateString()) {
        return `Yesterday ${time}`;
    }
    const month = date.toLocaleString('en-US', { month: 'short' });
    const day = date.getDate().toString().padStart(2, '0');
    return `${month} ${day} ${time}`;
}

/**
 * Safe JSON pretty-print. Returns formatted JSON or raw string on parse failure.
 */
export function prettyPrintJson(jsonString: string): string {
    try {
        const parsed = JSON.parse(jsonString);
        return JSON.stringify(parsed, null, 2);
    } catch {
        return jsonString;
    }
}

// ── Timing Explanations ──

export function getTimingExplanation(
    elapsed_s: number,
    db_time_s: number
): string {
    if (elapsed_s === 0) {
        return 'Request completed instantly (under 1 millisecond). No performance concerns.';
    }

    const dbPercent = Math.round((db_time_s / elapsed_s) * 100);

    if (dbPercent > 80) {
        return (
            dbPercent +
            '% of the time was spent waiting for the database. ' +
            'The Python code was fast. The problem is in the DB queries. ' +
            'Look at the query count and slowest query below.'
        );
    }
    if (dbPercent > 50) {
        return (
            'The time is split between database (' +
            dbPercent +
            '%) and application code (' +
            (100 - dbPercent) +
            '%). Both may need optimization.'
        );
    }
    if (dbPercent < 20 && elapsed_s > 2) {
        return (
            'Most of the time (' +
            (100 - dbPercent) +
            '%) was in Python code, not the database. This might mean heavy computation, ' +
            'external API calls, or file processing in the service layer.'
        );
    }
    return (
        'Response time is normal. Database took ' +
        dbPercent +
        '% and application code took ' +
        (100 - dbPercent) +
        '%.'
    );
}

// ── Query Explanations ──

export function getQueryExplanation(
    db_queries: number,
    elapsed_s: number,
    db_slow_count: number
): string {
    let explanation: string;

    if (db_queries > 200) {
        explanation =
            db_queries +
            ' queries is very high for a single request. ' +
            'This usually means an N+1 problem -- a loop is making individual ' +
            'database queries instead of one batch query. ' +
            'Look for missing select_related() or prefetch_related() in the service code.';
    } else if (db_queries > 50) {
        explanation =
            db_queries +
            ' queries is above average. ' +
            'Check if some queries can be combined using select_related() ' +
            'or batch operations.';
    } else if (db_queries < 5 && elapsed_s > 5) {
        explanation =
            'Only ' +
            db_queries +
            ' queries but the request took ' +
            elapsed_s.toFixed(1) +
            's. Either a single query is very slow ' +
            '(check the SQL below) or the Python code is doing heavy processing.';
    } else {
        explanation =
            db_queries +
            ' queries -- this is a normal amount for this type of request.';
    }

    if (db_slow_count > 0) {
        explanation +=
            ' ' +
            db_slow_count +
            ' query(ies) exceeded the slow threshold (1 second).';
    }

    return explanation;
}

// ── Memory Explanations ──

export function getMemoryExplanation(mem_delta_mb: number): string {
    if (mem_delta_mb < -5) {
        return (
            'Memory decreased by ' +
            Math.abs(mem_delta_mb).toFixed(1) +
            ' MB. This is fine -- it means Python garbage collection freed memory.'
        );
    }
    if (mem_delta_mb > 50) {
        return (
            '+' +
            mem_delta_mb.toFixed(1) +
            ' MB memory growth is significant. ' +
            'This could mean the code is loading too much data into memory at once. ' +
            'Check if a large queryset is being converted to a list, ' +
            'or if a large file is being processed in memory.'
        );
    }
    if (mem_delta_mb > 20) {
        return (
            '+' +
            mem_delta_mb.toFixed(1) +
            ' MB memory growth is moderate. ' +
            'Worth keeping an eye on for repeated requests.'
        );
    }
    return 'Memory usage is normal. The request caused minimal memory growth.';
}

// ── Response Size Explanations ──

export function getResponseSizeExplanation(
    response_bytes: number | undefined
): string {
    if (response_bytes == null) return 'No response size data available.';

    if (response_bytes > 500000) {
        return (
            'Response size is ' +
            (response_bytes / 1024).toFixed(0) +
            ' KB -- this is very large. Consider adding pagination, ' +
            'or returning only the fields the frontend needs.'
        );
    }
    if (response_bytes > 100000) {
        return (
            'Response size is ' +
            (response_bytes / 1024).toFixed(0) +
            ' KB -- this is moderately large. Consider pagination if this grows.'
        );
    }
    return 'Response size is normal.';
}

// ── Error Explanations ──

export function getErrorExplanation(
    error_type: string | undefined,
    error: string | undefined
): string {
    const errType = error_type || '';
    const errMsg = (error || '').toLowerCase();

    if (errType === 'DeadlockDetected') {
        return (
            'Two database operations tried to lock the same rows in opposite order. ' +
            'PostgreSQL detected the circular wait and killed this request to break the deadlock. ' +
            'The other operation completed successfully. Check the Deadlock section above for details.'
        );
    }
    if (errType === 'OperationalError' && errMsg.includes('lock timeout')) {
        return (
            'This query tried to update or lock a row, but another transaction was already holding the lock. ' +
            'After waiting too long, PostgreSQL killed this query. Check the Lock Timeout section above.'
        );
    }
    if (errType === 'OperationalError' && errMsg.includes('timeout')) {
        return (
            'A database query took too long and was killed by PostgreSQL. ' +
            'The timeout is set to 5 minutes. Check the slow query SQL shown above.'
        );
    }
    if (errType === 'IntegrityError') {
        return (
            'A duplicate or conflicting record already exists in the database. ' +
            'This usually means the code tried to create something that already exists, ' +
            'or a required related record (foreign key) is missing.'
        );
    }
    if (errType === 'BadRequestException') {
        return (
            'This is a validation error from the service layer -- ' +
            'the request data was invalid or a business rule was violated.'
        );
    }
    if (
        errType === 'ValidationException' ||
        errType === 'ValidationError'
    ) {
        return (
            'The request data failed validation. ' +
            'Check that required fields are present and values are in the correct format.'
        );
    }
    if (
        errType === 'ObjectDoesNotExist' ||
        errMsg.includes('does not exist')
    ) {
        return (
            'The requested resource was not found in the database. ' +
            'Check that the ID in the URL or request body is correct.'
        );
    }
    if (errType === 'PermissionDenied') {
        return 'The user does not have permission to perform this action.';
    }
    if (errType === 'TimeoutError') {
        return (
            'The request timed out at the Python level (not the database). ' +
            'This could mean an external service call (API, S3, etc.) is not responding.'
        );
    }
    if (errType === 'ConnectionError' || errMsg.includes('connect')) {
        return (
            'The server could not connect to an external service (database, Redis, etc.). ' +
            'Check if the service is running and reachable.'
        );
    }
    if (
        errType === 'KeyError' ||
        errType === 'TypeError' ||
        errType === 'AttributeError'
    ) {
        return (
            'This is a code bug -- a ' +
            errType +
            ' means the Python code tried to access ' +
            "something that doesn't exist (a missing dictionary key, wrong type, or missing attribute). " +
            'Check the error message for the specific variable/key name.'
        );
    }
    return (
        'An unexpected error occurred. Check the error message above for details. ' +
        'If this happens repeatedly, it may need investigation.'
    );
}

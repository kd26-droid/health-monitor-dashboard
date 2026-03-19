import { useState, useEffect, useRef } from 'react';
import { ILogEntry, IUserInfo, IEnterpriseInfo } from '../Interfaces/healthMonitor.types';
import { resolveNames } from '../Services/healthMonitor.service';

interface UseNameResolverReturn {
    userMap: Map<string, IUserInfo>;
    enterpriseMap: Map<string, IEnterpriseInfo>;
}

export function useNameResolver(entries: ILogEntry[]): UseNameResolverReturn {
    const [userMap, setUserMap] = useState<Map<string, IUserInfo>>(new Map());
    const [enterpriseMap, setEnterpriseMap] = useState<Map<string, IEnterpriseInfo>>(new Map());
    // Track which IDs have already been resolved (or are in-flight)
    const resolvedRef = useRef<Set<string>>(new Set());
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;
        return () => { mountedRef.current = false; };
    }, []);

    useEffect(() => {
        const newUserIds: string[] = [];
        const newEnterpriseIds: string[] = [];

        for (const entry of entries) {
            if (entry.user_id && !resolvedRef.current.has(`u:${entry.user_id}`)) {
                newUserIds.push(entry.user_id);
                resolvedRef.current.add(`u:${entry.user_id}`);
            }
            if (entry.enterprise_id && !resolvedRef.current.has(`e:${entry.enterprise_id}`)) {
                newEnterpriseIds.push(entry.enterprise_id);
                resolvedRef.current.add(`e:${entry.enterprise_id}`);
            }
        }

        // Deduplicate and cap at 50 each (max 100 IDs per request)
        const uniqueUserIds = Array.from(new Set(newUserIds)).slice(0, 50);
        const uniqueEnterpriseIds = Array.from(new Set(newEnterpriseIds)).slice(0, 50);

        if (uniqueUserIds.length === 0 && uniqueEnterpriseIds.length === 0) return;

        resolveNames({ user_ids: uniqueUserIds, enterprise_ids: uniqueEnterpriseIds })
            .then((data) => {
                if (!mountedRef.current) return;

                setUserMap((prev) => {
                    const next = new Map(prev);
                    Object.entries(data.users || {}).forEach(([id, info]) => next.set(id, info));
                    return next;
                });
                setEnterpriseMap((prev) => {
                    const next = new Map(prev);
                    Object.entries(data.enterprises || {}).forEach(([id, info]) => next.set(id, info));
                    return next;
                });
            })
            .catch(() => {
                // Silent fail — UUIDs will show as truncated IDs
            });
    }, [entries]);

    return { userMap, enterpriseMap };
}

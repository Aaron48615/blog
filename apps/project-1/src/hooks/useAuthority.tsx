import { useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";

const ROLE_INFO: Record<string, string[]> = {
    super_admin: ['*'],
    admin: [
        'dashboard:view', 'dashboard:create', 'dashboard:edit', 'dashboard:delete',
        'chart:view', 'chart:create', 'chart:edit', 'chart:delete',
        'dashboards:view', 'dashboards:create', 'dashboards:edit', 'dashboards:delete',
        'users:view', 'users:create', 'users:edit', 'users:delete',
        'map:view',
        'scene:view',
        'ai:view',
        'roles:view', 'roles:create',
        'profile:view', 'profile:edit'
    ],
    analyst: [
        'dashboard:view', 'dashboard:create', 'dashboard:edit',
        'chart:view', 'chart:create', 'chart:edit', 'chart:delete',
        'dashboards:view', 'dashboards:create', 'dashboards:edit',
        // 'users:view', 'users:edit',
        'map:view',
        'scene:view',
        'ai:view',
        'profile:view', 'profile:edit'
    ],
    user: [
        'dashboard:view', 'map:view', 'ai:view',
        'profile:view', 'profile:edit'
    ]
}

export function useAuthority() {
    const roleCode = useSelector((state: RootState) => state.authSlice.user?.role?.code);
    const hasAuthority = useCallback((permission: string) => {
        if (!roleCode) return false;
        const allowed = ROLE_INFO[roleCode] || [];
        return allowed.includes('*') || allowed.includes(permission)
    }, [roleCode])

    return useMemo(() => (
        { hasAuthority, roleCode }
    ), [hasAuthority, roleCode])
}

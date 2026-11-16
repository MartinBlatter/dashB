import { isLocale } from '#/paraglide/runtime';

/**
 * Routes reachable without a session. Everything else is guarded by the
 * `beforeLoad` in `src/routes/__root.tsx`, so new routes are private by
 * default and only need to be listed here to be made public.
 */
export const publicPaths = ['/login', '/register'] as const;

/**
 * Drops a locale prefix added by the Paraglide `url` strategy, so `/de/login`
 * is recognised as the same route as `/login`.
 */
function deLocalizePathname(pathname: string): string {
    const [, maybeLocale, ...rest] = pathname.split('/');

    if (maybeLocale && isLocale(maybeLocale)) {
        return `/${rest.join('/')}`;
    }

    return pathname;
}

export function isPublicPath(pathname: string): boolean {
    // Server routes (e.g. Better Auth's own handler) must never be redirected,
    // or signing in would be impossible.
    if (pathname.startsWith('/api/')) {
        return true;
    }

    const path = deLocalizePathname(pathname).replace(/\/+$/, '') || '/';

    return publicPaths.some(
        (publicPath) => path === publicPath || path.startsWith(`${publicPath}/`)
    );
}

/**
 * Keeps a `?redirect=` value app-internal: anything protocol-relative
 * (`//evil.example`) or absolute is discarded so the login page cannot be used
 * as an open redirect.
 */
export function safeRedirectTarget(target: string | undefined): string {
    if (!target || !target.startsWith('/') || target.startsWith('//')) {
        return '/';
    }

    return target;
}

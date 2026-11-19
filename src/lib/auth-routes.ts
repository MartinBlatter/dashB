import { localizeHref } from '#/paraglide/runtime';

import { deLocalizePathname } from '#/lib/locale-path';

/**
 * Routes reachable without a session. Everything else is guarded by the
 * `beforeLoad` in `src/routes/__root.tsx`, so new routes are private by
 * default and only need to be listed here to be made public.
 */
export const publicPaths = ['/login', '/register'] as const;

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
 *
 * The result is localized, because callers pass it to `redirect({ href })` and
 * a raw `href` bypasses the router's `rewrite.output` — without this, signing
 * in from `/de/...` would land on the English page.
 */
export function safeRedirectTarget(target: string | undefined): string {
    if (!target || !target.startsWith('/') || target.startsWith('//')) {
        return localizeHref('/');
    }

    return localizeHref(target);
}

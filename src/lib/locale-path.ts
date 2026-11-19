import { isLocale } from '#/paraglide/runtime';

/**
 * Drops a locale prefix added by the Paraglide `url` strategy, so `/de/login`
 * is recognised as the same route as `/login`.
 */
export function deLocalizePathname(pathname: string): string {
    const [, maybeLocale, ...rest] = pathname.split('/');

    if (maybeLocale && isLocale(maybeLocale)) {
        return `/${rest.join('/')}`;
    }

    return pathname;
}

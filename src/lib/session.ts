import { queryOptions, useQuery } from '@tanstack/react-query';
import { createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { auth } from '#/lib/auth';

/** `{ session, user }` when signed in, `null` otherwise. */
export type SessionPayload = Awaited<ReturnType<typeof auth.api.getSession>>;

/**
 * Resolves the Better Auth session from the cookies on the incoming request.
 * Runs on the server only; the client reaches it over RPC.
 */
export const fetchSession = createServerFn({ method: 'GET' }).handler(
    async (): Promise<SessionPayload> => {
        const { headers } = getRequest();

        return auth.api.getSession({ headers });
    }
);

export const sessionQueryKey = ['session'] as const;

/**
 * The session is read once per request during SSR, handed to the client
 * through the dehydrated query cache, and re-used for a short window so that
 * client-side navigation does not hit the server on every route change.
 * Sign-in and sign-out invalidate `sessionQueryKey` explicitly.
 */
export const sessionQueryOptions = () =>
    queryOptions({
        queryKey: sessionQueryKey,
        queryFn: () => fetchSession(),
        staleTime: 30_000,
    });

/** Reads the session that `__root.tsx` loaded, for use in components. */
export function useSession(): SessionPayload {
    const { data } = useQuery(sessionQueryOptions());

    return data ?? null;
}

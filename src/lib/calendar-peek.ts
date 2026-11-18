import { queryOptions, useQuery } from '@tanstack/react-query';
import { createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { z } from 'zod';

import { auth } from '#/lib/auth';
import { parseIcs } from '#/lib/ics';
import { fetchFeedText } from '#/lib/ics-fetch';
import { nextOccurrence } from '#/lib/ics-next';

import type { NextOccurrence } from '#/lib/ics-next';

const PEEK_TTL_MS = 300_000;

const MAX_CACHE_ENTRIES = 100;

export const PEEK_STALE_MS = PEEK_TTL_MS;

export interface NextEventFound {
    status: 'found';
    event: NextOccurrence;
    fetchedAt: string;
    stale: boolean;
}

export interface NextEventEmpty {
    status: 'none';
    fetchedAt: string;
}

export interface NextEventFailure {
    status: 'error';
    reason: string;
}

export type NextEventPayload =
    NextEventFound | NextEventEmpty | NextEventFailure;

interface PeekEntry {
    expiresAt: number;
    inflight: Promise<string> | null;
    lastGood: string | null;
}

function peekCache(): Map<string, PeekEntry> {
    const store = globalThis as typeof globalThis & {
        __icsPeekCache?: Map<string, PeekEntry>;
    };

    store.__icsPeekCache ??= new Map<string, PeekEntry>();

    return store.__icsPeekCache;
}

function evict(cache: Map<string, PeekEntry>): void {
    if (cache.size <= MAX_CACHE_ENTRIES) return;

    const now = Date.now();

    for (const [key, entry] of cache) {
        if (entry.expiresAt <= now && !entry.inflight) cache.delete(key);
    }

    while (cache.size > MAX_CACHE_ENTRIES) {
        const oldest = cache.keys().next();

        if (oldest.done) break;

        cache.delete(oldest.value);
    }
}

async function currentUserId(): Promise<string | null> {
    const { headers } = getRequest();
    const session = await auth.api.getSession({ headers });

    return session?.user.id ?? null;
}

async function feedText(
    url: string
): Promise<{ text: string; stale: boolean }> {
    const cache = peekCache();
    const entry = cache.get(url);
    const now = Date.now();

    if (entry) {
        if (entry.inflight) return { text: await entry.inflight, stale: false };

        if (entry.lastGood && entry.expiresAt > now) {
            return { text: entry.lastGood, stale: false };
        }
    }

    const previous = entry?.lastGood ?? null;
    const inflight = fetchFeedText(url);

    cache.set(url, {
        expiresAt: now + PEEK_TTL_MS,
        inflight,
        lastGood: previous,
    });

    try {
        const text = await inflight;

        cache.set(url, {
            expiresAt: Date.now() + PEEK_TTL_MS,
            inflight: null,
            lastGood: text,
        });

        evict(cache);

        return { text, stale: false };
    } catch (error) {
        cache.set(url, {
            expiresAt: Date.now() + PEEK_TTL_MS,
            inflight: null,
            lastGood: previous,
        });

        if (previous) return { text: previous, stale: true };

        throw error;
    }
}

export const fetchNextEvent = createServerFn({ method: 'GET' })
    .validator(
        z.object({
            feedUrl: z.string().min(1).max(2000),
            lookaheadHours: z.number().int().min(1).max(72),
        })
    )
    .handler(async ({ data }): Promise<NextEventPayload> => {
        const userId = await currentUserId();

        if (!userId) return { status: 'error', reason: 'not_signed_in' };

        try {
            const { text, stale } = await feedText(data.feedUrl);
            const calendar = parseIcs(text);

            const found = nextOccurrence(
                calendar,
                new Date(),
                data.lookaheadHours * 3_600_000
            );

            const fetchedAt = new Date().toISOString();

            if (!found) return { status: 'none', fetchedAt };

            return { status: 'found', event: found, fetchedAt, stale };
        } catch (error) {
            return {
                status: 'error',
                reason: error instanceof Error ? error.message : 'unknown',
            };
        }
    });

export const nextEventQueryKey = (
    feedUrl: string,
    lookaheadHours: number
): Array<string> => ['calendar-peek', feedUrl, String(lookaheadHours)];

export const nextEventQueryOptions = (
    feedUrl: string,
    lookaheadHours: number
) =>
    queryOptions({
        queryKey: nextEventQueryKey(feedUrl, lookaheadHours),
        queryFn: () => fetchNextEvent({ data: { feedUrl, lookaheadHours } }),
        enabled: feedUrl.trim() !== '',
        staleTime: PEEK_STALE_MS,
        refetchInterval: PEEK_STALE_MS,
    });

export function useNextEvent(feedUrl: string, lookaheadHours: number) {
    const { data, isLoading } = useQuery(
        nextEventQueryOptions(feedUrl.trim(), lookaheadHours)
    );

    return { payload: data, isLoading };
}

import { lookup } from 'node:dns/promises';

import { queryOptions, useQuery } from '@tanstack/react-query';
import { createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { z } from 'zod';

import { prisma } from '#/db';
import { auth } from '#/lib/auth';
import {
    isBlockedAddress,
    isBlockedHostname,
    normalizeFeedUrl,
} from '#/lib/calendar-url';
import { parseIcs } from '#/lib/ics';

import type { StoredWidgetValues } from '#/components/Widgets/types';
import type { ParsedCalendar, ParsedEvent } from '#/lib/ics';

export const calendarCollection = 'calendars';

export const icsCollection = 'ics';

export const MAX_ICS_CHARACTERS = 524_288;

const MAX_FEED_BYTES = 5_242_880;

const MAX_REDIRECTS = 4;

const FETCH_TIMEOUT_MS = 10_000;

const MAX_CACHE_ENTRIES = 100;

const FEED_USER_AGENT = 'dashb-calendar/1.0';

export type CalendarKind = 'url' | 'file';

export interface CalendarSource {
    id: string;
    name: string;
    color: string;
    kind: CalendarKind;
    url: string;
    fileName: string;
    enabled: boolean;
}

export interface ImportedEvent extends ParsedEvent {
    calendarId: string;
}

export interface CalendarFeedStatus {
    calendarId: string;
    status: 'ok' | 'error';
    message?: string;
    count: number;
    stale: boolean;
    unresolvedZones: Array<string>;
}

export interface ImportedEventsPayload {
    events: Array<ImportedEvent>;
    calendars: Array<CalendarFeedStatus>;
    fetchedAt: string;
}

export function decodeCalendarRow(
    id: string,
    data: StoredWidgetValues
): CalendarSource {
    const color =
        typeof data.color === 'string' && data.color !== ''
            ? data.color
            : 'blue';

    return {
        id,
        name: typeof data.name === 'string' ? data.name : '',
        color,
        kind: data.kind === 'file' ? 'file' : 'url',
        url: typeof data.url === 'string' ? data.url : '',
        fileName: typeof data.fileName === 'string' ? data.fileName : '',
        enabled: data.enabled !== false,
    };
}

interface CacheEntry {
    signature: string;
    expiresAt: number;
    inflight: Promise<ParsedCalendar> | null;
    lastGood: ParsedCalendar | null;
}

function feedCache(): Map<string, CacheEntry> {
    const store = globalThis as typeof globalThis & {
        __icsCache?: Map<string, CacheEntry>;
    };

    store.__icsCache ??= new Map<string, CacheEntry>();

    return store.__icsCache;
}

async function currentUserId(): Promise<string | null> {
    const { headers } = getRequest();
    const session = await auth.api.getSession({ headers });

    return session?.user.id ?? null;
}

async function assertOwnedWidget(widgetId: string): Promise<void> {
    const userId = await currentUserId();

    if (!userId) throw new Error('Not signed in');

    const widget = await prisma.dashboardWidget.findFirst({
        where: { id: widgetId, userId },
        select: { id: true },
    });

    if (!widget) throw new Error('Widget not found');
}

async function assertPublicHost(target: string): Promise<void> {
    const { hostname } = new URL(target);

    if (isBlockedHostname(hostname)) throw new Error('blocked_host');

    const host = hostname.replace(/^\[|\]$/g, '');
    const records = await lookup(host, { all: true, verbatim: true }).catch(
        () => []
    );

    if (records.length === 0) throw new Error('dns_failed');

    for (const record of records) {
        if (isBlockedAddress(record.address)) throw new Error('blocked_host');
    }
}

async function readCapped(response: Response): Promise<string> {
    const reader = response.body?.getReader();

    if (!reader) throw new Error('empty_response');

    const chunks: Array<Uint8Array> = [];
    let total = 0;

    for (;;) {
        const { done, value } = await reader.read();

        if (done) break;

        total += value.byteLength;

        if (total > MAX_FEED_BYTES) {
            await reader.cancel();
            throw new Error('too_large');
        }

        chunks.push(value);
    }

    const merged = new Uint8Array(total);
    let offset = 0;

    for (const chunk of chunks) {
        merged.set(chunk, offset);
        offset += chunk.byteLength;
    }

    return new TextDecoder('utf-8').decode(merged);
}

async function fetchFeedText(rawUrl: string): Promise<string> {
    let current = normalizeFeedUrl(rawUrl);

    if (!current) throw new Error('invalid_url');

    for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
        await assertPublicHost(current);

        const response = await fetch(current, {
            redirect: 'manual',
            signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
            headers: {
                accept: 'text/calendar, text/plain;q=0.9, */*;q=0.1',
                'user-agent': FEED_USER_AGENT,
            },
        });

        if (response.status >= 300 && response.status < 400) {
            const location = response.headers.get('location');

            if (!location) throw new Error('bad_redirect');

            const next = normalizeFeedUrl(
                new URL(location, current).toString()
            );

            if (!next) throw new Error('bad_redirect');

            current = next;
            continue;
        }

        if (!response.ok) throw new Error(`http_${response.status}`);

        return await readCapped(response);
    }

    throw new Error('too_many_redirects');
}

function evictCache(): void {
    const cache = feedCache();

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

interface ResolvedCalendar {
    parsed: ParsedCalendar;
    stale: boolean;
    message?: string;
}

async function resolveCalendar(
    calendar: CalendarSource,
    icsText: string | null,
    signature: string,
    ttlMs: number
): Promise<ResolvedCalendar> {
    const cache = feedCache();
    const entry = cache.get(calendar.id);
    const now = Date.now();

    if (entry && entry.signature === signature) {
        if (entry.inflight) {
            return { parsed: await entry.inflight, stale: false };
        }

        if (entry.lastGood && entry.expiresAt > now) {
            return { parsed: entry.lastGood, stale: false };
        }
    }

    const previous = entry?.signature === signature ? entry.lastGood : null;

    const load = async (): Promise<ParsedCalendar> => {
        if (calendar.kind === 'file') {
            if (icsText === null) throw new Error('missing_file');

            return parseIcs(icsText);
        }

        return parseIcs(await fetchFeedText(calendar.url));
    };

    const inflight = load();

    cache.set(calendar.id, {
        signature,
        expiresAt: now + ttlMs,
        inflight,
        lastGood: previous,
    });

    try {
        const parsed = await inflight;

        cache.set(calendar.id, {
            signature,
            expiresAt: Date.now() + ttlMs,
            inflight: null,
            lastGood: parsed,
        });
        evictCache();

        return { parsed, stale: false };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'failed';

        cache.set(calendar.id, {
            signature,
            expiresAt: Date.now() + Math.min(ttlMs, 60_000),
            inflight: null,
            lastGood: previous,
        });
        evictCache();

        if (previous) return { parsed: previous, stale: true, message };

        throw new Error(message);
    }
}

export const fetchImportedEvents = createServerFn({ method: 'GET' })
    .validator(
        z.object({
            widgetId: z.string().min(1),
            refreshMinutes: z.number().int().min(1).max(1440).optional(),
        })
    )
    .handler(async ({ data }): Promise<ImportedEventsPayload> => {
        const empty: ImportedEventsPayload = {
            events: [],
            calendars: [],
            fetchedAt: '',
        };

        const userId = await currentUserId();

        if (!userId) return empty;

        const widget = await prisma.dashboardWidget.findFirst({
            where: { id: data.widgetId, userId },
            select: { id: true },
        });

        if (!widget) return empty;

        const rows = await prisma.widgetRecord.findMany({
            where: {
                widgetId: data.widgetId,
                collection: { in: [calendarCollection, icsCollection] },
            },
            orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
            select: {
                id: true,
                collection: true,
                sortKey: true,
                data: true,
                updatedAt: true,
            },
        });

        const texts = new Map<string, { text: string; updatedAt: Date }>();

        for (const row of rows) {
            if (row.collection !== icsCollection) continue;

            const payload = row.data as Record<string, unknown> | null;
            const calendarId =
                typeof payload?.calendarId === 'string'
                    ? payload.calendarId
                    : (row.sortKey ?? '');

            if (calendarId === '') continue;

            texts.set(calendarId, {
                text: typeof payload?.text === 'string' ? payload.text : '',
                updatedAt: row.updatedAt,
            });
        }

        const ttlMs = (data.refreshMinutes ?? 15) * 60_000;
        const events: Array<ImportedEvent> = [];
        const calendars: Array<CalendarFeedStatus> = [];

        for (const row of rows) {
            if (row.collection !== calendarCollection) continue;

            const calendar = decodeCalendarRow(
                row.id,
                (row.data ?? {}) as StoredWidgetValues
            );

            const stored = texts.get(calendar.id) ?? null;
            const signature =
                calendar.kind === 'file'
                    ? `file:${stored?.updatedAt.toISOString() ?? 'none'}`
                    : `url:${calendar.url}`;

            try {
                const resolved = await resolveCalendar(
                    calendar,
                    stored?.text ?? null,
                    signature,
                    ttlMs
                );

                for (const event of resolved.parsed.events) {
                    events.push({ ...event, calendarId: calendar.id });
                }

                calendars.push({
                    calendarId: calendar.id,
                    status: resolved.stale ? 'error' : 'ok',
                    message: resolved.message,
                    count: resolved.parsed.events.length,
                    stale: resolved.stale,
                    unresolvedZones: resolved.parsed.unresolvedZones,
                });
            } catch (error) {
                calendars.push({
                    calendarId: calendar.id,
                    status: 'error',
                    message: error instanceof Error ? error.message : 'failed',
                    count: 0,
                    stale: false,
                    unresolvedZones: [],
                });
            }
        }

        return { events, calendars, fetchedAt: new Date().toISOString() };
    });

export const saveIcsText = createServerFn({ method: 'POST' })
    .validator(
        z.object({
            widgetId: z.string().min(1),
            calendarId: z.string().min(1),
            text: z.string().min(1).max(MAX_ICS_CHARACTERS),
        })
    )
    .handler(async ({ data }): Promise<void> => {
        await assertOwnedWidget(data.widgetId);

        await prisma.$transaction([
            prisma.widgetRecord.deleteMany({
                where: {
                    widgetId: data.widgetId,
                    collection: icsCollection,
                    sortKey: data.calendarId,
                },
            }),
            prisma.widgetRecord.create({
                data: {
                    widgetId: data.widgetId,
                    collection: icsCollection,
                    sortKey: data.calendarId,
                    position: 0,
                    data: { calendarId: data.calendarId, text: data.text },
                },
            }),
        ]);

        feedCache().delete(data.calendarId);
    });

export const deleteCalendarSource = createServerFn({ method: 'POST' })
    .validator(
        z.object({
            widgetId: z.string().min(1),
            calendarId: z.string().min(1),
        })
    )
    .handler(async ({ data }): Promise<void> => {
        await assertOwnedWidget(data.widgetId);

        await prisma.$transaction([
            prisma.widgetRecord.deleteMany({
                where: {
                    widgetId: data.widgetId,
                    collection: calendarCollection,
                    id: data.calendarId,
                },
            }),
            prisma.widgetRecord.deleteMany({
                where: {
                    widgetId: data.widgetId,
                    collection: icsCollection,
                    sortKey: data.calendarId,
                },
            }),
        ]);

        feedCache().delete(data.calendarId);
    });

export const importedEventsQueryKey = (widgetId: string): Array<string> => [
    'calendar-feeds',
    widgetId,
];

export const importedEventsQueryOptions = (
    widgetId: string,
    refreshMinutes: number
) =>
    queryOptions({
        queryKey: importedEventsQueryKey(widgetId),
        queryFn: () =>
            fetchImportedEvents({ data: { widgetId, refreshMinutes } }),
        staleTime: refreshMinutes * 60_000,
        refetchInterval: refreshMinutes * 60_000,
    });

export function useImportedEvents(widgetId: string, refreshMinutes: number) {
    const { data, isLoading } = useQuery(
        importedEventsQueryOptions(widgetId, refreshMinutes)
    );

    return { payload: data, isLoading };
}

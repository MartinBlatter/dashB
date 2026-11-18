import ICAL from 'ical.js';

import type { ParsedCalendar, ParsedEvent } from '#/lib/ics';

export interface NextOccurrence {
    title: string;
    start: string;
    allDay: boolean;
    location: string;
}

const MAX_OCCURRENCES = 50_000;

const MAX_EXPANSION_MS = 1_000;

function startInstant(event: ParsedEvent): number {
    const direct = Date.parse(event.start);

    if (!Number.isNaN(direct)) return direct;

    return Number.NaN;
}

function overridesByUid(
    events: ReadonlyArray<ParsedEvent>
): Map<string, Set<string>> {
    const map = new Map<string, Set<string>>();

    for (const event of events) {
        if (event.recurrenceId === null || event.uid === '') continue;

        const bucket = map.get(event.uid);

        if (bucket) bucket.add(event.recurrenceId);
        else map.set(event.uid, new Set([event.recurrenceId]));
    }

    return map;
}

function nextForEvent(
    event: ParsedEvent,
    fromMs: number,
    overrides: ReadonlySet<string>
): number | null {
    const base = startInstant(event);

    if (Number.isNaN(base)) return null;

    if (event.rrule === null) {
        return base >= fromMs ? base : null;
    }

    let recur: ICAL.Recur;

    try {
        recur = ICAL.Recur.fromString(event.rrule);
    } catch {
        return base >= fromMs ? base : null;
    }

    const excluded = new Set(event.exdate);

    let iterator;

    try {
        iterator = recur.iterator(ICAL.Time.fromJSDate(new Date(base), true));
    } catch {
        return base >= fromMs ? base : null;
    }

    const deadline = Date.now() + MAX_EXPANSION_MS;

    for (let step = 0; step < MAX_OCCURRENCES; step += 1) {
        if ((step & 1023) === 1023 && Date.now() > deadline) return null;

        let ms: number;
        let iso: string;

        try {
            const date = iterator.next().toJSDate();

            ms = date.getTime();
            iso = date.toISOString();
        } catch {
            return null;
        }

        if (Number.isNaN(ms)) return null;

        const dayOnly = iso.slice(0, 10);

        if (excluded.has(iso) || excluded.has(dayOnly)) continue;
        if (overrides.has(iso) || overrides.has(dayOnly)) continue;

        if (ms >= fromMs) return ms;
    }

    return null;
}

export function nextOccurrence(
    calendar: ParsedCalendar,
    from: Date,
    withinMs: number
): NextOccurrence | null {
    const fromMs = from.getTime();
    const limitMs = fromMs + withinMs;
    const overrides = overridesByUid(calendar.events);

    let best: NextOccurrence | null = null;
    let bestMs = Number.POSITIVE_INFINITY;

    for (const event of calendar.events) {
        const own =
            event.recurrenceId === null
                ? (overrides.get(event.uid) ?? new Set<string>())
                : new Set<string>();

        const ms = nextForEvent(event, fromMs, own);

        if (ms === null || ms > limitMs || ms >= bestMs) continue;

        bestMs = ms;
        best = {
            title: event.title,
            start: new Date(ms).toISOString(),
            allDay: event.allDay,
            location: event.location,
        };
    }

    return best;
}

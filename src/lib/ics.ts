import ICAL from 'ical.js';

export interface ParsedEvent {
    uid: string;
    recurrenceId: string | null;
    title: string;
    start: string;
    end: string;
    allDay: boolean;
    rrule: string | null;
    exdate: Array<string>;
    location: string;
    description: string;
}

export interface ParsedCalendar {
    name: string | null;
    events: Array<ParsedEvent>;
    unresolvedZones: Array<string>;
}

const MAX_EVENTS = 5000;

export function parseIcs(text: string): ParsedCalendar {
    const root = new ICAL.Component(ICAL.parse(text));
    const known = registerZones(root);
    const unresolved = new Set<string>();

    const events: Array<ParsedEvent> = [];

    for (const vevent of root.getAllSubcomponents('vevent')) {
        if (events.length >= MAX_EVENTS) break;

        const parsed = parseEvent(vevent, known, unresolved);

        if (parsed) events.push(parsed);
    }

    return {
        name: asText(root.getFirstPropertyValue('x-wr-calname')) || null,
        events,
        unresolvedZones: [...unresolved],
    };
}

function registerZones(root: ICAL.Component): ReadonlySet<string> {
    const known = new Set<string>();

    for (const vtimezone of root.getAllSubcomponents('vtimezone')) {
        const tzid = asText(vtimezone.getFirstPropertyValue('tzid'));

        if (tzid === '') continue;

        known.add(tzid);

        if (!ICAL.TimezoneService.has(tzid)) {
            try {
                ICAL.TimezoneService.register(vtimezone);
            } catch {
                known.delete(tzid);
            }
        }
    }

    return known;
}

function parseEvent(
    vevent: ICAL.Component,
    known: ReadonlySet<string>,
    unresolved: Set<string>
): ParsedEvent | null {
    const status = asText(vevent.getFirstPropertyValue('status')).toUpperCase();

    if (status === 'CANCELLED') return null;

    const startProp = vevent.getFirstProperty('dtstart');
    const start = startProp ? asTime(startProp.getFirstValue()) : null;

    if (!start) return null;

    const allDay = start.isDate === true;
    const startFloating = isFloating(startProp, known, unresolved);

    const endProp = vevent.getFirstProperty('dtend');
    const endValue = endProp ? asTime(endProp.getFirstValue()) : null;

    const end = endValue
        ? emit(endValue, allDay, isFloating(endProp, known, unresolved))
        : derivedEnd(vevent, start, allDay, startFloating);

    const recurrenceProp = vevent.getFirstProperty('recurrence-id');
    const recurrenceValue = recurrenceProp
        ? asTime(recurrenceProp.getFirstValue())
        : null;

    return {
        uid: asText(vevent.getFirstPropertyValue('uid')),
        recurrenceId: recurrenceValue
            ? emit(
                  recurrenceValue,
                  recurrenceValue.isDate === true,
                  isFloating(recurrenceProp, known, unresolved)
              )
            : null,
        title: asText(vevent.getFirstPropertyValue('summary')),
        start: emit(start, allDay, startFloating),
        end,
        allDay,
        rrule: readRrule(vevent),
        exdate: readExdate(vevent, known, unresolved),
        location: asText(vevent.getFirstPropertyValue('location')),
        description: asText(vevent.getFirstPropertyValue('description')),
    };
}

function derivedEnd(
    vevent: ICAL.Component,
    start: ICAL.Time,
    allDay: boolean,
    floating: boolean
): string {
    const duration = vevent.getFirstPropertyValue('duration');

    if (duration instanceof ICAL.Duration) {
        const seconds = duration.toSeconds();

        if (allDay) {
            return addDays(
                emit(start, true, floating),
                Math.max(1, Math.round(seconds / 86400))
            );
        }

        const base = new Date(emit(start, false, floating));

        return new Date(base.getTime() + seconds * 1000).toISOString();
    }

    if (allDay) return addDays(emit(start, true, floating), 1);

    return emit(start, false, floating);
}

function readRrule(vevent: ICAL.Component): string | null {
    const rule = vevent.getFirstProperty('rrule')?.getFirstValue();

    if (!rule) return null;

    const text = String(rule);

    return text === '' ? null : text.replace(/^RRULE:/i, '');
}

function readExdate(
    vevent: ICAL.Component,
    known: ReadonlySet<string>,
    unresolved: Set<string>
): Array<string> {
    const result: Array<string> = [];

    for (const property of vevent.getAllProperties('exdate')) {
        const floating = isFloating(property, known, unresolved);

        for (const value of property.getValues()) {
            const time = asTime(value);

            if (time) result.push(emit(time, time.isDate === true, floating));
        }
    }

    return result;
}

function emit(time: ICAL.Time, allDay: boolean, floating: boolean): string {
    if (allDay) {
        return `${pad(time.year, 4)}-${pad(time.month, 2)}-${pad(time.day, 2)}`;
    }

    if (floating) {
        return new Date(
            Date.UTC(
                time.year,
                time.month - 1,
                time.day,
                time.hour,
                time.minute,
                time.second
            )
        ).toISOString();
    }

    return time.toJSDate().toISOString();
}

function isFloating(
    property: ICAL.Property | null,
    known: ReadonlySet<string>,
    unresolved: Set<string>
): boolean {
    if (!property) return false;

    const tzid = property.getParameter('tzid');

    if (typeof tzid !== 'string' || tzid === '') return false;
    if (known.has(tzid) || ICAL.TimezoneService.has(tzid)) return false;

    unresolved.add(tzid);

    return true;
}

function addDays(dateOnly: string, days: number): string {
    const parts = dateOnly.split('-').map(Number);
    const base = Date.UTC(parts[0] ?? 1970, (parts[1] ?? 1) - 1, parts[2] ?? 1);
    const next = new Date(base + days * 86_400_000);

    return `${pad(next.getUTCFullYear(), 4)}-${pad(
        next.getUTCMonth() + 1,
        2
    )}-${pad(next.getUTCDate(), 2)}`;
}

function pad(value: number, length: number): string {
    return String(value).padStart(length, '0');
}

function asTime(value: unknown): ICAL.Time | null {
    return value instanceof ICAL.Time ? value : null;
}

function asText(value: unknown): string {
    return typeof value === 'string' ? value : '';
}

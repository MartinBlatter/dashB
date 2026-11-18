import dayjs from 'dayjs';

import { createWidgetMessages } from '#/components/Widgets/i18n';
import {
    PICKER_DATETIME_FORMAT,
    PICKER_DATE_FORMAT,
} from '#/components/Widgets/values';

import type {
    StoredWidgetValues,
    WidgetField,
    WidgetValues,
} from '#/components/Widgets/types';
import type {
    CalendarFeedStatus,
    CalendarSource,
    ImportedEvent,
} from '#/lib/calendar-feeds';
import type { WidgetRecord } from '#/lib/widget-records';
import type { ScheduleEventData } from '@mantine/schedule';

export const eventCollection = 'events';

export const t = createWidgetMessages({
    en: {
        label: 'Schedule',
        description:
            'A month calendar for your own events plus any calendars you import from a file or subscribe to by link.',
        first_day: 'First day of the week',
        max_events: 'Events shown per day',
        max_events_hint: 'Extra events collapse into a "more" link.',
        week_numbers: 'Show week numbers',
        highlight_today: 'Highlight today',
        with_agenda: 'Show agenda button',
        refresh: 'Refresh imported calendars every',
        refresh_hint: 'In minutes. Only applies to calendars added by link.',
        monday: 'Monday',
        sunday: 'Sunday',
        saturday: 'Saturday',
        add_event: 'Add event',
        new_event: 'New event',
        edit_event: 'Edit event',
        save_event: 'Save event',
        delete_event: 'Delete event',
        event_title: 'Title',
        event_title_placeholder: 'What is happening',
        all_day: 'All day',
        starts: 'Starts',
        ends: 'Ends',
        ends_hint: 'Ends an hour after it starts when left empty.',
        repeat: 'Repeat',
        repeat_none: 'Does not repeat',
        repeat_daily: 'Daily',
        repeat_weekly: 'Weekly',
        repeat_monthly: 'Monthly',
        repeat_yearly: 'Yearly',
        color: 'Colour',
        location: 'Location',
        notes: 'Notes',
        no_title: '(no title)',
        calendars: 'Calendars',
        manage_calendars: 'Manage calendars',
        add_calendar: 'Add calendar',
        add_calendar_submit: 'Add calendar',
        calendar_name: 'Name',
        calendar_name_placeholder: 'Work, family, sports',
        calendar_url: 'Calendar link',
        calendar_url_hint:
            'An iCal or webcal link, for example a Google Calendar secret address.',
        from_link: 'From a link',
        from_file: 'From a file',
        ics_file: 'Calendar file',
        ics_file_hint: 'An .ics file, up to 512 KB.',
        file_too_large: 'That file is too large. The limit is 512 KB.',
        file_required: 'Choose an .ics file first.',
        invalid_url: 'That does not look like a calendar link.',
        upload: 'Import calendar',
        delete_calendar: 'Remove calendar',
        delete_calendar_prompt:
            'Remove this calendar? Its events disappear from the widget.',
        no_calendars: 'No imported calendars yet.',
        resync: 'Refresh now',
        hide: 'Hide',
        show: 'Show',
        feed_failed: 'Could not load this calendar.',
        feed_stale: 'Showing the last version that loaded.',
        unknown_zone: 'Some times may be off: unknown time zone in the feed.',
        own_events: 'My events',
        event_count: 'events',
        close: 'Close',
        colour_blue: 'Blue',
        colour_cyan: 'Cyan',
        colour_teal: 'Teal',
        colour_green: 'Green',
        colour_lime: 'Lime',
        colour_yellow: 'Yellow',
        colour_orange: 'Orange',
        colour_red: 'Red',
        colour_pink: 'Pink',
        colour_grape: 'Grape',
        colour_violet: 'Violet',
        colour_indigo: 'Indigo',
        colour_gray: 'Grey',
        lbl_today: 'Today',
        lbl_next: 'Next month',
        lbl_previous: 'Previous month',
        lbl_more: 'more',
        lbl_no_events: 'No events',
        lbl_agenda: 'Agenda',
        lbl_select_month: 'Select month',
        lbl_select_year: 'Select year',
        lbl_weekday: 'Weekday',
    },
    de: {
        label: 'Kalender',
        description:
            'Ein Monatskalender für eigene Termine sowie für Kalender, die du aus einer Datei importierst oder per Link abonnierst.',
        first_day: 'Erster Tag der Woche',
        max_events: 'Termine pro Tag',
        max_events_hint:
            'Weitere Termine werden zu einem Link zusammengefasst.',
        week_numbers: 'Kalenderwochen anzeigen',
        highlight_today: 'Heute hervorheben',
        with_agenda: 'Agenda-Schaltfläche anzeigen',
        refresh: 'Importierte Kalender aktualisieren alle',
        refresh_hint:
            'In Minuten. Gilt nur für per Link hinzugefügte Kalender.',
        monday: 'Montag',
        sunday: 'Sonntag',
        saturday: 'Samstag',
        add_event: 'Termin hinzufügen',
        new_event: 'Neuer Termin',
        edit_event: 'Termin bearbeiten',
        save_event: 'Termin speichern',
        delete_event: 'Termin löschen',
        event_title: 'Titel',
        event_title_placeholder: 'Was ansteht',
        all_day: 'Ganztägig',
        starts: 'Beginn',
        ends: 'Ende',
        ends_hint: 'Endet eine Stunde nach dem Beginn, wenn leer gelassen.',
        repeat: 'Wiederholung',
        repeat_none: 'Keine Wiederholung',
        repeat_daily: 'Täglich',
        repeat_weekly: 'Wöchentlich',
        repeat_monthly: 'Monatlich',
        repeat_yearly: 'Jährlich',
        color: 'Farbe',
        location: 'Ort',
        notes: 'Notizen',
        no_title: '(ohne Titel)',
        calendars: 'Kalender',
        manage_calendars: 'Kalender verwalten',
        add_calendar: 'Kalender hinzufügen',
        add_calendar_submit: 'Kalender hinzufügen',
        calendar_name: 'Name',
        calendar_name_placeholder: 'Arbeit, Familie, Sport',
        calendar_url: 'Kalender-Link',
        calendar_url_hint:
            'Ein iCal- oder webcal-Link, zum Beispiel die geheime Adresse eines Google-Kalenders.',
        from_link: 'Aus einem Link',
        from_file: 'Aus einer Datei',
        ics_file: 'Kalenderdatei',
        ics_file_hint: 'Eine .ics-Datei, bis zu 512 KB.',
        file_too_large: 'Diese Datei ist zu groß. Das Limit sind 512 KB.',
        file_required: 'Wähle zuerst eine .ics-Datei aus.',
        invalid_url: 'Das sieht nicht nach einem Kalender-Link aus.',
        upload: 'Kalender importieren',
        delete_calendar: 'Kalender entfernen',
        delete_calendar_prompt:
            'Diesen Kalender entfernen? Seine Termine verschwinden aus dem Widget.',
        no_calendars: 'Noch keine importierten Kalender.',
        resync: 'Jetzt aktualisieren',
        hide: 'Ausblenden',
        show: 'Einblenden',
        feed_failed: 'Dieser Kalender konnte nicht geladen werden.',
        feed_stale: 'Es wird die letzte geladene Version angezeigt.',
        unknown_zone:
            'Einige Zeiten können abweichen: unbekannte Zeitzone im Kalender.',
        own_events: 'Meine Termine',
        event_count: 'Termine',
        close: 'Schließen',
        colour_blue: 'Blau',
        colour_cyan: 'Cyan',
        colour_teal: 'Türkis',
        colour_green: 'Grün',
        colour_lime: 'Hellgrün',
        colour_yellow: 'Gelb',
        colour_orange: 'Orange',
        colour_red: 'Rot',
        colour_pink: 'Pink',
        colour_grape: 'Violett',
        colour_violet: 'Lila',
        colour_indigo: 'Indigo',
        colour_gray: 'Grau',
        lbl_today: 'Heute',
        lbl_next: 'Nächster Monat',
        lbl_previous: 'Vorheriger Monat',
        lbl_more: 'weitere',
        lbl_no_events: 'Keine Termine',
        lbl_agenda: 'Agenda',
        lbl_select_month: 'Monat wählen',
        lbl_select_year: 'Jahr wählen',
        lbl_weekday: 'Wochentag',
    },
});

export type EventRepeat = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface NativeEvent {
    id: string;
    title: string;
    allDay: boolean;
    start: string;
    end: string;
    repeat: EventRepeat;
    color: string;
    location: string;
    notes: string;
}

const repeats: ReadonlyArray<EventRepeat> = [
    'none',
    'daily',
    'weekly',
    'monthly',
    'yearly',
];

const repeatFreq: Record<Exclude<EventRepeat, 'none'>, string> = {
    daily: 'FREQ=DAILY',
    weekly: 'FREQ=WEEKLY',
    monthly: 'FREQ=MONTHLY',
    yearly: 'FREQ=YEARLY',
};

const colors: ReadonlyArray<{ value: string; key: ColourKey }> = [
    { value: 'blue', key: 'colour_blue' },
    { value: 'cyan', key: 'colour_cyan' },
    { value: 'teal', key: 'colour_teal' },
    { value: 'green', key: 'colour_green' },
    { value: 'lime', key: 'colour_lime' },
    { value: 'yellow', key: 'colour_yellow' },
    { value: 'orange', key: 'colour_orange' },
    { value: 'red', key: 'colour_red' },
    { value: 'pink', key: 'colour_pink' },
    { value: 'grape', key: 'colour_grape' },
    { value: 'violet', key: 'colour_violet' },
    { value: 'indigo', key: 'colour_indigo' },
    { value: 'gray', key: 'colour_gray' },
];

type ColourKey =
    | 'colour_blue'
    | 'colour_cyan'
    | 'colour_teal'
    | 'colour_green'
    | 'colour_lime'
    | 'colour_yellow'
    | 'colour_orange'
    | 'colour_red'
    | 'colour_pink'
    | 'colour_grape'
    | 'colour_violet'
    | 'colour_indigo'
    | 'colour_gray';

export function colorOptions(): Array<{ value: string; label: string }> {
    return colors.map((entry) => ({ value: entry.value, label: t(entry.key) }));
}

export function repeatOptions(): Array<{ value: string; label: string }> {
    return [
        { value: 'none', label: t('repeat_none') },
        { value: 'daily', label: t('repeat_daily') },
        { value: 'weekly', label: t('repeat_weekly') },
        { value: 'monthly', label: t('repeat_monthly') },
        { value: 'yearly', label: t('repeat_yearly') },
    ];
}

export const eventFields: ReadonlyArray<WidgetField> = [
    {
        kind: 'text',
        name: 'title',
        label: () => t('event_title'),
        placeholder: () => t('event_title_placeholder'),
        required: true,
        maxLength: 160,
    },
    {
        kind: 'switch',
        name: 'allDay',
        label: () => t('all_day'),
        defaultValue: false,
    },
    {
        kind: 'datetime',
        name: 'start',
        label: () => t('starts'),
        required: true,
    },
    {
        kind: 'datetime',
        name: 'end',
        label: () => t('ends'),
        description: () => t('ends_hint'),
    },
    {
        kind: 'select',
        name: 'repeat',
        label: () => t('repeat'),
        defaultValue: 'none',
        options: repeatOptions,
    },
    {
        kind: 'select',
        name: 'color',
        label: () => t('color'),
        defaultValue: 'blue',
        options: colorOptions,
    },
    {
        kind: 'text',
        name: 'location',
        label: () => t('location'),
        maxLength: 160,
    },
    {
        kind: 'textarea',
        name: 'notes',
        label: () => t('notes'),
        maxLength: 2000,
    },
];

export const urlCalendarFields: ReadonlyArray<WidgetField> = [
    {
        kind: 'text',
        name: 'name',
        label: () => t('calendar_name'),
        placeholder: () => t('calendar_name_placeholder'),
        required: true,
        maxLength: 60,
    },
    {
        kind: 'text',
        name: 'url',
        label: () => t('calendar_url'),
        description: () => t('calendar_url_hint'),
        required: true,
        maxLength: 2000,
    },
    {
        kind: 'select',
        name: 'color',
        label: () => t('color'),
        defaultValue: 'teal',
        options: colorOptions,
    },
];

export const fileCalendarFields: ReadonlyArray<WidgetField> = [
    {
        kind: 'text',
        name: 'name',
        label: () => t('calendar_name'),
        placeholder: () => t('calendar_name_placeholder'),
        required: true,
        maxLength: 60,
    },
    {
        kind: 'select',
        name: 'color',
        label: () => t('color'),
        defaultValue: 'grape',
        options: colorOptions,
    },
];

export function asRepeat(value: unknown): EventRepeat {
    return repeats.find((repeat) => repeat === value) ?? 'none';
}

export function rruleFor(repeat: EventRepeat): string | null {
    return repeat === 'none' ? null : repeatFreq[repeat];
}

export function decodeEvent(record: WidgetRecord): NativeEvent {
    const { data } = record;
    const allDay = data.allDay === true;

    const start = normalizeStored(data.start, allDay);
    const end = normalizeStored(data.end, allDay) ?? start;

    return {
        id: record.id,
        title: typeof data.title === 'string' ? data.title : '',
        allDay,
        start: start ?? fallbackStart(allDay),
        end: end ?? fallbackStart(allDay),
        repeat: asRepeat(data.repeat),
        color:
            typeof data.color === 'string' && data.color !== ''
                ? data.color
                : 'blue',
        location: typeof data.location === 'string' ? data.location : '',
        notes: typeof data.notes === 'string' ? data.notes : '',
    };
}

export function encodeEvent(event: NativeEvent): StoredWidgetValues {
    return {
        title: event.title,
        allDay: event.allDay,
        start: event.start,
        end: event.end,
        repeat: event.repeat,
        color: event.color,
        location: event.location,
        notes: event.notes,
    };
}

export function normalizeEventValues(
    values: StoredWidgetValues
): StoredWidgetValues {
    const allDay = values.allDay === true;
    const rawStart = typeof values.start === 'string' ? values.start : '';
    const rawEnd = typeof values.end === 'string' ? values.end : '';

    const start = dayjs(rawStart);
    const startMoment = start.isValid() ? start : dayjs();
    const end = dayjs(rawEnd);

    if (allDay) {
        const startDate = startMoment.startOf('day');
        const endDate = end.isValid() ? end.startOf('day') : startDate;

        return {
            ...values,
            allDay: true,
            start: startDate.format(PICKER_DATE_FORMAT),
            end: (endDate.isBefore(startDate) ? startDate : endDate).format(
                PICKER_DATE_FORMAT
            ),
        };
    }

    const endMoment =
        end.isValid() && end.isAfter(startMoment)
            ? end
            : startMoment.add(1, 'hour');

    return {
        ...values,
        allDay: false,
        start: startMoment.toDate().toISOString(),
        end: endMoment.toDate().toISOString(),
    };
}

export function eventSortKey(values: StoredWidgetValues): string {
    const raw = typeof values.start === 'string' ? values.start : '';
    const parsed = dayjs(raw);

    return (parsed.isValid() ? parsed : dayjs()).toDate().toISOString();
}

export function nativeEventId(recordId: string): string {
    return `native:${recordId}`;
}

export function isNativeId(id: string): boolean {
    return id.startsWith('native:');
}

export function nativeRecordId(id: string): string | null {
    return isNativeId(id) ? id.slice('native:'.length) : null;
}

export function importedEventId(
    calendarId: string,
    uid: string,
    recurrenceId: string | null
): string {
    const base = `ics:${calendarId}:${uid}`;

    return recurrenceId === null ? base : `${base}:${recurrenceId}`;
}

export function canDragScheduleEvent(event: ScheduleEventData): boolean {
    return (
        isNativeId(String(event.id)) &&
        event.recurrence === undefined &&
        event.recurringEventId === undefined &&
        event.recurringInstance === undefined
    );
}

export function firstDayOfWeekValue(config: WidgetValues): 0 | 1 | 6 {
    switch (config.firstDayOfWeek) {
        case 'sunday':
            return 0;
        case 'saturday':
            return 6;
        default:
            return 1;
    }
}

export function maxEventsPerDayValue(config: WidgetValues): number {
    const raw = config.maxEventsPerDay;
    const value = typeof raw === 'number' && Number.isFinite(raw) ? raw : 3;

    return Math.min(10, Math.max(1, Math.round(value)));
}

export function refreshMinutesValue(config: WidgetValues): number {
    const raw = config.refreshMinutes;
    const value = typeof raw === 'number' && Number.isFinite(raw) ? raw : 15;

    return Math.min(1440, Math.max(1, Math.round(value)));
}

export function toScheduleEvents(
    native: ReadonlyArray<NativeEvent>,
    imported: ReadonlyArray<ImportedEvent>,
    calendars: ReadonlyArray<CalendarSource>
): Array<ScheduleEventData> {
    const result: Array<ScheduleEventData> = [];

    for (const event of native) {
        const span = localSpan(event.start, event.end, event.allDay, true);
        const rrule = rruleFor(event.repeat);

        const base = {
            id: nativeEventId(event.id),
            title: event.title === '' ? t('no_title') : event.title,
            start: span.start,
            end: span.end,
            color: event.color,
            payload: {
                kind: 'native' as const,
                allDay: event.allDay,
                location: event.location,
                description: event.notes,
                calendarName: t('own_events'),
            },
        };

        result.push(rrule === null ? base : { ...base, recurrence: { rrule } });
    }

    const visible = new Map<string, CalendarSource>();

    for (const calendar of calendars) {
        if (calendar.enabled) visible.set(calendar.id, calendar);
    }

    for (const event of imported) {
        const calendar = visible.get(event.calendarId);

        if (!calendar) continue;

        const span = localSpan(event.start, event.end, event.allDay, false);

        const base = {
            id: importedEventId(
                event.calendarId,
                event.uid,
                event.recurrenceId
            ),
            title: event.title === '' ? t('no_title') : event.title,
            start: span.start,
            end: span.end,
            color: calendar.color,
            payload: {
                kind: 'imported' as const,
                allDay: event.allDay,
                location: event.location,
                description: event.description,
                calendarName: calendar.name,
            },
        };

        if (event.recurrenceId !== null) {
            result.push({
                ...base,
                recurringEventId: importedEventId(
                    event.calendarId,
                    event.uid,
                    null
                ),
                recurrenceId: toLocalDateTime(event.recurrenceId),
            });
            continue;
        }

        if (event.rrule === null) {
            result.push(base);
            continue;
        }

        result.push({
            ...base,
            recurrence: {
                rrule: event.rrule,
                exdate: event.exdate.map(toLocalDateTime),
            },
        });
    }

    return result;
}

function localSpan(
    start: string,
    end: string,
    allDay: boolean,
    inclusiveEnd: boolean
): { start: string; end: string } {
    if (!allDay) {
        return { start: toLocalDateTime(start), end: toLocalDateTime(end) };
    }

    const startDay = dayjs(start).startOf('day');
    const endDay = dayjs(end).startOf('day');
    const exclusive = inclusiveEnd ? endDay.add(1, 'day') : endDay;
    const safeEnd = exclusive.isAfter(startDay)
        ? exclusive
        : startDay.add(1, 'day');

    return {
        start: startDay.format(PICKER_DATETIME_FORMAT),
        end: safeEnd.format(PICKER_DATETIME_FORMAT),
    };
}

function toLocalDateTime(value: string): string {
    const parsed = dayjs(value);

    return (parsed.isValid() ? parsed : dayjs()).format(PICKER_DATETIME_FORMAT);
}

function normalizeStored(value: unknown, allDay: boolean): string | null {
    if (typeof value !== 'string' || value === '') return null;

    const parsed = dayjs(value);

    if (!parsed.isValid()) return null;

    return allDay
        ? parsed.format(PICKER_DATE_FORMAT)
        : parsed.toDate().toISOString();
}

function fallbackStart(allDay: boolean): string {
    const now = dayjs();

    return allDay ? now.format(PICKER_DATE_FORMAT) : now.toDate().toISOString();
}

export function statusFor(
    calendarId: string,
    statuses: ReadonlyArray<CalendarFeedStatus>
): CalendarFeedStatus | null {
    return statuses.find((entry) => entry.calendarId === calendarId) ?? null;
}

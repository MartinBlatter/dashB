import dayjs from 'dayjs';

import { getLocale } from '#/paraglide/runtime';

export const dateFormats = [
    'locale',
    'dmy-dot',
    'dmy-slash',
    'mdy-slash',
    'ymd-dash',
] as const;

export type DateFormat = (typeof dateFormats)[number];

export const defaultDateFormat: DateFormat = 'locale';

export interface DateTextOptions {
    monthName?: boolean;
    year?: boolean;
    weekday?: boolean;
    time?: boolean;
    timeZone?: string;
}

type DateOrder = 'dmy' | 'mdy' | 'ymd';

type DatePart = 'day' | 'month' | 'year';

const orderedFormats: Record<
    Exclude<DateFormat, 'locale'>,
    { order: DateOrder; separator: string; numericOnly: boolean }
> = {
    'dmy-dot': { order: 'dmy', separator: '.', numericOnly: false },
    'dmy-slash': { order: 'dmy', separator: '/', numericOnly: false },
    'mdy-slash': { order: 'mdy', separator: '/', numericOnly: false },
    'ymd-dash': { order: 'ymd', separator: '-', numericOnly: true },
};

const sequences: Record<DateOrder, ReadonlyArray<DatePart>> = {
    dmy: ['day', 'month', 'year'],
    mdy: ['month', 'day', 'year'],
    ymd: ['year', 'month', 'day'],
};

const tokens: Record<DatePart, string> = {
    day: 'DD',
    month: 'MM',
    year: 'YYYY',
};

const sampleDate = new Date(2026, 11, 31, 13, 45);

const localeOrders = new Map<string, DateOrder>();

function isDateOrder(value: string): value is DateOrder {
    return value === 'dmy' || value === 'mdy' || value === 'ymd';
}

export function isDateFormat(value: unknown): value is DateFormat {
    return (
        typeof value === 'string' &&
        (dateFormats as ReadonlyArray<string>).includes(value)
    );
}

export function asDateFormat(value: unknown): DateFormat {
    return isDateFormat(value) ? value : defaultDateFormat;
}

function toDate(value: Date | string | number): Date | null {
    const parsed = dayjs(value);

    return parsed.isValid() ? parsed.toDate() : null;
}

function intlOptions(
    format: DateFormat,
    options: DateTextOptions
): Intl.DateTimeFormatOptions {
    const numericOnly =
        format !== 'locale' && orderedFormats[format].numericOnly;

    return {
        weekday: options.weekday === true ? 'short' : undefined,
        day: '2-digit',
        month: numericOnly || options.monthName !== true ? '2-digit' : 'short',
        year: numericOnly || options.year !== false ? 'numeric' : undefined,
        timeZone: options.timeZone,
    };
}

function partsOf(
    date: Date,
    locale: string,
    options: Intl.DateTimeFormatOptions
): Partial<Record<Intl.DateTimeFormatPartTypes, string>> {
    const out: Partial<Record<Intl.DateTimeFormatPartTypes, string>> = {};

    for (const part of new Intl.DateTimeFormat(locale, options).formatToParts(
        date
    )) {
        if (part.type !== 'literal') out[part.type] = part.value;
    }

    return out;
}

function joinParts(
    parts: Partial<Record<Intl.DateTimeFormatPartTypes, string>>,
    order: DateOrder,
    separator: string,
    monthName: boolean
): string {
    if (!monthName) {
        return sequences[order]
            .map((part) => parts[part])
            .filter((value) => value !== undefined)
            .join(separator);
    }

    const day = parts.day ?? '';
    const month = parts.month ?? '';
    const year = parts.year;

    if (order === 'mdy') {
        return year === undefined
            ? `${month} ${day}`
            : `${month} ${day}, ${year}`;
    }

    return year === undefined ? `${day} ${month}` : `${day} ${month} ${year}`;
}

function localeOrder(locale: string): DateOrder {
    const cached = localeOrders.get(locale);

    if (cached !== undefined) return cached;

    const parts = new Intl.DateTimeFormat(locale, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    })
        .formatToParts(sampleDate)
        .map((part) => part.type)
        .filter((type) => type === 'day' || type === 'month' || type === 'year')
        .map((type) => type.charAt(0))
        .join('');
    const order = isDateOrder(parts) ? parts : 'dmy';

    localeOrders.set(locale, order);

    return order;
}

function dateText(
    date: Date,
    format: DateFormat,
    locale: string,
    options: DateTextOptions
): string {
    const intl = intlOptions(format, options);

    if (format === 'locale') return date.toLocaleDateString(locale, intl);

    const { order, separator } = orderedFormats[format];

    if (intl.month === 'short' && localeOrder(locale) === order) {
        return date.toLocaleDateString(locale, intl);
    }

    const parts = partsOf(date, locale, intl);
    const body = joinParts(parts, order, separator, intl.month === 'short');
    const weekday = parts.weekday;

    return weekday === undefined ? body : `${weekday}, ${body}`;
}

export function formatTime(
    value: Date | string | number,
    options: { seconds?: boolean; timeZone?: string } = {}
): string {
    const date = toDate(value);

    if (date === null) return '';

    return date.toLocaleTimeString(getLocale(), {
        hour: '2-digit',
        minute: '2-digit',
        second: options.seconds === true ? '2-digit' : undefined,
        timeZone: options.timeZone,
    });
}

export function formatDate(
    value: Date | string | number,
    format: DateFormat,
    options: DateTextOptions = {}
): string {
    const date = toDate(value);

    if (date === null) return '';

    const text = dateText(date, format, getLocale(), options);

    if (options.time !== true) return text;

    return `${text}, ${formatTime(date, { timeZone: options.timeZone })}`;
}

function localePickerFormat(locale: string): string {
    return new Intl.DateTimeFormat(locale, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    })
        .formatToParts(sampleDate)
        .map((part) => {
            if (part.type === 'day') return tokens.day;
            if (part.type === 'month') return tokens.month;
            if (part.type === 'year') return tokens.year;

            return /[A-Za-z]/.test(part.value) ? `[${part.value}]` : part.value;
        })
        .join('');
}

export function pickerDateFormat(format: DateFormat): string {
    if (format === 'locale') return localePickerFormat(getLocale());

    const { order, separator } = orderedFormats[format];

    return sequences[order].map((part) => tokens[part]).join(separator);
}

export function pickerDateTimeFormat(format: DateFormat): string {
    return `${pickerDateFormat(format)} HH:mm`;
}

export function dateFormatSample(format: DateFormat): string {
    return formatDate(sampleDate, format);
}

import dayjs from 'dayjs';

import type {
    StoredWidgetValue,
    StoredWidgetValues,
    WidgetField,
    WidgetFieldValue,
    WidgetValues,
} from './types';

export const PICKER_DATETIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';

export const PICKER_DATE_FORMAT = 'YYYY-MM-DD';

export function widgetFieldDefault(field: WidgetField): WidgetFieldValue {
    switch (field.kind) {
        case 'text':
        case 'textarea':
        case 'date':
        case 'datetime':
            return field.defaultValue ?? '';
        case 'number':
            return field.defaultValue ?? '';
        case 'select':
            return field.defaultValue ?? field.options().at(0)?.value ?? '';
        case 'switch':
            return field.defaultValue ?? false;
    }
}

export function widgetValueDefaults(
    fields: ReadonlyArray<WidgetField>
): WidgetValues {
    return Object.fromEntries(
        fields.map((field) => [field.name, widgetFieldDefault(field)])
    );
}

export function encodeWidgetValue(
    field: WidgetField,
    value: WidgetFieldValue
): StoredWidgetValue {
    switch (field.kind) {
        case 'text':
        case 'textarea':
        case 'select':
            return String(value);
        case 'number':
            return value === '' ? null : Number(value);
        case 'switch':
            return Boolean(value);
        case 'date': {
            const parsed = dayjs(String(value));

            return value === '' || !parsed.isValid()
                ? null
                : parsed.format(PICKER_DATE_FORMAT);
        }
        case 'datetime': {
            const parsed = dayjs(String(value));

            return value === '' || !parsed.isValid()
                ? null
                : parsed.toDate().toISOString();
        }
    }
}

export function decodeWidgetValue(
    field: WidgetField,
    raw: StoredWidgetValue
): WidgetFieldValue {
    switch (field.kind) {
        case 'text':
        case 'textarea':
        case 'select':
            return typeof raw === 'string' ? raw : '';
        case 'number':
            return typeof raw === 'number' && Number.isFinite(raw) ? raw : '';
        case 'switch':
            return raw === true;
        case 'date': {
            if (typeof raw !== 'string') return '';

            const parsed = dayjs(raw);

            return parsed.isValid() ? parsed.format(PICKER_DATE_FORMAT) : '';
        }
        case 'datetime': {
            if (typeof raw !== 'string') return '';

            const parsed = dayjs(raw);

            return parsed.isValid()
                ? parsed.format(PICKER_DATETIME_FORMAT)
                : '';
        }
    }
}

export function toStoredValues(
    fields: ReadonlyArray<WidgetField>,
    values: WidgetValues
): StoredWidgetValues {
    return Object.fromEntries(
        fields.map((field) => [
            field.name,
            encodeWidgetValue(field, values[field.name] ?? ''),
        ])
    );
}

export function fromStoredValues(
    fields: ReadonlyArray<WidgetField>,
    stored: unknown
): WidgetValues {
    const source = asStoredRecord(stored);

    return Object.fromEntries(
        fields.map((field) => {
            const raw = source[field.name];

            return [
                field.name,
                isStoredWidgetValue(raw)
                    ? decodeWidgetValue(field, raw)
                    : widgetFieldDefault(field),
            ];
        })
    );
}

export function isStoredWidgetValue(
    value: unknown
): value is StoredWidgetValue {
    return (
        value === null ||
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean'
    );
}

export function asStoredValues(value: unknown): StoredWidgetValues {
    return Object.fromEntries(
        Object.entries(asStoredRecord(value)).filter(
            (entry): entry is [string, StoredWidgetValue] =>
                isStoredWidgetValue(entry[1])
        )
    );
}

function asStoredRecord(value: unknown): Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : {};
}

export function valueText(values: WidgetValues, name: string): string {
    const raw = values[name];

    return typeof raw === 'string' ? raw : '';
}

export function valueNumber(
    values: WidgetValues,
    name: string,
    fallback: number
): number {
    const raw = values[name];

    return typeof raw === 'number' && Number.isFinite(raw) ? raw : fallback;
}

export function valueDate(
    values: WidgetValues,
    name: string
): Date | undefined {
    const raw = values[name];

    if (typeof raw !== 'string' || raw === '') return undefined;

    const parsed = dayjs(raw);

    return parsed.isValid() ? parsed.toDate() : undefined;
}

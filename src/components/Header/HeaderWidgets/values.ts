import dayjs from 'dayjs';

import type {
    StoredWidgetConfig,
    StoredWidgetValue,
    WidgetConfig,
    WidgetField,
    WidgetFieldValue,
} from './types';

export const PICKER_DATETIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';

export function widgetFieldDefault(field: WidgetField): WidgetFieldValue {
    switch (field.kind) {
        case 'text':
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

/** Default form state for a widget's whole field set. */
export function widgetConfigDefaults(
    fields: ReadonlyArray<WidgetField>
): WidgetConfig {
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
        case 'select':
            return String(value);
        case 'number':
            return value === '' ? null : Number(value);
        case 'switch':
            return Boolean(value);
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
        case 'select':
            return typeof raw === 'string' ? raw : '';
        case 'number':
            return typeof raw === 'number' && Number.isFinite(raw) ? raw : '';
        case 'switch':
            return raw === true;
        case 'datetime': {
            if (typeof raw !== 'string') return '';

            const parsed = dayjs(raw);

            return parsed.isValid()
                ? parsed.format(PICKER_DATETIME_FORMAT)
                : '';
        }
    }
}

export function toStoredConfig(
    fields: ReadonlyArray<WidgetField>,
    config: WidgetConfig
): StoredWidgetConfig {
    return Object.fromEntries(
        fields.map((field) => [
            field.name,
            encodeWidgetValue(field, config[field.name] ?? ''),
        ])
    );
}

export function fromStoredConfig(
    fields: ReadonlyArray<WidgetField>,
    stored: unknown
): WidgetConfig {
    const source: Record<string, unknown> =
        typeof stored === 'object' && stored !== null && !Array.isArray(stored)
            ? (stored as Record<string, unknown>)
            : {};

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

function isStoredWidgetValue(value: unknown): value is StoredWidgetValue {
    return (
        value === null ||
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean'
    );
}

export function configDate(
    config: WidgetConfig,
    name: string
): Date | undefined {
    const raw = config[name];

    if (typeof raw !== 'string' || raw === '') return undefined;

    const parsed = dayjs(raw);

    return parsed.isValid() ? parsed.toDate() : undefined;
}

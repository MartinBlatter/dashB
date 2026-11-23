import dayjs from 'dayjs';

import { getLocale } from '#/paraglide/runtime';

import { formatDate } from '#/lib/date-format';

import { t } from './i18n';

import type { StoredWidgetValue } from '#/components/Widgets/types';
import type { DateFormat } from '#/lib/date-format';
import type { TableColumn, TableEntry } from '#/lib/table-schema';

export function isEmptyValue(value: StoredWidgetValue): boolean {
    return value === null || value === '';
}

export function entryValue(
    entry: TableEntry,
    column: TableColumn
): StoredWidgetValue {
    return entry.data[column.id] ?? null;
}

export function cellText(
    column: TableColumn,
    value: StoredWidgetValue,
    dateFormat: DateFormat
): string {
    if (column.kind === 'switch') return value === true ? t('yes') : t('no');

    if (isEmptyValue(value)) return '';

    switch (column.kind) {
        case 'number':
            return typeof value === 'number'
                ? new Intl.NumberFormat(getLocale(), {
                      maximumFractionDigits: 10,
                  }).format(value)
                : String(value);

        case 'date': {
            const parsed = dayjs(String(value));

            return parsed.isValid()
                ? formatDate(parsed.toDate(), dateFormat)
                : String(value);
        }

        case 'datetime': {
            const parsed = dayjs(String(value));

            return parsed.isValid()
                ? formatDate(parsed.toDate(), dateFormat, { time: true })
                : String(value);
        }

        case 'text':
        case 'textarea':
        case 'select':
            return String(value);
    }
}

export function entryMatches(
    entry: TableEntry,
    columns: ReadonlyArray<TableColumn>,
    query: string,
    dateFormat: DateFormat
): boolean {
    const needle = query.trim().toLowerCase();

    if (needle === '') return true;

    return columns.some((column) => {
        const value = entryValue(entry, column);

        if (isEmptyValue(value) && column.kind !== 'switch') return false;

        return (
            cellText(column, value, dateFormat)
                .toLowerCase()
                .includes(needle) ||
            String(value).toLowerCase().includes(needle)
        );
    });
}

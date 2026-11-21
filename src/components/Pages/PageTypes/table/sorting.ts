import dayjs from 'dayjs';

import { getLocale } from '#/paraglide/runtime';

import { entryValue, isEmptyValue } from './format';

import type { StoredWidgetValue } from '#/components/Widgets/types';
import type { TableColumn, TableEntry } from '#/lib/page-tables';

export type TableSortDirection = 'asc' | 'desc';

export interface TableSort {
    columnId: string;
    direction: TableSortDirection;
}

export function nextSort(
    current: TableSort | null,
    columnId: string
): TableSort | null {
    if (!current || current.columnId !== columnId) {
        return { columnId, direction: 'asc' };
    }

    return current.direction === 'asc' ? { columnId, direction: 'desc' } : null;
}

function optionRank(column: TableColumn, value: StoredWidgetValue): number {
    const index = column.options.indexOf(String(value));

    return index === -1 ? column.options.length : index;
}

function timestamp(value: StoredWidgetValue): number {
    const parsed = dayjs(String(value));

    return parsed.isValid() ? parsed.valueOf() : 0;
}

export function compareValues(
    column: TableColumn,
    left: StoredWidgetValue,
    right: StoredWidgetValue
): number {
    switch (column.kind) {
        case 'number':
            return Number(left) - Number(right);

        case 'date':
        case 'datetime':
            return timestamp(left) - timestamp(right);

        case 'select':
            return optionRank(column, left) - optionRank(column, right);

        case 'switch':
            return Number(left === true) - Number(right === true);

        case 'text':
        case 'textarea':
            return String(left).localeCompare(String(right), getLocale(), {
                numeric: true,
                sensitivity: 'base',
            });
    }
}

function byStoredOrder(left: TableEntry, right: TableEntry): number {
    return left.position - right.position || left.id.localeCompare(right.id);
}

export function sortEntries(
    entries: ReadonlyArray<TableEntry>,
    columns: ReadonlyArray<TableColumn>,
    sort: TableSort | null
): Array<TableEntry> {
    if (!sort) return [...entries].sort(byStoredOrder);

    const column = columns.find((candidate) => candidate.id === sort.columnId);

    if (!column) return [...entries].sort(byStoredOrder);

    const sign = sort.direction === 'asc' ? 1 : -1;

    return [...entries].sort((left, right) => {
        const leftValue = entryValue(left, column);
        const rightValue = entryValue(right, column);

        if (column.kind !== 'switch') {
            const leftEmpty = isEmptyValue(leftValue);
            const rightEmpty = isEmptyValue(rightValue);

            if (leftEmpty || rightEmpty) {
                return leftEmpty && rightEmpty
                    ? byStoredOrder(left, right)
                    : leftEmpty
                      ? 1
                      : -1;
            }
        }

        return (
            sign * compareValues(column, leftValue, rightValue) ||
            byStoredOrder(left, right)
        );
    });
}

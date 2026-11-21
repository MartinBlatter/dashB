import {
    maxTableColumnLabelLength,
    maxTableColumnOptionsLength,
    tableColumnKinds,
} from '#/lib/page-tables';

import { t } from './i18n';

import type {
    StoredWidgetValues,
    WidgetField,
} from '#/components/Widgets/types';
import type { TableColumn, TableColumnKind } from '#/lib/page-tables';

const kindMessageKeys = {
    text: 'kind_text',
    textarea: 'kind_textarea',
    number: 'kind_number',
    date: 'kind_date',
    datetime: 'kind_datetime',
    select: 'kind_select',
    switch: 'kind_switch',
} as const;

export function kindLabel(kind: TableColumnKind): string {
    return t(kindMessageKeys[kind]);
}

export function kindOptions(): Array<{ value: string; label: string }> {
    return tableColumnKinds.map((kind) => ({
        value: kind,
        label: kindLabel(kind),
    }));
}

export function fieldFromColumn(column: TableColumn): WidgetField {
    const base = {
        name: column.id,
        label: () => column.label,
        required: column.required,
    };

    switch (column.kind) {
        case 'textarea':
            return { ...base, kind: 'textarea', rows: 3 };
        case 'select':
            return {
                ...base,
                kind: 'select',
                options: () =>
                    column.options.map((value) => ({ value, label: value })),
            };
        case 'text':
        case 'number':
        case 'date':
        case 'datetime':
        case 'switch':
            return { ...base, kind: column.kind };
    }
}

export function fieldsFromColumns(
    columns: ReadonlyArray<TableColumn>
): ReadonlyArray<WidgetField> {
    return columns.map(fieldFromColumn);
}

export function columnFormFields(
    kind: TableColumnKind
): ReadonlyArray<WidgetField> {
    const fields: Array<WidgetField> = [
        {
            kind: 'text',
            name: 'title',
            label: () => t('column_title'),
            placeholder: () => t('column_title_placeholder'),
            required: true,
            maxLength: maxTableColumnLabelLength,
        },
    ];

    if (kind === 'select') {
        fields.push({
            kind: 'textarea',
            name: 'choices',
            label: () => t('column_choices'),
            description: () => t('column_choices_hint'),
            required: true,
            rows: 4,
            maxLength: maxTableColumnOptionsLength,
        });
    } else if (kind !== 'switch') {
        fields.push({
            kind: 'switch',
            name: 'required',
            label: () => t('column_required'),
        });
    }

    return fields;
}

export function sanitizeEntryData(
    columns: ReadonlyArray<TableColumn>,
    data: StoredWidgetValues
): StoredWidgetValues {
    return Object.fromEntries(
        columns.map((column) => {
            const raw = data[column.id] ?? null;

            if (
                column.kind === 'select' &&
                !column.options.includes(String(raw))
            ) {
                return [column.id, ''];
            }

            return [column.id, raw];
        })
    );
}

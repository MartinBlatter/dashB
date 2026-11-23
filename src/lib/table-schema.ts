import type { StoredWidgetValues } from '#/components/Widgets/types';

export const tableColumnKinds = [
    'text',
    'textarea',
    'number',
    'date',
    'datetime',
    'select',
    'switch',
] as const;

export type TableColumnKind = (typeof tableColumnKinds)[number];

export const maxTableColumnLabelLength = 120;
export const maxTableColumnOptionsLength = 2000;
export const maxTableColumns = 30;

export interface TableColumn {
    id: string;
    label: string;
    kind: TableColumnKind;
    position: number;
    required: boolean;
    options: Array<string>;
}

export interface TableEntry {
    id: string;
    position: number;
    data: StoredWidgetValues;
}

export function asColumnKind(value: unknown): TableColumnKind {
    return tableColumnKinds.find((kind) => kind === value) ?? 'text';
}

export function splitColumnOptions(text: string): Array<string> {
    return [
        ...new Set(
            text
                .split('\n')
                .map((line) => line.trim())
                .filter((line) => line !== '')
        ),
    ];
}

export function joinColumnOptions(options: ReadonlyArray<string>): string {
    return options.join('\n');
}

export interface TableColumnDraft {
    label: string;
    kind: TableColumnKind;
    required: boolean;
    options: Array<string>;
}

export type TableColumnEdit = Omit<TableColumnDraft, 'kind'>;

export interface TableColumnStore {
    columns: Array<TableColumn>;
    isPending: boolean;
    create: (draft: TableColumnDraft) => Promise<void>;
    update: (id: string, edit: TableColumnEdit) => Promise<void>;
    remove: (id: string) => Promise<void>;
    reorder: (ids: Array<string>) => Promise<void>;
}

export interface TableEntryStore {
    entries: Array<TableEntry>;
    isPending: boolean;
    create: (data: StoredWidgetValues) => Promise<void>;
    update: (id: string, data: StoredWidgetValues) => Promise<void>;
    remove: (id: string) => Promise<void>;
    reorder: (ids: Array<string>) => Promise<void>;
}

export function stripColumnValues(
    data: StoredWidgetValues,
    columnId: string
): StoredWidgetValues {
    return Object.fromEntries(
        Object.entries(data).filter(([key]) => key !== columnId)
    );
}

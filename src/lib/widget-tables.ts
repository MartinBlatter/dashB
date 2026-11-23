import {
    asColumnKind,
    joinColumnOptions,
    splitColumnOptions,
    stripColumnValues,
} from '#/lib/table-schema';
import { useWidgetRecords } from '#/lib/widget-records';

import type {
    TableColumn,
    TableColumnDraft,
    TableColumnStore,
    TableEntry,
    TableEntryStore,
} from '#/lib/table-schema';
import type { StoredWidgetValues } from '#/components/Widgets/types';
import type { WidgetRecord } from '#/lib/widget-records';

export const widgetTableColumnCollection = 'table-columns';

export const widgetTableEntryCollection = 'table-entries';

export interface WidgetTableStore {
    columns: TableColumnStore;
    entries: TableEntryStore;
}

function decodeColumn(record: WidgetRecord): TableColumn {
    const { data } = record;

    return {
        id: record.id,
        label: typeof data.label === 'string' ? data.label : '',
        kind: asColumnKind(data.kind),
        position: record.position,
        required: data.required === true,
        options: splitColumnOptions(
            typeof data.options === 'string' ? data.options : ''
        ),
    };
}

function encodeColumn(draft: TableColumnDraft): StoredWidgetValues {
    return {
        label: draft.label,
        kind: draft.kind,
        required: draft.required,
        options: joinColumnOptions(draft.options),
    };
}

function decodeEntry(record: WidgetRecord): TableEntry {
    return {
        id: record.id,
        position: record.position,
        data: record.data,
    };
}

export function useWidgetTable(widgetId: string): WidgetTableStore {
    const columnStore = useWidgetRecords(widgetId, widgetTableColumnCollection);
    const entryStore = useWidgetRecords(widgetId, widgetTableEntryCollection);

    const columns = columnStore.records.map(decodeColumn);
    const entries = entryStore.records.map(decodeEntry);

    return {
        columns: {
            columns,
            isPending: columnStore.isLoading,
            create: async (draft) => {
                await columnStore.create({ data: encodeColumn(draft) });
            },
            update: async (id, edit) => {
                const column = columns.find((candidate) => candidate.id === id);

                if (!column) return;

                await columnStore.update({
                    id,
                    data: encodeColumn({ ...edit, kind: column.kind }),
                });
            },
            remove: async (id) => {
                const orphaned = entries.filter((entry) => id in entry.data);

                await columnStore.remove(id);

                for (const entry of orphaned) {
                    await entryStore.update({
                        id: entry.id,
                        data: stripColumnValues(entry.data, id),
                    });
                }
            },
            reorder: async (ids) => {
                await columnStore.reorder(ids);
            },
        },
        entries: {
            entries,
            isPending: entryStore.isLoading,
            create: async (data) => {
                await entryStore.create({ data });
            },
            update: async (id, data) => {
                await entryStore.update({ id, data });
            },
            remove: async (id) => {
                await entryStore.remove(id);
            },
            reorder: async (ids) => {
                await entryStore.reorder(ids);
            },
        },
    };
}

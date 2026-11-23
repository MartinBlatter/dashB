import { useState } from 'react';
import {
    ActionIcon,
    Button,
    Group,
    Loader,
    Stack,
    Text,
    TextInput,
    Tooltip,
} from '@mantine/core';
import { useMounted } from '@mantine/hooks';
import { arrayMove } from '@dnd-kit/sortable';
import {
    ColumnsIcon,
    MagnifyingGlassIcon,
    PlusIcon,
    XIcon,
} from '@phosphor-icons/react';

import ColumnFormModal from '#/components/Table/ColumnFormModal';
import ColumnsModal from '#/components/Table/ColumnsModal';
import ConfirmDeleteModal from '#/components/Table/ConfirmDeleteModal';
import EntryFormModal from '#/components/Table/EntryFormModal';
import TableView from '#/components/Table/TableView';
import { entryMatches } from '#/components/Table/format';
import { t } from '#/components/Table/i18n';
import { nextSort, sortEntries } from '#/components/Table/sorting';
import { valueNumber } from '#/components/Widgets/values';
import { useDateFormat } from '#/lib/user-settings';
import { useWidgetTable } from '#/lib/widget-tables';

import type { DashboardWidgetMeta, DashboardWidgetProps } from './types';
import type { TableSort } from '#/components/Table/sorting';

export const widgetMeta = {
    type: 'table',
    label: () => t('label'),
    description: () => t('description'),
    defaultSize: { w: 6, h: 6, minW: 2, minH: 3 },
    fields: [
        {
            kind: 'switch',
            name: 'showSearch',
            label: () => t('show_search'),
            defaultValue: false,
        },
        {
            kind: 'number',
            name: 'rowLimit',
            label: () => t('row_limit'),
            description: () => t('row_limit_hint'),
            min: 0,
            max: 200,
            step: 1,
            defaultValue: 0,
        },
    ],
} satisfies DashboardWidgetMeta;

interface FormTarget {
    id: string | null;
}

interface DeleteTarget {
    kind: 'column' | 'entry';
    id: string;
}

export default function TableWidget({ id, config }: DashboardWidgetProps) {
    const { columns: columnStore, entries: entryStore } = useWidgetTable(id);
    const mounted = useMounted();
    const dateFormat = useDateFormat();

    const [sort, setSort] = useState<TableSort | null>(null);
    const [query, setQuery] = useState('');
    const [columnsOpen, setColumnsOpen] = useState(false);
    const [columnForm, setColumnForm] = useState<FormTarget | null>(null);
    const [entryForm, setEntryForm] = useState<FormTarget | null>(null);
    const [deleting, setDeleting] = useState<DeleteTarget | null>(null);

    const { columns } = columnStore;
    const { entries } = entryStore;

    const showSearch = config.showSearch === true;
    const rowLimit = Math.min(
        200,
        Math.max(0, valueNumber(config, 'rowLimit', 0))
    );

    const editingColumn =
        columns.find((column) => column.id === columnForm?.id) ?? null;
    const editingEntry =
        entries.find((entry) => entry.id === entryForm?.id) ?? null;

    const deletingColumn =
        deleting?.kind === 'column'
            ? (columns.find((column) => column.id === deleting.id) ?? null)
            : null;
    const deletingEntry =
        deleting?.kind === 'entry'
            ? (entries.find((entry) => entry.id === deleting.id) ?? null)
            : null;

    const searching = showSearch && query.trim() !== '';

    const matching = sortEntries(
        entries.filter(
            (entry) =>
                !searching || entryMatches(entry, columns, query, dateFormat)
        ),
        columns,
        sort
    );

    const visible = rowLimit === 0 ? matching : matching.slice(0, rowLimit);
    const hidden = matching.length - visible.length;

    function handleColumnMove(columnId: string, offset: number) {
        const ids = columns.map((column) => column.id);
        const index = ids.indexOf(columnId);
        const target = index + offset;

        if (index === -1 || target < 0 || target >= ids.length) return;

        void columnStore.reorder(arrayMove(ids, index, target));
    }

    if (columnStore.isPending || entryStore.isPending) {
        return (
            <Group justify="center" py="sm">
                <Loader size="xs" />
            </Group>
        );
    }

    return (
        <Stack gap="xs">
            <Group gap="xs" wrap="wrap" justify="space-between">
                <Group gap="xs" wrap="nowrap">
                    <Tooltip
                        label={t('no_columns_entry_hint')}
                        disabled={columns.length > 0}
                        withinPortal
                    >
                        <Button
                            size="compact-xs"
                            variant="light"
                            leftSection={<PlusIcon size={12} />}
                            disabled={columns.length === 0}
                            onClick={() => setEntryForm({ id: null })}
                        >
                            {t('add_entry')}
                        </Button>
                    </Tooltip>

                    <Button
                        size="compact-xs"
                        variant="subtle"
                        color="gray"
                        leftSection={<ColumnsIcon size={12} />}
                        onClick={() => setColumnsOpen(true)}
                    >
                        {t('manage_columns')}
                    </Button>
                </Group>

                {sort ? (
                    <Button
                        size="compact-xs"
                        variant="subtle"
                        color="gray"
                        onClick={() => setSort(null)}
                    >
                        {t('clear_sort')}
                    </Button>
                ) : null}
            </Group>

            {showSearch && columns.length > 0 ? (
                <TextInput
                    size="xs"
                    placeholder={t('search_placeholder')}
                    aria-label={t('search')}
                    value={query}
                    onChange={(event) => setQuery(event.currentTarget.value)}
                    leftSection={<MagnifyingGlassIcon size={12} />}
                    rightSection={
                        query === '' ? null : (
                            <ActionIcon
                                variant="subtle"
                                color="gray"
                                size="sm"
                                aria-label={t('clear_search')}
                                onClick={() => setQuery('')}
                            >
                                <XIcon size={12} />
                            </ActionIcon>
                        )
                    }
                />
            ) : null}

            {columns.length === 0 ? (
                <Stack gap="xs" align="flex-start">
                    <Text size="sm" c="dimmed">
                        {t('no_columns_yet')}
                    </Text>

                    <Button
                        size="compact-xs"
                        leftSection={<PlusIcon size={12} />}
                        onClick={() => setColumnForm({ id: null })}
                    >
                        {t('add_column')}
                    </Button>
                </Stack>
            ) : (
                <>
                    <TableView
                        columns={columns}
                        entries={visible}
                        sort={sort}
                        mounted={mounted}
                        dateFormat={dateFormat}
                        draggable={false}
                        dragEnabled={false}
                        filtered={searching}
                        minWidth={columns.length * 120 + 40}
                        dndId={`table-widget-${id}`}
                        onSort={(columnId) =>
                            setSort((current) => nextSort(current, columnId))
                        }
                        onEntryEdit={(entry) => setEntryForm({ id: entry.id })}
                        onEntryDelete={(entry) =>
                            setDeleting({ kind: 'entry', id: entry.id })
                        }
                        onReorder={(ids) => void entryStore.reorder(ids)}
                    />

                    {hidden > 0 ? (
                        <Text size="xs" c="dimmed">
                            {`${hidden} ${t('more_rows')}`}
                        </Text>
                    ) : null}
                </>
            )}

            <ColumnsModal
                opened={columnsOpen}
                columns={columns}
                onClose={() => setColumnsOpen(false)}
                onAdd={() => setColumnForm({ id: null })}
                onEdit={(column) => setColumnForm({ id: column.id })}
                onDelete={(column) =>
                    setDeleting({ kind: 'column', id: column.id })
                }
                onMove={(column, offset) => handleColumnMove(column.id, offset)}
            />

            <ColumnFormModal
                opened={columnForm !== null}
                column={editingColumn}
                onClose={() => setColumnForm(null)}
                onSubmit={async (draft) => {
                    if (editingColumn) {
                        await columnStore.update(editingColumn.id, {
                            label: draft.label,
                            required: draft.required,
                            options: draft.options,
                        });

                        return;
                    }

                    await columnStore.create(draft);
                }}
            />

            <EntryFormModal
                opened={entryForm !== null}
                columns={columns}
                entry={editingEntry}
                onClose={() => setEntryForm(null)}
                onSubmit={async (data) => {
                    if (editingEntry) {
                        await entryStore.update(editingEntry.id, data);

                        return;
                    }

                    await entryStore.create(data);
                }}
            />

            <ConfirmDeleteModal
                opened={deletingColumn !== null}
                title={t('delete_column')}
                prompt={t('delete_column_prompt')}
                detail={deletingColumn?.label}
                onConfirm={async () => {
                    if (!deletingColumn) return;

                    await columnStore.remove(deletingColumn.id);
                }}
                onClose={() => setDeleting(null)}
            />

            <ConfirmDeleteModal
                opened={deletingEntry !== null}
                title={t('delete_entry')}
                prompt={t('delete_entry_prompt')}
                onConfirm={async () => {
                    if (!deletingEntry) return;

                    await entryStore.remove(deletingEntry.id);
                }}
                onClose={() => setDeleting(null)}
            />
        </Stack>
    );
}

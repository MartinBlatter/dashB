import { useState } from 'react';
import {
    ActionIcon,
    Alert,
    Button,
    Group,
    Skeleton,
    Stack,
    Text,
    TextInput,
    Tooltip,
} from '@mantine/core';
import { useMounted } from '@mantine/hooks';
import { arrayMove } from '@dnd-kit/sortable';
import {
    MagnifyingGlassIcon,
    PlusIcon,
    TableIcon,
    XIcon,
} from '@phosphor-icons/react';

import { useTableColumns, useTableEntries } from '#/lib/page-tables';

import ColumnFormModal from './table/ColumnFormModal';
import ConfirmDeleteModal from './table/ConfirmDeleteModal';
import EntryFormModal from './table/EntryFormModal';
import TableView from './table/TableView';
import { entryMatches } from './table/format';
import { t } from './table/i18n';
import { nextSort, sortEntries } from './table/sorting';

import type { PageTypeMeta, PageTypeProps } from './types';
import type { TableSort } from './table/sorting';

export const widgetMeta = {
    type: 'table',
    label: () => t('label'),
    description: () => t('description'),
    icon: TableIcon,
} satisfies PageTypeMeta;

interface FormTarget {
    id: string | null;
}

interface DeleteTarget {
    kind: 'column' | 'entry';
    id: string;
}

export default function TablePageType({ pageId }: PageTypeProps) {
    const columnStore = useTableColumns(pageId);
    const entryStore = useTableEntries(pageId);
    const mounted = useMounted();

    const [sort, setSort] = useState<TableSort | null>(null);
    const [query, setQuery] = useState('');
    const [columnForm, setColumnForm] = useState<FormTarget | null>(null);
    const [entryForm, setEntryForm] = useState<FormTarget | null>(null);
    const [deleting, setDeleting] = useState<DeleteTarget | null>(null);

    const { columns } = columnStore;
    const { entries } = entryStore;

    const editingColumnId = columnForm?.id ?? null;
    const editingEntryId = entryForm?.id ?? null;

    const editingColumn =
        columns.find((column) => column.id === editingColumnId) ?? null;
    const editingEntry =
        entries.find((entry) => entry.id === editingEntryId) ?? null;

    const deletingColumn =
        deleting?.kind === 'column'
            ? (columns.find((column) => column.id === deleting.id) ?? null)
            : null;
    const deletingEntry =
        deleting?.kind === 'entry'
            ? (entries.find((entry) => entry.id === deleting.id) ?? null)
            : null;

    const searching = query.trim() !== '';

    const visible = sortEntries(
        entries.filter((entry) => entryMatches(entry, columns, query)),
        columns,
        sort
    );

    function handleColumnMove(columnId: string, offset: number) {
        const ids = columns.map((column) => column.id);
        const index = ids.indexOf(columnId);
        const target = index + offset;

        if (index === -1 || target < 0 || target >= ids.length) return;

        void columnStore.reorder(arrayMove(ids, index, target));
    }

    if (columnStore.isPending || entryStore.isPending) {
        return (
            <Stack gap="xs">
                <Skeleton height={36} />
                <Skeleton height={32} />
                <Skeleton height={32} />
                <Skeleton height={32} />
            </Stack>
        );
    }

    return (
        <Stack gap="md">
            <Group justify="space-between" align="flex-end" wrap="wrap">
                <TextInput
                    label={t('search')}
                    placeholder={t('search_placeholder')}
                    value={query}
                    onChange={(event) => setQuery(event.currentTarget.value)}
                    leftSection={<MagnifyingGlassIcon size={14} />}
                    rightSection={
                        searching ? (
                            <ActionIcon
                                variant="subtle"
                                color="gray"
                                size="sm"
                                aria-label={t('clear_search')}
                                onClick={() => setQuery('')}
                            >
                                <XIcon size={14} />
                            </ActionIcon>
                        ) : null
                    }
                    disabled={columns.length === 0}
                    style={{ flexGrow: 1, maxWidth: 320 }}
                />

                <Group gap="xs" wrap="nowrap">
                    {sort ? (
                        <Button
                            variant="subtle"
                            color="gray"
                            size="compact-sm"
                            onClick={() => setSort(null)}
                        >
                            {t('clear_sort')}
                        </Button>
                    ) : null}

                    <Button
                        variant="default"
                        leftSection={<PlusIcon size={14} />}
                        onClick={() => setColumnForm({ id: null })}
                    >
                        {t('add_column')}
                    </Button>

                    <Tooltip
                        label={t('no_columns_entry_hint')}
                        disabled={columns.length > 0}
                        withinPortal
                    >
                        <Button
                            leftSection={<PlusIcon size={14} />}
                            disabled={columns.length === 0}
                            onClick={() => setEntryForm({ id: null })}
                        >
                            {t('add_entry')}
                        </Button>
                    </Tooltip>
                </Group>
            </Group>

            {columns.length === 0 ? (
                <Alert variant="light" title={t('no_columns_title')}>
                    <Stack gap="sm" align="flex-start">
                        <Text size="sm">{t('no_columns_hint')}</Text>

                        <Button
                            leftSection={<PlusIcon size={14} />}
                            variant="filled"
                            onClick={() => setColumnForm({ id: null })}
                        >
                            {t('add_column')}
                        </Button>
                    </Stack>
                </Alert>
            ) : (
                <TableView
                    columns={columns}
                    entries={visible}
                    sort={sort}
                    mounted={mounted}
                    dragEnabled={sort === null && !searching}
                    filtered={searching}
                    onSort={(columnId) =>
                        setSort((current) => nextSort(current, columnId))
                    }
                    onColumnEdit={(column) => setColumnForm({ id: column.id })}
                    onColumnDelete={(column) =>
                        setDeleting({ kind: 'column', id: column.id })
                    }
                    onColumnMove={(column, offset) =>
                        handleColumnMove(column.id, offset)
                    }
                    onAddColumn={() => setColumnForm({ id: null })}
                    onEntryEdit={(entry) => setEntryForm({ id: entry.id })}
                    onEntryDelete={(entry) =>
                        setDeleting({ kind: 'entry', id: entry.id })
                    }
                    onReorder={(ids) => void entryStore.reorder(ids)}
                />
            )}

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

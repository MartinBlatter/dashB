import { ActionIcon, Table, Text, Tooltip } from '@mantine/core';
import {
    DndContext,
    KeyboardSensor,
    PointerSensor,
    closestCenter,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    SortableContext,
    arrayMove,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { PlusIcon } from '@phosphor-icons/react';

import { solidBodyColor } from '#/lib/theme';

import TableEntryRow from './TableEntryRow';
import TableHeaderCell from './TableHeaderCell';
import { t } from './i18n';

import type { TableSort } from './sorting';
import type { DragEndEvent } from '@dnd-kit/core';
import type { DateFormat } from '#/lib/date-format';
import type { TableColumn, TableEntry } from '#/lib/table-schema';

export default function TableView({
    columns,
    entries,
    sort,
    mounted,
    dateFormat,
    draggable = true,
    dragEnabled,
    filtered,
    minWidth = 520,
    dndId = 'table-entries',
    onSort,
    onColumnEdit,
    onColumnDelete,
    onColumnMove,
    onAddColumn,
    onEntryEdit,
    onEntryDelete,
    onReorder,
}: {
    columns: ReadonlyArray<TableColumn>;
    entries: ReadonlyArray<TableEntry>;
    sort: TableSort | null;
    mounted: boolean;
    dateFormat: DateFormat;
    draggable?: boolean;
    dragEnabled: boolean;
    filtered: boolean;
    minWidth?: number;
    dndId?: string;
    onSort: (columnId: string) => void;
    onColumnEdit?: (column: TableColumn) => void;
    onColumnDelete?: (column: TableColumn) => void;
    onColumnMove?: (column: TableColumn, offset: number) => void;
    onAddColumn?: () => void;
    onEntryEdit: (entry: TableEntry) => void;
    onEntryDelete: (entry: TableEntry) => void;
    onReorder: (ids: Array<string>) => void;
}) {
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const ids = entries.map((entry) => entry.id);

    const columnMenu =
        onColumnEdit && onColumnDelete && onColumnMove
            ? (column: TableColumn) => ({
                  onEdit: () => onColumnEdit(column),
                  onDelete: () => onColumnDelete(column),
                  onMove: (offset: number) => onColumnMove(column, offset),
              })
            : null;

    function handleDragEnd({ active, over }: DragEndEvent) {
        if (!over || active.id === over.id) return;

        const from = ids.indexOf(String(active.id));
        const to = ids.indexOf(String(over.id));

        if (from === -1 || to === -1) return;

        onReorder(arrayMove(ids, from, to));
    }

    return (
        <Table.ScrollContainer minWidth={minWidth}>
            <DndContext
                id={dndId}
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <Table
                    stickyHeader
                    highlightOnHover
                    withTableBorder
                    verticalSpacing="xs"
                    styles={{ thead: { backgroundColor: solidBodyColor } }}
                >
                    <Table.Thead>
                        <Table.Tr>
                            {draggable ? (
                                <Table.Th style={{ width: 36 }} />
                            ) : null}

                            {columns.map((column, index) => (
                                <TableHeaderCell
                                    key={column.id}
                                    column={column}
                                    index={index}
                                    count={columns.length}
                                    sort={sort}
                                    onSort={() => onSort(column.id)}
                                    menu={columnMenu?.(column)}
                                />
                            ))}

                            <Table.Th style={{ width: 36 }}>
                                {onAddColumn ? (
                                    <Tooltip
                                        label={t('add_column')}
                                        withinPortal
                                    >
                                        <ActionIcon
                                            variant="subtle"
                                            color="gray"
                                            size="sm"
                                            aria-label={t('add_column')}
                                            onClick={onAddColumn}
                                        >
                                            <PlusIcon size={14} />
                                        </ActionIcon>
                                    </Tooltip>
                                ) : null}
                            </Table.Th>
                        </Table.Tr>
                    </Table.Thead>

                    <Table.Tbody>
                        <SortableContext
                            items={ids}
                            strategy={verticalListSortingStrategy}
                        >
                            {entries.map((entry) => (
                                <TableEntryRow
                                    key={entry.id}
                                    entry={entry}
                                    columns={columns}
                                    mounted={mounted}
                                    dateFormat={dateFormat}
                                    draggable={draggable}
                                    dragEnabled={dragEnabled}
                                    onEdit={() => onEntryEdit(entry)}
                                    onDelete={() => onEntryDelete(entry)}
                                />
                            ))}
                        </SortableContext>

                        {entries.length === 0 ? (
                            <Table.Tr>
                                <Table.Td
                                    colSpan={
                                        columns.length + (draggable ? 2 : 1)
                                    }
                                >
                                    <Text size="sm" c="dimmed">
                                        {filtered
                                            ? t('no_matches')
                                            : t('empty_entries')}
                                    </Text>
                                </Table.Td>
                            </Table.Tr>
                        ) : null}
                    </Table.Tbody>
                </Table>
            </DndContext>
        </Table.ScrollContainer>
    );
}

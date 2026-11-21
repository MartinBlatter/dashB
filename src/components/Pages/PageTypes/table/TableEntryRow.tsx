import { ActionIcon, Menu, Table, Tooltip } from '@mantine/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    DotsSixVerticalIcon,
    DotsThreeVerticalIcon,
    PencilSimpleIcon,
    TrashIcon,
} from '@phosphor-icons/react';

import TableCell from './TableCell';
import { entryValue } from './format';
import { t } from './i18n';

import type { TableColumn, TableEntry } from '#/lib/page-tables';

export default function TableEntryRow({
    entry,
    columns,
    mounted,
    dragEnabled,
    onEdit,
    onDelete,
}: {
    entry: TableEntry;
    columns: ReadonlyArray<TableColumn>;
    mounted: boolean;
    dragEnabled: boolean;
    onEdit: () => void;
    onDelete: () => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        setActivatorNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: entry.id, disabled: !dragEnabled });

    return (
        <Table.Tr
            ref={setNodeRef}
            style={{
                transform: CSS.Transform.toString(transform),
                transition,
                position: 'relative',
                zIndex: isDragging ? 1 : undefined,
                opacity: isDragging ? 0.5 : 1,
            }}
        >
            <Table.Td style={{ width: 36 }}>
                <Tooltip
                    label={dragEnabled ? t('reorder') : t('reorder_disabled')}
                    withinPortal
                >
                    <ActionIcon
                        ref={setActivatorNodeRef}
                        {...attributes}
                        {...listeners}
                        variant="subtle"
                        color="gray"
                        size="sm"
                        disabled={!dragEnabled}
                        aria-label={t('reorder')}
                        style={{
                            cursor: isDragging ? 'grabbing' : 'grab',
                            touchAction: 'none',
                        }}
                    >
                        <DotsSixVerticalIcon size={14} />
                    </ActionIcon>
                </Tooltip>
            </Table.Td>

            {columns.map((column) => (
                <TableCell
                    key={column.id}
                    column={column}
                    value={entryValue(entry, column)}
                    mounted={mounted}
                />
            ))}

            <Table.Td style={{ width: 36 }}>
                <Menu position="bottom-end" withinPortal>
                    <Menu.Target>
                        <ActionIcon
                            variant="subtle"
                            color="gray"
                            size="sm"
                            aria-label={t('entry_menu')}
                        >
                            <DotsThreeVerticalIcon size={14} />
                        </ActionIcon>
                    </Menu.Target>

                    <Menu.Dropdown>
                        <Menu.Item
                            leftSection={<PencilSimpleIcon size={14} />}
                            onClick={onEdit}
                        >
                            {t('edit_entry')}
                        </Menu.Item>

                        <Menu.Item
                            color="red"
                            leftSection={<TrashIcon size={14} />}
                            onClick={onDelete}
                        >
                            {t('delete_entry')}
                        </Menu.Item>
                    </Menu.Dropdown>
                </Menu>
            </Table.Td>
        </Table.Tr>
    );
}

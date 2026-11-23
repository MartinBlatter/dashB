import {
    ActionIcon,
    Button,
    Group,
    Modal,
    Paper,
    Stack,
    Text,
    Tooltip,
} from '@mantine/core';
import {
    ArrowDownIcon,
    ArrowUpIcon,
    PencilSimpleIcon,
    PlusIcon,
    TrashIcon,
} from '@phosphor-icons/react';

import { maxTableColumns } from '#/lib/table-schema';

import { kindLabel } from './columns';
import { t } from './i18n';

import type { TableColumn } from '#/lib/table-schema';

export default function ColumnsModal({
    opened,
    columns,
    onClose,
    onAdd,
    onEdit,
    onDelete,
    onMove,
}: {
    opened: boolean;
    columns: ReadonlyArray<TableColumn>;
    onClose: () => void;
    onAdd: () => void;
    onEdit: (column: TableColumn) => void;
    onDelete: (column: TableColumn) => void;
    onMove: (column: TableColumn, offset: number) => void;
}) {
    const full = columns.length >= maxTableColumns;

    return (
        <Modal opened={opened} onClose={onClose} title={t('columns_title')}>
            <Stack gap="sm">
                <Text size="sm" c="dimmed">
                    {t('columns_hint')}
                </Text>

                {columns.length === 0 ? (
                    <Text size="sm">{t('no_columns_yet')}</Text>
                ) : (
                    <Stack gap={6}>
                        {columns.map((column, index) => (
                            <Paper
                                key={column.id}
                                withBorder
                                p="xs"
                                radius="sm"
                            >
                                <Group gap="xs" wrap="nowrap">
                                    <Stack
                                        gap={0}
                                        style={{ flex: 1, minWidth: 0 }}
                                    >
                                        <Text size="sm" fw={500} truncate>
                                            {column.label}
                                        </Text>
                                        <Text size="xs" c="dimmed">
                                            {kindLabel(column.kind)}
                                        </Text>
                                    </Stack>

                                    <ActionIcon
                                        variant="subtle"
                                        color="gray"
                                        size="sm"
                                        disabled={index === 0}
                                        aria-label={t('move_up')}
                                        onClick={() => onMove(column, -1)}
                                    >
                                        <ArrowUpIcon size={14} />
                                    </ActionIcon>

                                    <ActionIcon
                                        variant="subtle"
                                        color="gray"
                                        size="sm"
                                        disabled={index === columns.length - 1}
                                        aria-label={t('move_down')}
                                        onClick={() => onMove(column, 1)}
                                    >
                                        <ArrowDownIcon size={14} />
                                    </ActionIcon>

                                    <ActionIcon
                                        variant="subtle"
                                        color="gray"
                                        size="sm"
                                        aria-label={t('edit_column')}
                                        onClick={() => onEdit(column)}
                                    >
                                        <PencilSimpleIcon size={14} />
                                    </ActionIcon>

                                    <ActionIcon
                                        variant="subtle"
                                        color="red"
                                        size="sm"
                                        aria-label={t('delete_column')}
                                        onClick={() => onDelete(column)}
                                    >
                                        <TrashIcon size={14} />
                                    </ActionIcon>
                                </Group>
                            </Paper>
                        ))}
                    </Stack>
                )}

                <Group justify="space-between">
                    <Tooltip
                        label={t('max_columns_reached')}
                        disabled={!full}
                        withinPortal
                    >
                        <Button
                            variant="default"
                            leftSection={<PlusIcon size={14} />}
                            disabled={full}
                            onClick={onAdd}
                        >
                            {t('add_column')}
                        </Button>
                    </Tooltip>

                    <Button onClick={onClose}>{t('done')}</Button>
                </Group>
            </Stack>
        </Modal>
    );
}

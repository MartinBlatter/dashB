import {
    ActionIcon,
    Group,
    Menu,
    Table,
    Text,
    UnstyledButton,
} from '@mantine/core';
import {
    ArrowLeftIcon,
    ArrowRightIcon,
    CaretDownIcon,
    CaretUpIcon,
    DotsThreeVerticalIcon,
    PencilSimpleIcon,
    TrashIcon,
} from '@phosphor-icons/react';

import { kindLabel } from './columns';
import { t } from './i18n';

import type { TableSort } from './sorting';
import type { TableColumn } from '#/lib/table-schema';

export interface TableColumnMenu {
    onEdit: () => void;
    onDelete: () => void;
    onMove: (offset: number) => void;
}

export default function TableHeaderCell({
    column,
    index,
    count,
    sort,
    onSort,
    menu,
}: {
    column: TableColumn;
    index: number;
    count: number;
    sort: TableSort | null;
    onSort: () => void;
    menu?: TableColumnMenu;
}) {
    const active = sort?.columnId === column.id ? sort : null;

    return (
        <Table.Th
            ta={column.kind === 'number' ? 'right' : undefined}
            aria-sort={
                active
                    ? active.direction === 'asc'
                        ? 'ascending'
                        : 'descending'
                    : 'none'
            }
            style={{ whiteSpace: 'nowrap' }}
        >
            <Group gap={2} wrap="nowrap" justify="space-between">
                <UnstyledButton
                    onClick={onSort}
                    aria-label={
                        active
                            ? active.direction === 'asc'
                                ? t('sort_asc')
                                : t('sort_desc')
                            : column.label
                    }
                    style={{ minWidth: 0 }}
                >
                    <Group gap={4} wrap="nowrap">
                        <Text size="sm" fw={600} truncate>
                            {column.label}
                        </Text>

                        {active ? (
                            active.direction === 'asc' ? (
                                <CaretUpIcon size={12} aria-hidden />
                            ) : (
                                <CaretDownIcon size={12} aria-hidden />
                            )
                        ) : null}
                    </Group>
                </UnstyledButton>

                {menu ? (
                    <Menu position="bottom-end" withinPortal>
                        <Menu.Target>
                            <ActionIcon
                                variant="subtle"
                                color="gray"
                                size="sm"
                                aria-label={t('column_menu')}
                            >
                                <DotsThreeVerticalIcon size={14} />
                            </ActionIcon>
                        </Menu.Target>

                        <Menu.Dropdown>
                            <Menu.Label>{kindLabel(column.kind)}</Menu.Label>

                            <Menu.Item
                                leftSection={<PencilSimpleIcon size={14} />}
                                onClick={menu.onEdit}
                            >
                                {t('edit_column')}
                            </Menu.Item>

                            <Menu.Item
                                leftSection={<ArrowLeftIcon size={14} />}
                                disabled={index === 0}
                                onClick={() => menu.onMove(-1)}
                            >
                                {t('move_left')}
                            </Menu.Item>

                            <Menu.Item
                                leftSection={<ArrowRightIcon size={14} />}
                                disabled={index === count - 1}
                                onClick={() => menu.onMove(1)}
                            >
                                {t('move_right')}
                            </Menu.Item>

                            <Menu.Divider />

                            <Menu.Item
                                color="red"
                                leftSection={<TrashIcon size={14} />}
                                onClick={menu.onDelete}
                            >
                                {t('delete_column')}
                            </Menu.Item>
                        </Menu.Dropdown>
                    </Menu>
                ) : null}
            </Group>
        </Table.Th>
    );
}

import { ActionIcon, Box, Group, Menu, Text } from '@mantine/core';
import {
    DotsThreeVerticalIcon,
    PencilSimpleIcon,
    TrashIcon,
} from '@phosphor-icons/react';

import { categoryLabel, formatAmount, t } from './expenses';

import type { Expense } from './expenses';

export default function EntryRow({
    entry,
    currency,
    onEdit,
    onDelete,
}: {
    entry: Expense;
    currency: string;
    onEdit: () => void;
    onDelete: () => void;
}) {
    return (
        <Group gap="xs" wrap="nowrap">
            <Box style={{ flex: 1, minWidth: 0 }}>
                <Text size="sm" truncate>
                    {entry.note === ''
                        ? categoryLabel(entry.category)
                        : entry.note}
                </Text>
                <Text size="xs" c="dimmed" truncate>
                    {`${entry.day} · ${categoryLabel(entry.category)}`}
                </Text>
            </Box>

            <Text size="sm" fw={500} style={{ whiteSpace: 'nowrap' }}>
                {formatAmount(entry.amount, currency)}
            </Text>

            <Menu position="bottom-end" withinPortal>
                <Menu.Target>
                    <ActionIcon
                        variant="subtle"
                        color="gray"
                        size="sm"
                        aria-label={t('options')}
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
        </Group>
    );
}

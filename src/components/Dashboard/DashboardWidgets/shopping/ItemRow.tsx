import {
    ActionIcon,
    Badge,
    Box,
    Checkbox,
    Group,
    Menu,
    Text,
} from '@mantine/core';
import {
    DotsThreeVerticalIcon,
    PencilSimpleIcon,
    TrashIcon,
} from '@phosphor-icons/react';

import { brandColor } from '#/lib/theme';

import { quantityLabel, t } from './shopping';

import type { ShoppingItem } from './shopping';

export default function ItemRow({
    item,
    onToggle,
    onEdit,
    onDelete,
}: {
    item: ShoppingItem;
    onToggle: () => void;
    onEdit: () => void;
    onDelete: () => void;
}) {
    const checked = item.checkedAt !== null;
    const quantity = quantityLabel(item);

    return (
        <Group gap="xs" wrap="nowrap" align="flex-start">
            <Checkbox
                size="sm"
                mt={2}
                checked={checked}
                aria-label={`${checked ? t('uncheck') : t('check')}: ${item.name}`}
                onChange={onToggle}
            />

            <Box style={{ flex: 1, minWidth: 0 }}>
                <Group gap={6} wrap="wrap">
                    <Text
                        size="sm"
                        c={checked ? 'dimmed' : undefined}
                        td={checked ? 'line-through' : undefined}
                        style={{ wordBreak: 'break-word' }}
                    >
                        {item.name}
                    </Text>

                    {quantity ? (
                        <Badge
                            size="xs"
                            variant="light"
                            color={checked ? 'gray' : brandColor}
                        >
                            {quantity}
                        </Badge>
                    ) : null}
                </Group>

                {item.note ? (
                    <Text
                        size="xs"
                        c="dimmed"
                        style={{ wordBreak: 'break-word' }}
                    >
                        {item.note}
                    </Text>
                ) : null}
            </Box>

            <Menu position="bottom-end" withinPortal>
                <Menu.Target>
                    <ActionIcon
                        variant="subtle"
                        color="gray"
                        size="sm"
                        aria-label={`${t('options')}: ${item.name}`}
                    >
                        <DotsThreeVerticalIcon size={14} />
                    </ActionIcon>
                </Menu.Target>

                <Menu.Dropdown>
                    <Menu.Item
                        leftSection={<PencilSimpleIcon size={14} />}
                        onClick={onEdit}
                    >
                        {t('edit_item')}
                    </Menu.Item>
                    <Menu.Item
                        color="red"
                        leftSection={<TrashIcon size={14} />}
                        onClick={onDelete}
                    >
                        {t('delete_item')}
                    </Menu.Item>
                </Menu.Dropdown>
            </Menu>
        </Group>
    );
}

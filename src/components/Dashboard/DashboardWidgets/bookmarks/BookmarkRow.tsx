import {
    ActionIcon,
    Anchor,
    Avatar,
    Box,
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

import { initialOf, t } from './bookmarks';

import type { Bookmark } from './bookmarks';

export default function BookmarkRow({
    bookmark,
    newTab,
    onEdit,
    onDelete,
}: {
    bookmark: Bookmark;
    newTab: boolean;
    onEdit: () => void;
    onDelete: () => void;
}) {
    return (
        <Group gap="xs" wrap="nowrap">
            <Avatar size={26} radius="sm" color={brandColor}>
                <Text size="xs" fw={600}>
                    {initialOf(bookmark.title, bookmark.host)}
                </Text>
            </Avatar>

            <Box style={{ flex: 1, minWidth: 0 }}>
                {bookmark.href === null ? (
                    <Text size="sm" c="dimmed" truncate>
                        {bookmark.title}
                    </Text>
                ) : (
                    <Anchor
                        href={bookmark.href}
                        target={newTab ? '_blank' : undefined}
                        rel="noreferrer"
                        size="sm"
                        truncate
                        display="block"
                    >
                        {bookmark.title}
                    </Anchor>
                )}

                <Text size="xs" c="dimmed" truncate>
                    {bookmark.href === null
                        ? t('unusable')
                        : (bookmark.host ?? '')}
                </Text>
            </Box>

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
                        {t('edit_bookmark')}
                    </Menu.Item>
                    <Menu.Item
                        color="red"
                        leftSection={<TrashIcon size={14} />}
                        onClick={onDelete}
                    >
                        {t('delete_bookmark')}
                    </Menu.Item>
                </Menu.Dropdown>
            </Menu>
        </Group>
    );
}

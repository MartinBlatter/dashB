import { useState } from 'react';
import { Button, Group, Loader, SimpleGrid, Stack, Text } from '@mantine/core';
import { PlusIcon } from '@phosphor-icons/react';

import { valueNumber } from '#/components/Widgets/values';
import { useWidgetRecords } from '#/lib/widget-records';

import BookmarkFormModal from './bookmarks/BookmarkFormModal';
import BookmarkRow from './bookmarks/BookmarkRow';
import { bookmarkCollection, decodeBookmark, t } from './bookmarks/bookmarks';

import type { DashboardWidgetMeta, DashboardWidgetProps } from './types';
import type { StoredWidgetValues } from '#/components/Widgets/types';

export const widgetMeta = {
    type: 'bookmarks',
    label: () => t('label'),
    description: () => t('description'),
    defaultSize: { w: 3, h: 5, minW: 1, minH: 3 },
    fields: [
        {
            kind: 'switch',
            name: 'newTab',
            label: () => t('new_tab'),
            defaultValue: true,
        },
        {
            kind: 'number',
            name: 'columns',
            label: () => t('columns'),
            description: () => t('columns_hint'),
            min: 1,
            max: 3,
            step: 1,
            defaultValue: 1,
        },
    ],
} satisfies DashboardWidgetMeta;

export default function BookmarksWidget({ id, config }: DashboardWidgetProps) {
    const store = useWidgetRecords(id, bookmarkCollection);
    const [adding, setAdding] = useState(false);
    const [editing, setEditing] = useState<string | null>(null);

    const newTab = config.newTab !== false;
    const columns = Math.min(3, Math.max(1, valueNumber(config, 'columns', 1)));

    const bookmarks = store.records.map(decodeBookmark);
    const editingBookmark =
        bookmarks.find((bookmark) => bookmark.id === editing) ?? null;

    async function handleCreate(values: StoredWidgetValues) {
        await store.create({ data: values });

        setAdding(false);
    }

    async function handleEdit(values: StoredWidgetValues) {
        if (!editingBookmark) return;

        await store.update({ id: editingBookmark.id, data: values });

        setEditing(null);
    }

    return (
        <Stack gap="xs">
            <Group justify="flex-end">
                <Button
                    size="compact-xs"
                    variant="light"
                    leftSection={<PlusIcon size={12} />}
                    onClick={() => setAdding(true)}
                >
                    {t('add_bookmark')}
                </Button>
            </Group>

            {store.isLoading ? (
                <Group justify="center" py="sm">
                    <Loader size="xs" />
                </Group>
            ) : bookmarks.length === 0 ? (
                <Text size="sm" c="dimmed">
                    {t('empty')}
                </Text>
            ) : (
                <SimpleGrid cols={columns} spacing="xs" verticalSpacing={6}>
                    {bookmarks.map((bookmark) => (
                        <BookmarkRow
                            key={bookmark.id}
                            bookmark={bookmark}
                            newTab={newTab}
                            onEdit={() => setEditing(bookmark.id)}
                            onDelete={() => void store.remove(bookmark.id)}
                        />
                    ))}
                </SimpleGrid>
            )}

            <BookmarkFormModal
                opened={adding}
                bookmark={null}
                onClose={() => setAdding(false)}
                onSubmit={handleCreate}
            />

            <BookmarkFormModal
                opened={editingBookmark !== null}
                bookmark={editingBookmark}
                onClose={() => setEditing(null)}
                onSubmit={handleEdit}
            />
        </Stack>
    );
}

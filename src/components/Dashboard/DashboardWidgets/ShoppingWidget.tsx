import { useState } from 'react';
import { Button, Divider, Group, Loader, Stack, Text } from '@mantine/core';
import { TrashIcon } from '@phosphor-icons/react';

import { useWidgetRecords } from '#/lib/widget-records';

import ItemFormModal from './shopping/ItemFormModal';
import ItemRow from './shopping/ItemRow';
import QuickAdd from './shopping/QuickAdd';
import {
    categoryLabel,
    decodeItem,
    encodeItem,
    groupByCategory,
    itemCollection,
    itemSortKey,
    t,
    toggleItem,
} from './shopping/shopping';

import type { DashboardWidgetMeta, DashboardWidgetProps } from './types';
import type { ShoppingItem } from './shopping/shopping';
import type { StoredWidgetValues } from '#/components/Widgets/types';

export const widgetMeta = {
    type: 'shopping',
    label: () => t('label'),
    description: () => t('description'),
    defaultSize: { w: 3, h: 7, minW: 1, minH: 4 },
    fields: [
        {
            kind: 'switch',
            name: 'groupByCategory',
            label: () => t('group_by_category'),
            defaultValue: true,
        },
        {
            kind: 'switch',
            name: 'showChecked',
            label: () => t('show_checked'),
            defaultValue: true,
        },
    ],
} satisfies DashboardWidgetMeta;

export default function ShoppingWidget({ id, config }: DashboardWidgetProps) {
    const store = useWidgetRecords(id, itemCollection, 'sortKey');
    const [adding, setAdding] = useState(false);
    const [editing, setEditing] = useState<string | null>(null);

    const grouped = config.groupByCategory !== false;
    const showChecked = config.showChecked !== false;

    const items = store.records.map(decodeItem);
    const open = items.filter((item) => item.checkedAt === null);
    const checked = items.filter((item) => item.checkedAt !== null);

    const editingItem = items.find((item) => item.id === editing) ?? null;

    async function handleQuickAdd(name: string) {
        const data = encodeItem({
            name,
            quantity: null,
            unit: 'pcs',
            category: 'other',
            note: '',
            checkedAt: null,
        });

        await store.create({ data, sortKey: itemSortKey(data) });
    }

    async function handleCreate(values: StoredWidgetValues) {
        await store.create({
            data: { ...values, checkedAt: null },
            sortKey: itemSortKey(values),
        });

        setAdding(false);
    }

    async function handleEdit(item: ShoppingItem, values: StoredWidgetValues) {
        await store.update({
            id: item.id,
            data: { ...values, checkedAt: item.checkedAt },
            sortKey: itemSortKey(values),
        });

        setEditing(null);
    }

    async function handleToggle(item: ShoppingItem) {
        const data = toggleItem(item, new Date());

        await store.update({ id: item.id, data, sortKey: itemSortKey(data) });
    }

    async function handleClearChecked() {
        await Promise.all(checked.map((item) => store.remove(item.id)));
    }

    function renderRow(item: ShoppingItem) {
        return (
            <ItemRow
                key={item.id}
                item={item}
                onToggle={() => void handleToggle(item)}
                onEdit={() => setEditing(item.id)}
                onDelete={() => void store.remove(item.id)}
            />
        );
    }

    return (
        <Stack gap="xs">
            <QuickAdd
                onAdd={handleQuickAdd}
                onDetails={() => setAdding(true)}
            />

            {store.isLoading ? (
                <Group justify="center" py="sm">
                    <Loader size="xs" />
                </Group>
            ) : items.length === 0 ? (
                <Text size="sm" c="dimmed">
                    {t('empty')}
                </Text>
            ) : (
                <>
                    {checked.length > 0 ? (
                        <Text size="xs" c="dimmed">
                            {`${checked.length}/${items.length} ${t('in_cart')}`}
                        </Text>
                    ) : null}

                    {grouped
                        ? groupByCategory(open).map(([category, bucket]) => (
                              <Stack key={category} gap={4}>
                                  <Divider
                                      label={
                                          <Text size="xs" fw={600} c="dimmed">
                                              {categoryLabel(category)}
                                          </Text>
                                      }
                                      labelPosition="left"
                                  />

                                  {bucket.map(renderRow)}
                              </Stack>
                          ))
                        : open.map(renderRow)}

                    {showChecked && checked.length > 0 ? (
                        <Stack key="checked" gap={4}>
                            <Divider
                                label={
                                    <Text size="xs" fw={600} c="dimmed">
                                        {t('section_checked')}
                                    </Text>
                                }
                                labelPosition="left"
                            />

                            {checked.map(renderRow)}

                            <Group justify="flex-end">
                                <Button
                                    size="compact-xs"
                                    variant="subtle"
                                    color="red"
                                    leftSection={<TrashIcon size={12} />}
                                    onClick={() => void handleClearChecked()}
                                >
                                    {t('clear_checked')}
                                </Button>
                            </Group>
                        </Stack>
                    ) : null}
                </>
            )}

            <ItemFormModal
                opened={adding}
                item={null}
                onClose={() => setAdding(false)}
                onSubmit={handleCreate}
            />

            <ItemFormModal
                opened={editingItem !== null}
                item={editingItem}
                onClose={() => setEditing(null)}
                onSubmit={(values) =>
                    editingItem
                        ? handleEdit(editingItem, values)
                        : Promise.resolve()
                }
            />
        </Stack>
    );
}

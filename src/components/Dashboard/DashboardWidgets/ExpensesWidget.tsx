import { useState } from 'react';
import { Button, Divider, Group, Loader, Stack, Text } from '@mantine/core';
import { PlusIcon } from '@phosphor-icons/react';

import MiniBars from '#/components/Widgets/MiniBars';
import { useNow } from '#/components/Widgets/useNow';
import { valueNumber, valueText } from '#/components/Widgets/values';
import { useWidgetRecords } from '#/lib/widget-records';

import EntryFormModal from './expenses/EntryFormModal';
import EntryRow from './expenses/EntryRow';
import {
    decodeExpense,
    expenseCollection,
    expenseSortKey,
    formatAmount,
    monthKeyOf,
    monthSum,
    monthTotals,
    t,
    todayKey,
} from './expenses/expenses';

import type { DashboardWidgetMeta, DashboardWidgetProps } from './types';
import type { StoredWidgetValues } from '#/components/Widgets/types';

export const widgetMeta = {
    type: 'expenses',
    label: () => t('label'),
    description: () => t('description'),
    defaultSize: { w: 4, h: 7, minW: 2, minH: 4 },
    fields: [
        {
            kind: 'text',
            name: 'currency',
            label: () => t('currency'),
            description: () => t('currency_hint'),
            defaultValue: 'EUR',
            maxLength: 3,
        },
        {
            kind: 'number',
            name: 'monthsShown',
            label: () => t('months_shown'),
            min: 3,
            max: 12,
            step: 1,
            defaultValue: 6,
        },
        {
            kind: 'switch',
            name: 'showChart',
            label: () => t('show_chart'),
            defaultValue: true,
        },
    ],
} satisfies DashboardWidgetMeta;

export default function ExpensesWidget({ id, config }: DashboardWidgetProps) {
    const store = useWidgetRecords(id, expenseCollection, 'sortKey');
    const now = useNow(60_000);
    const [adding, setAdding] = useState(false);
    const [editing, setEditing] = useState<string | null>(null);

    const currency = valueText(config, 'currency') || 'EUR';
    const months = Math.min(
        12,
        Math.max(3, valueNumber(config, 'monthsShown', 6))
    );
    const showChart = config.showChart !== false;

    const expenses = store.records.map(decodeExpense);
    const recent = expenses.slice().reverse();
    const editingEntry = expenses.find((entry) => entry.id === editing) ?? null;

    async function handleCreate(values: StoredWidgetValues) {
        await store.create({ data: values, sortKey: expenseSortKey(values) });

        setAdding(false);
    }

    async function handleEdit(values: StoredWidgetValues) {
        if (!editingEntry) return;

        await store.update({
            id: editingEntry.id,
            data: values,
            sortKey: expenseSortKey(values),
        });

        setEditing(null);
    }

    if (store.isLoading || now === null) {
        return (
            <Group justify="center" py="sm">
                <Loader size="xs" />
            </Group>
        );
    }

    const thisMonth = monthKeyOf(todayKey(now));
    const total = monthSum(expenses, thisMonth);

    return (
        <Stack gap="xs">
            <Group justify="space-between" align="flex-start" wrap="nowrap">
                <div>
                    <Text size="xs" c="dimmed">
                        {t('this_month')}
                    </Text>
                    <Text size="xl" fw={700} lh={1.1}>
                        {formatAmount(total, currency)}
                    </Text>
                </div>

                <Button
                    size="compact-xs"
                    variant="light"
                    leftSection={<PlusIcon size={12} />}
                    onClick={() => setAdding(true)}
                >
                    {t('add_entry')}
                </Button>
            </Group>

            {showChart ? (
                <MiniBars
                    data={monthTotals(expenses, now, months)}
                    emphasizeLast
                    formatValue={(value) => formatAmount(value, currency)}
                    emptyLabel={t('empty')}
                />
            ) : null}

            {recent.length === 0 ? (
                <Text size="sm" c="dimmed">
                    {t('empty')}
                </Text>
            ) : (
                <>
                    <Divider />

                    {recent.map((entry) => (
                        <EntryRow
                            key={entry.id}
                            entry={entry}
                            currency={currency}
                            onEdit={() => setEditing(entry.id)}
                            onDelete={() => void store.remove(entry.id)}
                        />
                    ))}
                </>
            )}

            {adding ? (
                <EntryFormModal
                    opened
                    entry={null}
                    onClose={() => setAdding(false)}
                    onSubmit={handleCreate}
                />
            ) : null}

            {editingEntry !== null ? (
                <EntryFormModal
                    opened
                    entry={editingEntry}
                    onClose={() => setEditing(null)}
                    onSubmit={handleEdit}
                />
            ) : null}
        </Stack>
    );
}

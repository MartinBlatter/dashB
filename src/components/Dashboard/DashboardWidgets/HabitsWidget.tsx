import { useState } from 'react';
import { Button, Group, Loader, Stack, Text } from '@mantine/core';
import { PlusIcon } from '@phosphor-icons/react';

import { useNow } from '#/components/Widgets/useNow';
import { valueNumber } from '#/components/Widgets/values';
import { useWidgetRecords } from '#/lib/widget-records';

import HabitFormModal from './habits/HabitFormModal';
import HabitRow from './habits/HabitRow';
import {
    currentStreak,
    dayKey,
    decodeHabit,
    decodeMonth,
    doneByHabit,
    encodeMonth,
    habitCollection,
    longestStreak,
    monthCollection,
    monthOf,
    monthRecordsFor,
    monthSortKey,
    recentDays,
    t,
    weekDoneCount,
} from './habits/habits';

import type { DashboardWidgetMeta, DashboardWidgetProps } from './types';
import type { Habit } from './habits/habits';
import type { StoredWidgetValues } from '#/components/Widgets/types';

export const widgetMeta = {
    type: 'habits',
    label: () => t('label'),
    description: () => t('description'),
    defaultSize: { w: 4, h: 6, minW: 2, minH: 4 },
    fields: [
        {
            kind: 'number',
            name: 'stripDays',
            label: () => t('strip_days'),
            description: () => t('strip_days_hint'),
            min: 7,
            max: 28,
            step: 7,
            defaultValue: 14,
        },
        {
            kind: 'switch',
            name: 'showStreaks',
            label: () => t('show_streaks'),
            defaultValue: true,
        },
    ],
} satisfies DashboardWidgetMeta;

export default function HabitsWidget({ id, config }: DashboardWidgetProps) {
    const habitStore = useWidgetRecords(id, habitCollection);
    const monthStore = useWidgetRecords(id, monthCollection, 'sortKey');
    const now = useNow(60_000);

    const [adding, setAdding] = useState(false);
    const [editing, setEditing] = useState<string | null>(null);
    const [busy, setBusy] = useState<string | null>(null);

    const stripDays = Math.min(
        28,
        Math.max(7, valueNumber(config, 'stripDays', 14))
    );
    const showStreaks = config.showStreaks !== false;

    const habits = habitStore.records.map(decodeHabit);
    const months = monthStore.records.map(decodeMonth);
    const doneMap = doneByHabit(months);

    const editingHabit = habits.find((habit) => habit.id === editing) ?? null;

    async function handleCreate(values: StoredWidgetValues) {
        await habitStore.create({ data: values });

        setAdding(false);
    }

    async function handleEdit(values: StoredWidgetValues) {
        if (!editingHabit) return;

        await habitStore.update({ id: editingHabit.id, data: values });

        setEditing(null);
    }

    async function handleDelete(habit: Habit) {
        const owned = months.filter((entry) => entry.habitId === habit.id);

        await Promise.all(owned.map((entry) => monthStore.remove(entry.id)));
        await habitStore.remove(habit.id);
    }

    async function handleToggle(habit: Habit, today: string) {
        if (busy !== null) return;

        const month = monthOf(today);
        const existing = monthRecordsFor(months, habit.id, month);
        const primary = existing.at(0);
        const extras = existing.slice(1);

        const days = new Set(primary ? primary.days : []);

        for (const extra of extras) {
            for (const day of extra.days) days.add(day);
        }

        if (days.has(today)) days.delete(today);
        else days.add(today);

        const data = encodeMonth(habit.id, month, days);
        const sortKey = monthSortKey(month, habit.id);

        setBusy(habit.id);

        try {
            if (primary) {
                await monthStore.update({ id: primary.id, data, sortKey });

                await Promise.all(
                    extras.map((extra) => monthStore.remove(extra.id))
                );
            } else {
                await monthStore.create({ data, sortKey });
            }
        } finally {
            setBusy(null);
        }
    }

    if (habitStore.isLoading || monthStore.isLoading || now === null) {
        return (
            <Group justify="center" py="sm">
                <Loader size="xs" />
            </Group>
        );
    }

    const today = dayKey(now);
    const days = recentDays(now, stripDays);

    return (
        <Stack gap="sm">
            <Group justify="flex-end">
                <Button
                    size="compact-xs"
                    variant="light"
                    leftSection={<PlusIcon size={12} />}
                    onClick={() => setAdding(true)}
                >
                    {t('add_habit')}
                </Button>
            </Group>

            {habits.length === 0 ? (
                <Text size="sm" c="dimmed">
                    {t('empty')}
                </Text>
            ) : (
                habits.map((habit) => {
                    const done = doneMap.get(habit.id) ?? new Set<string>();

                    return (
                        <HabitRow
                            key={habit.id}
                            habit={habit}
                            days={days}
                            done={done}
                            today={today}
                            streak={currentStreak(done, today)}
                            best={longestStreak(done)}
                            weekCount={weekDoneCount(done, now)}
                            showStreaks={showStreaks}
                            busy={busy === habit.id}
                            onToggle={() => void handleToggle(habit, today)}
                            onEdit={() => setEditing(habit.id)}
                            onDelete={() => void handleDelete(habit)}
                        />
                    );
                })
            )}

            {adding ? (
                <HabitFormModal
                    opened
                    habit={null}
                    onClose={() => setAdding(false)}
                    onSubmit={handleCreate}
                />
            ) : null}

            {editingHabit !== null ? (
                <HabitFormModal
                    opened
                    habit={editingHabit}
                    onClose={() => setEditing(null)}
                    onSubmit={handleEdit}
                />
            ) : null}
        </Stack>
    );
}

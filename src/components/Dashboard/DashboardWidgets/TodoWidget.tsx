import { useState } from 'react';
import dayjs from 'dayjs';
import { Button, Divider, Group, Loader, Stack, Text } from '@mantine/core';
import { PlusIcon } from '@phosphor-icons/react';

import { useNow } from '#/components/Widgets/useNow';

import TaskFormModal from './todo/TaskFormModal';
import TaskRow from './todo/TaskRow';
import {
    completeOnce,
    decodeTask,
    sectionLabel,
    sectionOf,
    t,
    taskCollection,
    taskSections,
    taskSortKey,
    undoOnce,
} from './todo/tasks';
import { useWidgetRecords } from '#/lib/widget-records';

import type { DashboardWidgetMeta, DashboardWidgetProps } from './types';
import type { Task, TaskSection } from './todo/tasks';
import type { StoredWidgetValues } from '#/components/Widgets/types';

export const widgetMeta = {
    type: 'todo',
    label: () => t('label'),
    description: () => t('description'),
    defaultSize: { w: 4, h: 7, minW: 3, minH: 4 },
    fields: [
        {
            kind: 'switch',
            name: 'showDone',
            label: () => t('show_done'),
            defaultValue: true,
        },
    ],
} satisfies DashboardWidgetMeta;

export default function TodoWidget({ id, config }: DashboardWidgetProps) {
    const store = useWidgetRecords(id, taskCollection, 'sortKey');
    const now = useNow(30_000);
    const [adding, setAdding] = useState(false);
    const [editing, setEditing] = useState<string | null>(null);

    const showDone = config.showDone !== false;

    const tasks = store.records
        .map(decodeTask)
        .sort(
            (a, b) =>
                a.dueAt.valueOf() - b.dueAt.valueOf() ||
                a.title.localeCompare(b.title)
        );

    const grouped = new Map<TaskSection, Array<Task>>();

    if (now) {
        const moment = dayjs(now);

        for (const task of tasks) {
            const section = sectionOf(task, moment);

            if (section === 'done' && !showDone) continue;

            const bucket = grouped.get(section);

            if (bucket) bucket.push(task);
            else grouped.set(section, [task]);
        }
    }

    const editingTask = tasks.find((task) => task.id === editing) ?? null;

    async function handleCreate(values: StoredWidgetValues) {
        await store.create({
            data: { ...values, timesDone: 0, doneAt: null },
            sortKey: taskSortKey(values),
        });

        setAdding(false);
    }

    async function handleEdit(task: Task, values: StoredWidgetValues) {
        await store.update({
            id: task.id,
            data: { ...values, timesDone: task.timesDone, doneAt: task.doneAt },
            sortKey: taskSortKey(values),
        });

        setEditing(null);
    }

    async function handleComplete(task: Task) {
        const data = completeOnce(task, dayjs(now ?? undefined));

        await store.update({ id: task.id, data, sortKey: taskSortKey(data) });
    }

    async function handleUndo(task: Task) {
        const data = undoOnce(task);

        await store.update({ id: task.id, data, sortKey: taskSortKey(data) });
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
                    {t('add_task')}
                </Button>
            </Group>

            {store.isLoading || !now ? (
                <Group justify="center" py="sm">
                    <Loader size="xs" />
                </Group>
            ) : grouped.size === 0 ? (
                <Text size="sm" c="dimmed">
                    {t('empty')}
                </Text>
            ) : (
                taskSections
                    .filter((section) => grouped.has(section))
                    .map((section) => (
                        <Stack key={section} gap={4}>
                            <Divider
                                label={
                                    <Text
                                        size="xs"
                                        fw={600}
                                        c={
                                            section === 'overdue'
                                                ? 'red'
                                                : 'dimmed'
                                        }
                                    >
                                        {sectionLabel(section)}
                                    </Text>
                                }
                                labelPosition="left"
                                color={
                                    section === 'overdue' ? 'red' : undefined
                                }
                            />

                            {(grouped.get(section) ?? []).map((task) => (
                                <TaskRow
                                    key={task.id}
                                    task={task}
                                    overdue={section === 'overdue'}
                                    onComplete={() => void handleComplete(task)}
                                    onUndo={() => void handleUndo(task)}
                                    onEdit={() => setEditing(task.id)}
                                    onDelete={() => void store.remove(task.id)}
                                />
                            ))}
                        </Stack>
                    ))
            )}

            <TaskFormModal
                opened={adding}
                task={null}
                onClose={() => setAdding(false)}
                onSubmit={handleCreate}
            />

            <TaskFormModal
                opened={editingTask !== null}
                task={editingTask}
                onClose={() => setEditing(null)}
                onSubmit={(values) =>
                    editingTask
                        ? handleEdit(editingTask, values)
                        : Promise.resolve()
                }
            />
        </Stack>
    );
}

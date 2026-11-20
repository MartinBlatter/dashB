import { ActionIcon, Badge, Box, Group, Menu, Text } from '@mantine/core';
import {
    ArrowCounterClockwiseIcon,
    ArrowsClockwiseIcon,
    CheckCircleIcon,
    CheckIcon,
    DotsThreeVerticalIcon,
    PencilSimpleIcon,
    TrashIcon,
} from '@phosphor-icons/react';

import { brandColor } from '#/lib/theme';

import { dueLabel, repeatLabel, t } from './tasks';

import type { Task } from './tasks';

export default function TaskRow({
    task,
    overdue,
    onComplete,
    onUndo,
    onEdit,
    onDelete,
}: {
    task: Task;
    overdue: boolean;
    onComplete: () => void;
    onUndo: () => void;
    onEdit: () => void;
    onDelete: () => void;
}) {
    const done = task.doneAt !== null;
    const repeat = repeatLabel(task.repeat);
    const canUndo = done || task.timesDone > 0;

    return (
        <Group
            gap="xs"
            wrap="nowrap"
            align="flex-start"
            pl={6}
            style={{
                borderLeft: overdue
                    ? '2px solid var(--mantine-color-red-6)'
                    : '2px solid transparent',
            }}
        >
            <ActionIcon
                variant={done ? 'light' : 'default'}
                color={done ? 'green' : overdue ? 'red' : 'gray'}
                size="sm"
                mt={2}
                aria-label={`${done ? t('undo') : t('mark_done')}: ${task.title}`}
                onClick={done ? onUndo : onComplete}
            >
                {done ? <CheckCircleIcon size={14} /> : <CheckIcon size={12} />}
            </ActionIcon>

            <Box style={{ flex: 1, minWidth: 0 }}>
                <Text
                    size="sm"
                    c={done ? 'dimmed' : overdue ? 'red' : undefined}
                    fw={overdue ? 500 : 400}
                    td={done ? 'line-through' : undefined}
                    style={{ wordBreak: 'break-word' }}
                >
                    {task.title}
                </Text>

                <Group gap={6} wrap="wrap" mt={2}>
                    <Text size="xs" c={overdue ? 'red' : 'dimmed'}>
                        {dueLabel(task)}
                    </Text>

                    {task.timesRequired > 1 ? (
                        <Badge size="xs" variant="light" color={brandColor}>
                            {task.timesDone}/{task.timesRequired}
                        </Badge>
                    ) : null}

                    {repeat ? (
                        <Badge
                            size="xs"
                            variant="light"
                            color="gray"
                            leftSection={<ArrowsClockwiseIcon size={10} />}
                        >
                            {repeat}
                        </Badge>
                    ) : null}
                </Group>
            </Box>

            <Menu position="bottom-end" withinPortal>
                <Menu.Target>
                    <ActionIcon
                        variant="subtle"
                        color="gray"
                        size="sm"
                        aria-label={`${t('options')}: ${task.title}`}
                    >
                        <DotsThreeVerticalIcon size={14} />
                    </ActionIcon>
                </Menu.Target>

                <Menu.Dropdown>
                    {canUndo ? (
                        <Menu.Item
                            leftSection={
                                <ArrowCounterClockwiseIcon size={14} />
                            }
                            onClick={onUndo}
                        >
                            {t('undo')}
                        </Menu.Item>
                    ) : null}
                    <Menu.Item
                        leftSection={<PencilSimpleIcon size={14} />}
                        onClick={onEdit}
                    >
                        {t('edit_task')}
                    </Menu.Item>
                    <Menu.Item
                        color="red"
                        leftSection={<TrashIcon size={14} />}
                        onClick={onDelete}
                    >
                        {t('delete_task')}
                    </Menu.Item>
                </Menu.Dropdown>
            </Menu>
        </Group>
    );
}

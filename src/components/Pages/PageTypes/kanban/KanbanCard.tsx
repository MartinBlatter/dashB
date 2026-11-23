import { ActionIcon, Card, Group, Menu, Stack, Text } from '@mantine/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    CalendarBlankIcon,
    DotsThreeVerticalIcon,
    PencilSimpleIcon,
    TrashIcon,
} from '@phosphor-icons/react';

import { useDateFormat } from '#/lib/user-settings';

import { dueText, isOverdue } from './format';
import { t } from './i18n';
import { cardTitle } from './kanban';

import classes from './kanban.module.css';

import type { KanbanCard as KanbanCardData } from './kanban';
import type { ReactElement } from 'react';

export default function KanbanCard({
    card,
    today,
    showNotes,
    dragEnabled,
    onEdit,
    onDelete,
}: {
    card: KanbanCardData;
    today: string | null;
    showNotes: boolean;
    dragEnabled: boolean;
    onEdit: () => void;
    onDelete: () => void;
}): ReactElement {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: card.id, disabled: !dragEnabled });

    const dateFormat = useDateFormat();
    const overdue = isOverdue(card.due, today);

    return (
        <Card
            ref={setNodeRef}
            withBorder
            radius="sm"
            padding="xs"
            className={`${classes.card} ${isDragging ? classes.cardDragging : ''}`}
            style={{
                transform: CSS.Transform.toString(transform),
                transition,
                opacity: isDragging ? 0.5 : undefined,
                borderLeftColor: `var(--mantine-color-${card.color}-6)`,
            }}
            {...attributes}
            {...listeners}
        >
            <Stack gap={6}>
                <Group gap={4} wrap="nowrap" align="flex-start">
                    <Text size="sm" fw={500} style={{ flex: 1, minWidth: 0 }}>
                        {cardTitle(card)}
                    </Text>

                    <Menu position="bottom-end" withinPortal>
                        <Menu.Target>
                            <ActionIcon
                                variant="subtle"
                                color="gray"
                                size="sm"
                                aria-label={t('card_actions')}
                                onPointerDown={(event) =>
                                    event.stopPropagation()
                                }
                            >
                                <DotsThreeVerticalIcon size={14} />
                            </ActionIcon>
                        </Menu.Target>

                        <Menu.Dropdown>
                            <Menu.Item
                                leftSection={<PencilSimpleIcon size={14} />}
                                onClick={onEdit}
                            >
                                {t('edit_card')}
                            </Menu.Item>

                            <Menu.Item
                                color="red"
                                leftSection={<TrashIcon size={14} />}
                                onClick={onDelete}
                            >
                                {t('delete_card')}
                            </Menu.Item>
                        </Menu.Dropdown>
                    </Menu>
                </Group>

                {showNotes && card.notes !== '' ? (
                    <Text
                        size="xs"
                        c="dimmed"
                        lineClamp={3}
                        className={classes.notes}
                    >
                        {card.notes}
                    </Text>
                ) : null}

                {card.due !== '' ? (
                    <Group gap={4} wrap="nowrap">
                        <CalendarBlankIcon size={12} aria-hidden />
                        <Text size="xs" c={overdue ? 'red' : 'dimmed'}>
                            {t('due_label').replace(
                                '{date}',
                                dueText(card.due, dateFormat)
                            )}
                        </Text>
                    </Group>
                ) : null}
            </Stack>
        </Card>
    );
}

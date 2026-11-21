import { ActionIcon, Badge, Box, Menu, Text } from '@mantine/core';
import { useDroppable } from '@dnd-kit/core';
import {
    SortableContext,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
    ArrowLeftIcon,
    ArrowRightIcon,
    DotsThreeVerticalIcon,
    PencilSimpleIcon,
    PlusIcon,
    TrashIcon,
} from '@phosphor-icons/react';

import KanbanCard from './KanbanCard';
import { t } from './i18n';
import { laneTitle } from './kanban';

import classes from './kanban.module.css';

import type {
    KanbanCard as KanbanCardData,
    KanbanLane as KanbanLaneData,
} from './kanban';
import type { ReactElement } from 'react';

export default function KanbanLane({
    lane,
    cards,
    today,
    showCounts,
    showNotes,
    dragEnabled,
    canMoveLeft,
    canMoveRight,
    onAddCard,
    onEditLane,
    onDeleteLane,
    onMoveLane,
    onEditCard,
    onDeleteCard,
}: {
    lane: KanbanLaneData;
    cards: ReadonlyArray<KanbanCardData>;
    today: string | null;
    showCounts: boolean;
    showNotes: boolean;
    dragEnabled: boolean;
    canMoveLeft: boolean;
    canMoveRight: boolean;
    onAddCard: () => void;
    onEditLane: () => void;
    onDeleteLane: () => void;
    onMoveLane: (offset: number) => void;
    onEditCard: (card: KanbanCardData) => void;
    onDeleteCard: (card: KanbanCardData) => void;
}): ReactElement {
    const { setNodeRef, isOver } = useDroppable({ id: lane.id });

    return (
        <Box
            className={`${classes.lane} ${isOver ? classes.laneOver : ''}`}
            data-lane-id={lane.id}
        >
            <Box className={classes.laneHeader}>
                <Box
                    className={classes.laneAccent}
                    style={{
                        backgroundColor: `var(--mantine-color-${lane.color}-6)`,
                    }}
                />

                <Text
                    size="sm"
                    fw={600}
                    style={{ flex: 1, minWidth: 0 }}
                    truncate
                >
                    {laneTitle(lane)}
                </Text>

                {showCounts ? (
                    <Badge variant="default" size="sm" radius="sm">
                        {cards.length}
                    </Badge>
                ) : null}

                <ActionIcon
                    variant="subtle"
                    color="gray"
                    size="sm"
                    aria-label={t('add_card')}
                    onClick={onAddCard}
                >
                    <PlusIcon size={14} />
                </ActionIcon>

                <Menu position="bottom-end" withinPortal>
                    <Menu.Target>
                        <ActionIcon
                            variant="subtle"
                            color="gray"
                            size="sm"
                            aria-label={t('lane_actions')}
                        >
                            <DotsThreeVerticalIcon size={14} />
                        </ActionIcon>
                    </Menu.Target>

                    <Menu.Dropdown>
                        <Menu.Item
                            leftSection={<PencilSimpleIcon size={14} />}
                            onClick={onEditLane}
                        >
                            {t('edit_lane')}
                        </Menu.Item>

                        <Menu.Item
                            leftSection={<ArrowLeftIcon size={14} />}
                            disabled={!canMoveLeft}
                            onClick={() => onMoveLane(-1)}
                        >
                            {t('move_left')}
                        </Menu.Item>

                        <Menu.Item
                            leftSection={<ArrowRightIcon size={14} />}
                            disabled={!canMoveRight}
                            onClick={() => onMoveLane(1)}
                        >
                            {t('move_right')}
                        </Menu.Item>

                        <Menu.Divider />

                        <Menu.Item
                            color="red"
                            leftSection={<TrashIcon size={14} />}
                            onClick={onDeleteLane}
                        >
                            {t('delete_lane')}
                        </Menu.Item>
                    </Menu.Dropdown>
                </Menu>
            </Box>

            <Box ref={setNodeRef} className={classes.laneBody}>
                <SortableContext
                    items={cards.map((card) => card.id)}
                    strategy={verticalListSortingStrategy}
                >
                    {cards.map((card) => (
                        <KanbanCard
                            key={card.id}
                            card={card}
                            today={today}
                            showNotes={showNotes}
                            dragEnabled={dragEnabled}
                            onEdit={() => onEditCard(card)}
                            onDelete={() => onDeleteCard(card)}
                        />
                    ))}
                </SortableContext>

                {cards.length === 0 ? (
                    <Text size="xs" c="dimmed" ta="center" py="sm">
                        {t('no_cards')}
                    </Text>
                ) : null}
            </Box>
        </Box>
    );
}

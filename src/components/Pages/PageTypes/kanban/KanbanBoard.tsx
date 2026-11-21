import {
    DndContext,
    KeyboardSensor,
    PointerSensor,
    closestCorners,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Box } from '@mantine/core';

import KanbanLane from './KanbanLane';

import classes from './kanban.module.css';

import type { DragEndEvent } from '@dnd-kit/core';
import type { KanbanCard, LaneGroup } from './kanban';
import type { ReactElement } from 'react';

export interface CardMove {
    cardId: string;
    laneId: string;
    laneChanged: boolean;
    orderedIds: Array<string>;
}

export default function KanbanBoard({
    groups,
    today,
    showCounts,
    showNotes,
    dragEnabled,
    onAddCard,
    onEditLane,
    onDeleteLane,
    onMoveLane,
    onEditCard,
    onDeleteCard,
    onCardMove,
}: {
    groups: ReadonlyArray<LaneGroup>;
    today: string | null;
    showCounts: boolean;
    showNotes: boolean;
    dragEnabled: boolean;
    onAddCard: (laneId: string) => void;
    onEditLane: (laneId: string) => void;
    onDeleteLane: (laneId: string) => void;
    onMoveLane: (laneId: string, offset: number) => void;
    onEditCard: (card: KanbanCard) => void;
    onDeleteCard: (card: KanbanCard) => void;
    onCardMove: (move: CardMove) => void;
}): ReactElement {
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const laneIds = new Set(groups.map((group) => group.lane.id));

    const laneByCard = new Map<string, string>();

    for (const group of groups) {
        for (const card of group.cards) {
            laneByCard.set(card.id, group.lane.id);
        }
    }

    function handleDragEnd({ active, over }: DragEndEvent) {
        if (!over) return;

        const cardId = String(active.id);
        const overId = String(over.id);

        const fromLane = laneByCard.get(cardId);
        const toLane = laneIds.has(overId) ? overId : laneByCard.get(overId);

        if (fromLane === undefined || toLane === undefined) return;

        const byLane = new Map(
            groups.map((group) => [
                group.lane.id,
                group.cards.map((card) => card.id),
            ])
        );

        if (fromLane === toLane) {
            const ids = byLane.get(fromLane) ?? [];
            const from = ids.indexOf(cardId);
            const to = laneIds.has(overId)
                ? ids.length - 1
                : ids.indexOf(overId);

            if (from === -1 || to === -1 || from === to) return;

            byLane.set(fromLane, arrayMove(ids, from, to));
        } else {
            byLane.set(
                fromLane,
                (byLane.get(fromLane) ?? []).filter((id) => id !== cardId)
            );

            const target = (byLane.get(toLane) ?? []).filter(
                (id) => id !== cardId
            );
            const overIndex = target.indexOf(overId);

            target.splice(
                overIndex === -1 ? target.length : overIndex,
                0,
                cardId
            );

            byLane.set(toLane, target);
        }

        onCardMove({
            cardId,
            laneId: toLane,
            laneChanged: fromLane !== toLane,
            orderedIds: groups.flatMap(
                (group) => byLane.get(group.lane.id) ?? []
            ),
        });
    }

    return (
        <DndContext
            id="kanban-cards"
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragEnd={handleDragEnd}
        >
            <Box className={classes.board}>
                {groups.map((group, index) => (
                    <KanbanLane
                        key={group.lane.id}
                        lane={group.lane}
                        cards={group.cards}
                        today={today}
                        showCounts={showCounts}
                        showNotes={showNotes}
                        dragEnabled={dragEnabled}
                        canMoveLeft={index > 0}
                        canMoveRight={index < groups.length - 1}
                        onAddCard={() => onAddCard(group.lane.id)}
                        onEditLane={() => onEditLane(group.lane.id)}
                        onDeleteLane={() => onDeleteLane(group.lane.id)}
                        onMoveLane={(offset) =>
                            onMoveLane(group.lane.id, offset)
                        }
                        onEditCard={onEditCard}
                        onDeleteCard={onDeleteCard}
                    />
                ))}
            </Box>
        </DndContext>
    );
}

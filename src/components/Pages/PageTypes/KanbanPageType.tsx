import { useState } from 'react';
import {
    Alert,
    Button,
    Group,
    Skeleton,
    Stack,
    Text,
    Tooltip,
} from '@mantine/core';
import { useMounted } from '@mantine/hooks';
import { arrayMove } from '@dnd-kit/sortable';
import { KanbanIcon, PlusIcon } from '@phosphor-icons/react';
import dayjs from 'dayjs';

import { useNow } from '#/components/Widgets/useNow';
import { PICKER_DATE_FORMAT } from '#/components/Widgets/values';
import { usePageRecords } from '#/lib/page-records';

import CardFormModal from './kanban/CardFormModal';
import DeleteModal from './kanban/DeleteModal';
import KanbanBoard from './kanban/KanbanBoard';
import { t } from './kanban/i18n';
import {
    cardCollection,
    cardTitle,
    decodeCard,
    decodeLane,
    encodeCard,
    groupCards,
    laneCollection,
    laneTitle,
    maxLanes,
} from './kanban/kanban';
import LaneFormModal from './kanban/LaneFormModal';

import type { CardMove } from './kanban/KanbanBoard';
import type { PageTypeMeta, PageTypeProps } from './types';
import type { ReactElement } from 'react';

export const widgetMeta = {
    type: 'kanban',
    label: () => t('label'),
    description: () => t('description'),
    icon: KanbanIcon,
    fields: [
        {
            kind: 'switch',
            name: 'showCounts',
            label: () => t('show_counts'),
            defaultValue: true,
        },
        {
            kind: 'switch',
            name: 'showNotes',
            label: () => t('show_notes'),
            defaultValue: true,
        },
    ],
} satisfies PageTypeMeta;

interface CardTarget {
    id: string | null;
    laneId: string;
}

interface DeleteTarget {
    kind: 'lane' | 'card';
    id: string;
}

export default function KanbanPageType({
    pageId,
    config,
}: PageTypeProps): ReactElement {
    const laneStore = usePageRecords(pageId, laneCollection);
    const cardStore = usePageRecords(pageId, cardCollection);
    const mounted = useMounted();
    const now = useNow(3_600_000);

    const [laneForm, setLaneForm] = useState<string | null | undefined>(
        undefined
    );
    const [cardForm, setCardForm] = useState<CardTarget | null>(null);
    const [deleting, setDeleting] = useState<DeleteTarget | null>(null);

    const lanes = laneStore.records.map(decodeLane);
    const cards = cardStore.records.map(decodeCard);
    const groups = groupCards(lanes, cards);

    const showCounts = config.showCounts !== false;
    const showNotes = config.showNotes !== false;
    const today = now ? dayjs(now).format(PICKER_DATE_FORMAT) : null;

    const editingLane = lanes.find((lane) => lane.id === laneForm) ?? null;
    const editingCard = cards.find((card) => card.id === cardForm?.id) ?? null;

    const deletingLane =
        deleting?.kind === 'lane'
            ? (lanes.find((lane) => lane.id === deleting.id) ?? null)
            : null;
    const deletingCard =
        deleting?.kind === 'card'
            ? (cards.find((card) => card.id === deleting.id) ?? null)
            : null;

    const deletingLaneCards = deletingLane
        ? (groups.find((group) => group.lane.id === deletingLane.id)?.cards ??
          [])
        : [];

    function handleLaneMove(laneId: string, offset: number) {
        const ids = lanes.map((lane) => lane.id);
        const index = ids.indexOf(laneId);
        const target = index + offset;

        if (index === -1 || target < 0 || target >= ids.length) return;

        void laneStore.reorder(arrayMove(ids, index, target));
    }

    async function handleCardMove(move: CardMove) {
        if (move.laneChanged) {
            const card = cards.find(
                (candidate) => candidate.id === move.cardId
            );

            if (!card) return;

            await cardStore.update({
                id: card.id,
                data: encodeCard({ ...card, laneId: move.laneId }),
            });
        }

        await cardStore.reorder(move.orderedIds);
    }

    async function handleDeleteLane() {
        if (!deletingLane) return;

        if (deletingLaneCards.length > 0) {
            await cardStore.removeMany(
                deletingLaneCards.map((card) => card.id)
            );
        }

        await laneStore.remove(deletingLane.id);
    }

    if (laneStore.isPending || cardStore.isPending) {
        return (
            <Group align="flex-start" gap="md" wrap="nowrap">
                {[0, 1, 2].map((key) => (
                    <Skeleton key={key} height={240} width={280} radius="md" />
                ))}
            </Group>
        );
    }

    return (
        <Stack gap="md">
            <Group justify="flex-end">
                <Tooltip label={t('no_lanes_hint')} disabled={lanes.length > 0}>
                    <Button
                        variant="default"
                        leftSection={<PlusIcon size={14} />}
                        disabled={lanes.length >= maxLanes}
                        onClick={() => setLaneForm(null)}
                    >
                        {t('add_lane')}
                    </Button>
                </Tooltip>
            </Group>

            {lanes.length === 0 ? (
                <Alert variant="light" title={t('no_lanes_title')}>
                    <Stack gap="sm" align="flex-start">
                        <Text size="sm">{t('no_lanes_hint')}</Text>

                        <Button
                            leftSection={<PlusIcon size={14} />}
                            onClick={() => setLaneForm(null)}
                        >
                            {t('add_lane')}
                        </Button>
                    </Stack>
                </Alert>
            ) : (
                <KanbanBoard
                    groups={groups}
                    today={today}
                    showCounts={showCounts}
                    showNotes={showNotes}
                    dragEnabled={mounted}
                    onAddCard={(laneId) => setCardForm({ id: null, laneId })}
                    onEditLane={(laneId) => setLaneForm(laneId)}
                    onDeleteLane={(laneId) =>
                        setDeleting({ kind: 'lane', id: laneId })
                    }
                    onMoveLane={handleLaneMove}
                    onEditCard={(card) =>
                        setCardForm({ id: card.id, laneId: card.laneId })
                    }
                    onDeleteCard={(card) =>
                        setDeleting({ kind: 'card', id: card.id })
                    }
                    onCardMove={(move) => void handleCardMove(move)}
                />
            )}

            <LaneFormModal
                opened={laneForm !== undefined}
                lane={editingLane}
                onClose={() => setLaneForm(undefined)}
                onSubmit={async (values) => {
                    if (editingLane) {
                        await laneStore.update({
                            id: editingLane.id,
                            data: values,
                        });

                        return;
                    }

                    await laneStore.create({ data: values });
                }}
            />

            <CardFormModal
                opened={cardForm !== null}
                card={editingCard}
                onClose={() => setCardForm(null)}
                onSubmit={async (values) => {
                    if (editingCard) {
                        await cardStore.update({
                            id: editingCard.id,
                            data: { ...values, laneId: editingCard.laneId },
                        });

                        return;
                    }

                    if (!cardForm) return;

                    await cardStore.create({
                        data: { ...values, laneId: cardForm.laneId },
                    });
                }}
            />

            <DeleteModal
                opened={deletingLane !== null}
                title={t('delete_lane')}
                prompt={
                    deletingLaneCards.length > 0
                        ? t('delete_lane_prompt')
                        : t('delete_lane_empty_prompt')
                }
                detail={deletingLane ? laneTitle(deletingLane) : undefined}
                onConfirm={handleDeleteLane}
                onClose={() => setDeleting(null)}
            />

            <DeleteModal
                opened={deletingCard !== null}
                title={t('delete_card')}
                prompt={t('delete_card_prompt')}
                detail={deletingCard ? cardTitle(deletingCard) : undefined}
                onConfirm={async () => {
                    if (!deletingCard) return;

                    await cardStore.remove(deletingCard.id);
                }}
                onClose={() => setDeleting(null)}
            />
        </Stack>
    );
}

import { t } from './i18n';

import type {
    StoredWidgetValues,
    WidgetField,
} from '#/components/Widgets/types';
import type { PageRecord } from '#/lib/page-records';

export const laneCollection = 'kanban-lane';

export const cardCollection = 'kanban-card';

export const maxLanes = 12;

export const maxCardTitleLength = 200;

export const maxCardNotesLength = 2000;

export interface KanbanLane {
    id: string;
    title: string;
    color: string;
    position: number;
}

export interface KanbanCard {
    id: string;
    laneId: string;
    title: string;
    notes: string;
    due: string;
    color: string;
    position: number;
}

export interface LaneGroup {
    lane: KanbanLane;
    cards: Array<KanbanCard>;
}

type ColourKey =
    | 'colour_blue'
    | 'colour_teal'
    | 'colour_green'
    | 'colour_yellow'
    | 'colour_orange'
    | 'colour_red'
    | 'colour_violet'
    | 'colour_gray';

const colors: ReadonlyArray<{ value: string; key: ColourKey }> = [
    { value: 'blue', key: 'colour_blue' },
    { value: 'teal', key: 'colour_teal' },
    { value: 'green', key: 'colour_green' },
    { value: 'yellow', key: 'colour_yellow' },
    { value: 'orange', key: 'colour_orange' },
    { value: 'red', key: 'colour_red' },
    { value: 'violet', key: 'colour_violet' },
    { value: 'gray', key: 'colour_gray' },
];

const fallbackColor = 'blue';

export function colorOptions(): Array<{ value: string; label: string }> {
    return colors.map((entry) => ({ value: entry.value, label: t(entry.key) }));
}

function storedText(data: StoredWidgetValues, key: string): string {
    const raw = data[key];

    return typeof raw === 'string' ? raw : '';
}

function storedColor(data: StoredWidgetValues): string {
    const value = storedText(data, 'color');

    return colors.some((entry) => entry.value === value)
        ? value
        : fallbackColor;
}

export function decodeLane(record: PageRecord): KanbanLane {
    return {
        id: record.id,
        title: storedText(record.data, 'title'),
        color: storedColor(record.data),
        position: record.position,
    };
}

export function decodeCard(record: PageRecord): KanbanCard {
    return {
        id: record.id,
        laneId: storedText(record.data, 'laneId'),
        title: storedText(record.data, 'title'),
        notes: storedText(record.data, 'notes'),
        due: storedText(record.data, 'due'),
        color: storedColor(record.data),
        position: record.position,
    };
}

export function encodeCard(card: {
    laneId: string;
    title: string;
    notes: string;
    due: string;
    color: string;
}): StoredWidgetValues {
    return {
        laneId: card.laneId,
        title: card.title,
        notes: card.notes,
        due: card.due === '' ? null : card.due,
        color: card.color,
    };
}

export function laneTitle(lane: KanbanLane): string {
    return lane.title === '' ? t('untitled_lane') : lane.title;
}

export function cardTitle(card: KanbanCard): string {
    return card.title === '' ? t('untitled_card') : card.title;
}

export function laneFields(): Array<WidgetField> {
    return [
        {
            kind: 'text',
            name: 'title',
            label: () => t('lane_title'),
            defaultValue: '',
            required: true,
            maxLength: 120,
        },
        {
            kind: 'select',
            name: 'color',
            label: () => t('card_color'),
            defaultValue: fallbackColor,
            options: colorOptions,
        },
    ];
}

export function cardFields(): Array<WidgetField> {
    return [
        {
            kind: 'text',
            name: 'title',
            label: () => t('card_title'),
            defaultValue: '',
            required: true,
            maxLength: maxCardTitleLength,
        },
        {
            kind: 'textarea',
            name: 'notes',
            label: () => t('card_notes'),
            defaultValue: '',
            rows: 4,
            maxLength: maxCardNotesLength,
        },
        {
            kind: 'date',
            name: 'due',
            label: () => t('card_due'),
            defaultValue: '',
        },
        {
            kind: 'select',
            name: 'color',
            label: () => t('card_color'),
            defaultValue: fallbackColor,
            options: colorOptions,
        },
    ];
}

export function groupCards(
    lanes: ReadonlyArray<KanbanLane>,
    cards: ReadonlyArray<KanbanCard>
): Array<LaneGroup> {
    const groups = lanes.map((lane) => ({
        lane,
        cards: [] as Array<KanbanCard>,
    }));
    const byId = new Map(groups.map((group) => [group.lane.id, group]));
    const fallback = groups.at(0);

    for (const card of cards) {
        const group = byId.get(card.laneId) ?? fallback;

        if (group) group.cards.push(card);
    }

    return groups;
}

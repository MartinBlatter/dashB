import { Text } from '@mantine/core';

import { createWidgetMessages } from '#/components/Widgets/i18n';
import { useNow } from '#/components/Widgets/useNow';
import { valueDate } from '#/components/Widgets/values';

import { formatDuration } from './duration';

import type { HeaderWidgetMeta, HeaderWidgetProps } from './types';

const t = createWidgetMessages({
    en: {
        label: 'Countup',
        description: 'Counts up from a date',
        since: 'Start date',
        sinceHint: 'The moment the counter started',
        showSeconds: 'Show seconds',
        daySuffix: 'd',
        pending: 'Not started yet',
    },
    de: {
        label: 'Countup',
        description: 'Zählt ab einem Datum hoch',
        since: 'Startdatum',
        sinceHint: 'Der Zeitpunkt, an dem der Zähler gestartet ist',
        showSeconds: 'Sekunden anzeigen',
        daySuffix: 'T',
        pending: 'Noch nicht gestartet',
    },
});

export const widgetMeta = {
    type: 'countup',
    label: () => t('label'),
    description: () => t('description'),
    fields: [
        {
            kind: 'datetime',
            name: 'since',
            label: () => t('since'),
            description: () => t('sinceHint'),
            required: true,
        },
        {
            kind: 'switch',
            name: 'showSeconds',
            label: () => t('showSeconds'),
            defaultValue: false,
        },
    ],
} satisfies HeaderWidgetMeta;

export default function CountupWidget({ label, config }: HeaderWidgetProps) {
    const now = useNow();
    const since = valueDate(config, 'since');

    const elapsed = now && since ? now.getTime() - since.getTime() : undefined;

    const value =
        elapsed === undefined
            ? '—'
            : elapsed < 0
              ? t('pending')
              : formatDuration(elapsed, {
                    withSeconds: config.showSeconds === true,
                    daySuffix: t('daySuffix'),
                });

    return (
        <div>
            <Text size="sm" fw={500}>
                {label}
            </Text>
            <Text size="xs" c="dimmed">
                {value}
            </Text>
        </div>
    );
}

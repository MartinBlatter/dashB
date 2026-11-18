import { Text } from '@mantine/core';

import { createWidgetMessages } from '#/components/Widgets/i18n';
import { useNow } from '#/components/Widgets/useNow';
import { valueDate } from '#/components/Widgets/values';

import { formatDuration } from './duration';

import type { HeaderWidgetMeta, HeaderWidgetProps } from './types';

const t = createWidgetMessages({
    en: {
        label: 'Countdown',
        description: 'Counts down to a date',
        target: 'Target date',
        targetHint: 'The moment the countdown runs out',
        showSeconds: 'Show seconds',
        daySuffix: 'd',
        done: 'Time is up',
    },
    de: {
        label: 'Countdown',
        description: 'Zählt auf ein Datum herunter',
        target: 'Zieldatum',
        targetHint: 'Der Zeitpunkt, an dem der Countdown abläuft',
        showSeconds: 'Sekunden anzeigen',
        daySuffix: 'T',
        done: 'Zeit ist um',
    },
});

export const widgetMeta = {
    type: 'countdown',
    label: () => t('label'),
    description: () => t('description'),
    fields: [
        {
            kind: 'datetime',
            name: 'target',
            label: () => t('target'),
            description: () => t('targetHint'),
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

export default function CountdownWidget({ label, config }: HeaderWidgetProps) {
    const now = useNow();
    const target = valueDate(config, 'target');

    const remaining =
        now && target ? target.getTime() - now.getTime() : undefined;

    const value =
        remaining === undefined
            ? '—'
            : remaining <= 0
              ? t('done')
              : formatDuration(remaining, {
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

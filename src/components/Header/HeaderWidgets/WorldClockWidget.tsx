import { Text } from '@mantine/core';

import { createWidgetMessages } from '#/components/Widgets/i18n';
import { useNow } from '#/components/Widgets/useNow';
import { formatDate } from '#/lib/date-format';
import { useDateFormat } from '#/lib/user-settings';

import { commonTimeZones, isSupportedTimeZone, timeZoneLabel } from './zones';

import type { HeaderWidgetMeta, HeaderWidgetProps } from './types';

const t = createWidgetMessages({
    en: {
        label: 'World clock',
        description: 'Current time in another timezone',
        zone: 'Timezone',
        showSeconds: 'Show seconds',
        showDate: 'Show the date',
    },
    de: {
        label: 'Weltzeit',
        description: 'Aktuelle Uhrzeit in einer anderen Zeitzone',
        zone: 'Zeitzone',
        showSeconds: 'Sekunden anzeigen',
        showDate: 'Datum anzeigen',
    },
});

export const widgetMeta = {
    type: 'worldclock',
    label: () => t('label'),
    description: () => t('description'),
    fields: [
        {
            kind: 'select',
            name: 'zone',
            label: () => t('zone'),
            defaultValue: 'UTC',
            options: () =>
                commonTimeZones.map((zone) => ({
                    value: zone,
                    label: timeZoneLabel(zone),
                })),
        },
        {
            kind: 'switch',
            name: 'showSeconds',
            label: () => t('showSeconds'),
            defaultValue: false,
        },
        {
            kind: 'switch',
            name: 'showDate',
            label: () => t('showDate'),
            defaultValue: false,
        },
    ],
} satisfies HeaderWidgetMeta;

export default function WorldClockWidget({ label, config }: HeaderWidgetProps) {
    const now = useNow();
    const dateFormat = useDateFormat();

    const requested = typeof config.zone === 'string' ? config.zone : 'UTC';
    const zone = isSupportedTimeZone(requested) ? requested : 'UTC';

    return (
        <div>
            <Text size="sm" fw={500}>
                {label}
            </Text>
            <Text size="xs" c="dimmed">
                {now === null
                    ? '—'
                    : now.toLocaleTimeString(undefined, {
                          timeZone: zone,
                          hour: '2-digit',
                          minute: '2-digit',
                          second:
                              config.showSeconds === true
                                  ? '2-digit'
                                  : undefined,
                      })}
            </Text>
            {config.showDate === true ? (
                <Text size="xs" c="dimmed">
                    {now === null
                        ? '—'
                        : formatDate(now, dateFormat, {
                              timeZone: zone,
                              monthName: true,
                              year: false,
                          })}
                </Text>
            ) : null}
        </div>
    );
}

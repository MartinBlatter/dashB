import { Text } from '@mantine/core';

import { createWidgetMessages } from '#/components/Widgets/i18n';
import { useNow } from '#/components/Widgets/useNow';
import { formatDate } from '#/lib/date-format';
import { useDateFormat } from '#/lib/user-settings';

import type { HeaderWidgetMeta, HeaderWidgetProps } from './types';

const t = createWidgetMessages({
    en: {
        label: 'Date & time',
        description: 'Shows the current date and time',
        display: 'Show',
        displayDate: 'Date only',
        displayTime: 'Time only',
        displayBoth: 'Date and time',
    },
    de: {
        label: 'Datum & Uhrzeit',
        description: 'Zeigt das aktuelle Datum und die Uhrzeit',
        display: 'Anzeige',
        displayDate: 'Nur Datum',
        displayTime: 'Nur Uhrzeit',
        displayBoth: 'Datum und Uhrzeit',
    },
});

export const widgetMeta = {
    type: 'datetime',
    label: () => t('label'),
    description: () => t('description'),
    fields: [
        {
            kind: 'select',
            name: 'display',
            label: () => t('display'),
            defaultValue: 'both',
            options: () => [
                { value: 'both', label: t('displayBoth') },
                { value: 'date', label: t('displayDate') },
                { value: 'time', label: t('displayTime') },
            ],
        },
    ],
} satisfies HeaderWidgetMeta;

export default function DateTimeWidget({ config }: HeaderWidgetProps) {
    const now = useNow();
    const dateFormat = useDateFormat();
    const display = config.display;

    if (!now) return null;

    return (
        <div>
            {display !== 'time' ? (
                <Text size="sm">{formatDate(now, dateFormat)}</Text>
            ) : null}
            {display !== 'date' ? (
                <Text size="sm">{now.toLocaleTimeString()}</Text>
            ) : null}
        </div>
    );
}

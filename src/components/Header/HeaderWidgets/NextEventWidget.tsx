import { Text } from '@mantine/core';

import { createWidgetMessages } from '#/components/Widgets/i18n';
import { useNow } from '#/components/Widgets/useNow';
import { valueNumber, valueText } from '#/components/Widgets/values';
import { useNextEvent } from '#/lib/calendar-peek';

import { formatDuration } from './duration';

import type { HeaderWidgetMeta, HeaderWidgetProps } from './types';

const t = createWidgetMessages({
    en: {
        label: 'Next event',
        description: 'The next entry from a calendar feed',
        feedUrl: 'Calendar address',
        feedUrlHint: 'The webcal or https link to an .ics feed',
        lookaheadHours: 'Look ahead (hours)',
        nothing: 'Nothing scheduled',
        now: 'now',
        inPrefix: 'in',
        untitled: 'Untitled',
        days: 'd',
    },
    de: {
        label: 'Nächster Termin',
        description: 'Der nächste Eintrag aus einem Kalender-Feed',
        feedUrl: 'Kalenderadresse',
        feedUrlHint: 'Der webcal- oder https-Link zu einem .ics-Feed',
        lookaheadHours: 'Vorausschau (Stunden)',
        nothing: 'Nichts geplant',
        now: 'jetzt',
        inPrefix: 'in',
        untitled: 'Ohne Titel',
        days: 'T',
    },
});

export const widgetMeta = {
    type: 'nextevent',
    label: () => t('label'),
    description: () => t('description'),
    fields: [
        {
            kind: 'text',
            name: 'feedUrl',
            label: () => t('feedUrl'),
            description: () => t('feedUrlHint'),
            required: true,
            maxLength: 2000,
        },
        {
            kind: 'number',
            name: 'lookaheadHours',
            label: () => t('lookaheadHours'),
            min: 1,
            max: 72,
            step: 1,
            defaultValue: 12,
        },
    ],
} satisfies HeaderWidgetMeta;

export default function NextEventWidget({ label, config }: HeaderWidgetProps) {
    const now = useNow(30_000);

    const feedUrl = valueText(config, 'feedUrl');
    const lookahead = Math.min(
        72,
        Math.max(1, valueNumber(config, 'lookaheadHours', 12))
    );

    const { payload } = useNextEvent(feedUrl, lookahead);

    const found = payload?.status === 'found' ? payload.event : null;

    let detail = '—';

    if (payload?.status === 'none') {
        detail = t('nothing');
    } else if (found && now) {
        const startsIn = Date.parse(found.start) - now.getTime();
        const title = found.title.trim() === '' ? t('untitled') : found.title;

        detail =
            startsIn <= 0
                ? `${title} · ${t('now')}`
                : `${title} · ${t('inPrefix')} ${formatDuration(startsIn, {
                      withSeconds: false,
                      daySuffix: t('days'),
                  })}`;
    }

    return (
        <div>
            <Text size="sm" fw={500}>
                {label}
            </Text>
            <Text size="xs" c="dimmed" truncate maw={180}>
                {detail}
            </Text>
        </div>
    );
}

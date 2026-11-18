import dayjs from 'dayjs';
import { Badge, Group, Modal, Stack, Text } from '@mantine/core';
import {
    CalendarBlankIcon,
    ClockIcon,
    MapPinIcon,
} from '@phosphor-icons/react';

import { getLocale } from '#/paraglide/runtime';

import { t } from './schedule';

import type { ScheduleEventData } from '@mantine/schedule';

export default function EventDetail({
    event,
    onClose,
}: {
    event: ScheduleEventData | null;
    onClose: () => void;
}) {
    const payload = event?.payload ?? {};
    const allDay = payload.allDay === true;
    const location =
        typeof payload.location === 'string' ? payload.location : '';
    const description =
        typeof payload.description === 'string' ? payload.description : '';
    const calendarName =
        typeof payload.calendarName === 'string' ? payload.calendarName : '';

    return (
        <Modal
            opened={event !== null}
            onClose={onClose}
            title={event?.title ?? ''}
        >
            {event ? (
                <Stack gap="xs">
                    {calendarName === '' ? null : (
                        <Group gap={6}>
                            <CalendarBlankIcon size={14} />
                            <Badge
                                size="sm"
                                variant="light"
                                color={event.color}
                            >
                                {calendarName}
                            </Badge>
                        </Group>
                    )}

                    <Group gap={6} wrap="nowrap" align="flex-start">
                        <ClockIcon size={14} />
                        <Text size="sm">{spanLabel(event, allDay)}</Text>
                    </Group>

                    {location === '' ? null : (
                        <Group gap={6} wrap="nowrap" align="flex-start">
                            <MapPinIcon size={14} />
                            <Text size="sm">{location}</Text>
                        </Group>
                    )}

                    {description === '' ? null : (
                        <Text
                            size="sm"
                            c="dimmed"
                            style={{ whiteSpace: 'pre-wrap' }}
                        >
                            {description}
                        </Text>
                    )}
                </Stack>
            ) : null}
        </Modal>
    );
}

function spanLabel(event: ScheduleEventData, allDay: boolean): string {
    const locale = getLocale();
    const start = dayjs(event.start);
    const end = dayjs(event.end);

    if (allDay) {
        const lastDay = end.subtract(1, 'day');
        const first = dateText(start.toDate(), locale);

        return lastDay.isAfter(start, 'day')
            ? `${first} – ${dateText(lastDay.toDate(), locale)}`
            : `${first} · ${t('all_day')}`;
    }

    const sameDay = start.isSame(end, 'day');

    return sameDay
        ? `${dateText(start.toDate(), locale)} · ${timeText(
              start.toDate(),
              locale
          )} – ${timeText(end.toDate(), locale)}`
        : `${dateText(start.toDate(), locale)} ${timeText(
              start.toDate(),
              locale
          )} – ${dateText(end.toDate(), locale)} ${timeText(
              end.toDate(),
              locale
          )}`;
}

function dateText(value: Date, locale: string): string {
    return value.toLocaleDateString(locale, {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

function timeText(value: Date, locale: string): string {
    return value.toLocaleTimeString(locale, {
        hour: '2-digit',
        minute: '2-digit',
    });
}

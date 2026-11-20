import {
    ActionIcon,
    Badge,
    Button,
    ColorSwatch,
    Group,
    Stack,
    Text,
    Tooltip,
} from '@mantine/core';
import {
    ArrowsClockwiseIcon,
    EyeIcon,
    EyeSlashIcon,
    PlusIcon,
    TrashIcon,
    WarningIcon,
} from '@phosphor-icons/react';

import { statusFor, t } from './schedule';

import type { CalendarFeedStatus, CalendarSource } from '#/lib/calendar-feeds';

export default function CalendarsPanel({
    calendars,
    statuses,
    onAdd,
    onToggle,
    onDelete,
    onRefresh,
}: {
    calendars: ReadonlyArray<CalendarSource>;
    statuses: ReadonlyArray<CalendarFeedStatus>;
    onAdd: () => void;
    onToggle: (calendar: CalendarSource) => void;
    onDelete: (calendar: CalendarSource) => void;
    onRefresh: () => void;
}) {
    return (
        <Stack gap={6}>
            <Group justify="space-between" gap="xs">
                <Text size="xs" fw={600} c="dimmed">
                    {t('calendars')}
                </Text>

                <Group gap={4}>
                    <Tooltip label={t('resync')}>
                        <ActionIcon
                            size="sm"
                            variant="subtle"
                            aria-label={t('resync')}
                            onClick={onRefresh}
                        >
                            <ArrowsClockwiseIcon size={14} />
                        </ActionIcon>
                    </Tooltip>

                    <Button
                        size="compact-xs"
                        variant="light"
                        leftSection={<PlusIcon size={12} />}
                        onClick={onAdd}
                    >
                        {t('add_calendar')}
                    </Button>
                </Group>
            </Group>

            {calendars.length === 0 ? (
                <Text size="xs" c="dimmed">
                    {t('no_calendars')}
                </Text>
            ) : (
                calendars.map((calendar) => {
                    const status = statusFor(calendar.id, statuses);
                    const failed = status?.status === 'error';

                    return (
                        <Group
                            key={calendar.id}
                            gap="xs"
                            wrap="nowrap"
                            justify="space-between"
                        >
                            <Group
                                gap={6}
                                wrap="nowrap"
                                style={{ minWidth: 0 }}
                            >
                                <ColorSwatch
                                    size={12}
                                    color={`var(--mantine-color-${calendar.color}-6)`}
                                />

                                <Text
                                    size="xs"
                                    truncate
                                    c={calendar.enabled ? undefined : 'dimmed'}
                                >
                                    {calendar.name === ''
                                        ? calendar.fileName
                                        : calendar.name}
                                </Text>

                                {failed ? (
                                    <Tooltip
                                        label={
                                            status.stale
                                                ? t('feed_stale')
                                                : t('feed_failed')
                                        }
                                    >
                                        <Badge
                                            size="xs"
                                            color={
                                                status.stale ? 'yellow' : 'red'
                                            }
                                            variant="light"
                                            leftSection={
                                                <WarningIcon size={10} />
                                            }
                                        >
                                            {status.message ?? ''}
                                        </Badge>
                                    </Tooltip>
                                ) : null}

                                {status && status.unresolvedZones.length > 0 ? (
                                    <Tooltip label={t('unknown_zone')}>
                                        <Badge
                                            size="xs"
                                            color="yellow"
                                            variant="light"
                                        >
                                            TZ
                                        </Badge>
                                    </Tooltip>
                                ) : null}
                            </Group>

                            <Group gap={2} wrap="nowrap">
                                <Tooltip
                                    label={
                                        calendar.enabled ? t('hide') : t('show')
                                    }
                                >
                                    <ActionIcon
                                        size="sm"
                                        variant="subtle"
                                        aria-label={`${
                                            calendar.enabled
                                                ? t('hide')
                                                : t('show')
                                        }: ${calendar.name}`}
                                        onClick={() => onToggle(calendar)}
                                    >
                                        {calendar.enabled ? (
                                            <EyeIcon size={14} />
                                        ) : (
                                            <EyeSlashIcon size={14} />
                                        )}
                                    </ActionIcon>
                                </Tooltip>

                                <Tooltip label={t('delete_calendar')}>
                                    <ActionIcon
                                        size="sm"
                                        variant="subtle"
                                        color="red"
                                        aria-label={`${t('delete_calendar')}: ${
                                            calendar.name
                                        }`}
                                        onClick={() => onDelete(calendar)}
                                    >
                                        <TrashIcon size={14} />
                                    </ActionIcon>
                                </Tooltip>
                            </Group>
                        </Group>
                    );
                })
            )}
        </Stack>
    );
}

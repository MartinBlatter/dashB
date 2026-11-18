import { Alert, Divider, Group, Loader, Stack, Text } from '@mantine/core';

import { valueNumber, valueText } from '#/components/Widgets/values';
import { useWeather } from '#/lib/weather';
import { getLocale } from '#/paraglide/runtime';

import SkyIcon from './weather/SkyIcon';
import {
    asUnits,
    degreeSuffix,
    formatTemperature,
    placeLabel,
    skyLabel,
    t,
    weekdayLabel,
    windSuffix,
} from './weather/weather';

import type { DashboardWidgetMeta, DashboardWidgetProps } from './types';

export const widgetMeta = {
    type: 'weather',
    label: () => t('label'),
    description: () => t('description'),
    defaultSize: { w: 3, h: 5, minW: 1, minH: 3 },
    fields: [
        {
            kind: 'text',
            name: 'location',
            label: () => t('location'),
            description: () => t('location_hint'),
            required: true,
            maxLength: 80,
        },
        {
            kind: 'select',
            name: 'units',
            label: () => t('units'),
            defaultValue: 'metric',
            options: () => [
                { value: 'metric', label: t('units_metric') },
                { value: 'imperial', label: t('units_imperial') },
            ],
        },
        {
            kind: 'number',
            name: 'forecastDays',
            label: () => t('forecast_days'),
            min: 0,
            max: 7,
            step: 1,
            defaultValue: 3,
        },
    ],
} satisfies DashboardWidgetMeta;

export default function WeatherWidget({ config }: DashboardWidgetProps) {
    const location = valueText(config, 'location');
    const units = asUnits(config.units);
    const days = Math.min(
        7,
        Math.max(0, valueNumber(config, 'forecastDays', 3))
    );

    const { payload, isLoading } = useWeather(
        location,
        units,
        days,
        getLocale()
    );

    if (location.trim() === '') {
        return (
            <Text size="sm" c="dimmed">
                {t('no_location')}
            </Text>
        );
    }

    if (isLoading || !payload) {
        return (
            <Group justify="center" py="sm">
                <Loader size="xs" />
            </Group>
        );
    }

    if (payload.status === 'unresolved') {
        return (
            <Text size="sm" c="dimmed">
                {`${t('unresolved')} “${payload.query}”`}
            </Text>
        );
    }

    if (payload.status === 'error') {
        return (
            <Alert color="yellow" variant="light" p="xs">
                <Text size="xs">{t('failed')}</Text>
            </Alert>
        );
    }

    const { current, place } = payload;

    return (
        <Stack gap="xs">
            <Group gap="xs" wrap="nowrap" align="center">
                <SkyIcon code={current.code} isDay={current.isDay} size={28} />

                <div style={{ minWidth: 0 }}>
                    <Text size="xl" fw={700} lh={1.1}>
                        {formatTemperature(current.temperature, units, true)}
                    </Text>
                    <Text size="xs" c="dimmed" truncate>
                        {skyLabel(current.code)}
                    </Text>
                </div>
            </Group>

            <Text size="xs" c="dimmed" truncate>
                {placeLabel(place)}
            </Text>

            <Group gap="xs" wrap="wrap">
                {current.apparent === null ? null : (
                    <Text size="xs" c="dimmed">
                        {`${t('feels_like')} ${formatTemperature(current.apparent, units, false)}`}
                    </Text>
                )}

                {current.wind === null ? null : (
                    <Text size="xs" c="dimmed">
                        {`${t('wind')} ${Math.round(current.wind)} ${windSuffix(units)}`}
                    </Text>
                )}
            </Group>

            {payload.stale ? (
                <Text size="xs" c="dimmed" fs="italic">
                    {t('stale')}
                </Text>
            ) : null}

            {payload.days.length === 0 ? null : (
                <>
                    <Divider />

                    {payload.days.map((entry) => (
                        <Group
                            key={entry.day}
                            gap="xs"
                            wrap="nowrap"
                            justify="space-between"
                        >
                            <Group
                                gap={6}
                                wrap="nowrap"
                                style={{ minWidth: 0 }}
                            >
                                <SkyIcon code={entry.code} isDay size={14} />
                                <Text size="xs" truncate>
                                    {weekdayLabel(entry.day)}
                                </Text>
                            </Group>

                            <Text
                                size="xs"
                                c="dimmed"
                                style={{ whiteSpace: 'nowrap' }}
                            >
                                {`${Math.round(entry.min)}° / ${Math.round(entry.max)}${degreeSuffix(units)}`}
                            </Text>
                        </Group>
                    ))}
                </>
            )}
        </Stack>
    );
}

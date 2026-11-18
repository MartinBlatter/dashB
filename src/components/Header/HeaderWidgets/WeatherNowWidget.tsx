import { Group, Text } from '@mantine/core';

import SkyIcon from '#/components/Dashboard/DashboardWidgets/weather/SkyIcon';
import {
    asUnits,
    formatTemperature,
    skyLabel,
} from '#/components/Dashboard/DashboardWidgets/weather/weather';
import { createWidgetMessages } from '#/components/Widgets/i18n';
import { valueText } from '#/components/Widgets/values';
import { useWeather } from '#/lib/weather';
import { getLocale } from '#/paraglide/runtime';

import type { HeaderWidgetMeta, HeaderWidgetProps } from './types';

const t = createWidgetMessages({
    en: {
        label: 'Weather now',
        description: 'Current temperature for one place',
        location: 'Place',
        location_hint: 'A town or city name, for example Berlin or Zurich',
        units: 'Units',
        units_metric: 'Celsius',
        units_imperial: 'Fahrenheit',
    },
    de: {
        label: 'Wetter jetzt',
        description: 'Aktuelle Temperatur für einen Ort',
        location: 'Ort',
        location_hint: 'Ein Ortsname, zum Beispiel Berlin oder Zürich',
        units: 'Einheiten',
        units_metric: 'Celsius',
        units_imperial: 'Fahrenheit',
    },
});

export const widgetMeta = {
    type: 'weathernow',
    label: () => t('label'),
    description: () => t('description'),
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
    ],
} satisfies HeaderWidgetMeta;

export default function WeatherNowWidget({ label, config }: HeaderWidgetProps) {
    const location = valueText(config, 'location');
    const units = asUnits(config.units);

    const { payload } = useWeather(location, units, 0, getLocale());

    const reading = payload?.status === 'ok' ? payload : null;

    return (
        <div>
            <Text size="sm" fw={500}>
                {label}
            </Text>

            {reading === null ? (
                <Text size="xs" c="dimmed">
                    —
                </Text>
            ) : (
                <Group gap={4} wrap="nowrap" justify="center">
                    <SkyIcon
                        code={reading.current.code}
                        isDay={reading.current.isDay}
                        size={14}
                    />
                    <Text
                        size="xs"
                        c="dimmed"
                        title={skyLabel(reading.current.code)}
                    >
                        {formatTemperature(
                            reading.current.temperature,
                            units,
                            true
                        )}
                    </Text>
                </Group>
            )}
        </div>
    );
}

import { createWidgetMessages } from '#/components/Widgets/i18n';
import { getLocale } from '#/paraglide/runtime';

import type { WeatherPlace, WeatherUnits } from '#/lib/weather';

export const t = createWidgetMessages({
    en: {
        label: 'Weather',
        description: 'Current conditions and a short forecast.',
        location: 'Place',
        location_hint: 'A town or city name, for example Berlin or Zurich',
        units: 'Units',
        units_metric: 'Celsius',
        units_imperial: 'Fahrenheit',
        forecast_days: 'Forecast days',
        loading: 'Loading the forecast…',
        unresolved: 'No place found for',
        failed: 'The forecast could not be loaded.',
        stale: 'Showing the last reading',
        feels_like: 'Feels like',
        wind: 'Wind',
        no_location: 'Set a place in the widget settings.',
        sky_clear: 'Clear',
        sky_mostly_clear: 'Mostly clear',
        sky_partly_cloudy: 'Partly cloudy',
        sky_overcast: 'Overcast',
        sky_fog: 'Fog',
        sky_drizzle: 'Drizzle',
        sky_freezing_drizzle: 'Freezing drizzle',
        sky_rain: 'Rain',
        sky_freezing_rain: 'Freezing rain',
        sky_snow: 'Snow',
        sky_showers: 'Showers',
        sky_snow_showers: 'Snow showers',
        sky_thunderstorm: 'Thunderstorm',
        sky_unknown: 'Unknown',
    },
    de: {
        label: 'Wetter',
        description: 'Aktuelles Wetter und eine kurze Vorhersage.',
        location: 'Ort',
        location_hint: 'Ein Ortsname, zum Beispiel Berlin oder Zürich',
        units: 'Einheiten',
        units_metric: 'Celsius',
        units_imperial: 'Fahrenheit',
        forecast_days: 'Vorhersagetage',
        loading: 'Vorhersage wird geladen…',
        unresolved: 'Kein Ort gefunden für',
        failed: 'Die Vorhersage konnte nicht geladen werden.',
        stale: 'Zeigt die letzte Messung',
        feels_like: 'Gefühlt',
        wind: 'Wind',
        no_location: 'Ort in den Widget-Einstellungen festlegen.',
        sky_clear: 'Klar',
        sky_mostly_clear: 'Überwiegend klar',
        sky_partly_cloudy: 'Teilweise bewölkt',
        sky_overcast: 'Bedeckt',
        sky_fog: 'Nebel',
        sky_drizzle: 'Nieselregen',
        sky_freezing_drizzle: 'Gefrierender Nieselregen',
        sky_rain: 'Regen',
        sky_freezing_rain: 'Gefrierender Regen',
        sky_snow: 'Schnee',
        sky_showers: 'Schauer',
        sky_snow_showers: 'Schneeschauer',
        sky_thunderstorm: 'Gewitter',
        sky_unknown: 'Unbekannt',
    },
});

export type SkyKind =
    | 'clear'
    | 'mostly_clear'
    | 'partly_cloudy'
    | 'overcast'
    | 'fog'
    | 'drizzle'
    | 'freezing_drizzle'
    | 'rain'
    | 'freezing_rain'
    | 'snow'
    | 'showers'
    | 'snow_showers'
    | 'thunderstorm'
    | 'unknown';

export function skyKind(code: number): SkyKind {
    if (code === 0) return 'clear';
    if (code === 1) return 'mostly_clear';
    if (code === 2) return 'partly_cloudy';
    if (code === 3) return 'overcast';
    if (code === 45 || code === 48) return 'fog';
    if (code === 56 || code === 57) return 'freezing_drizzle';
    if (code >= 51 && code <= 55) return 'drizzle';
    if (code === 66 || code === 67) return 'freezing_rain';
    if (code >= 61 && code <= 65) return 'rain';
    if (code >= 71 && code <= 77) return 'snow';
    if (code >= 80 && code <= 82) return 'showers';
    if (code === 85 || code === 86) return 'snow_showers';
    if (code >= 95 && code <= 99) return 'thunderstorm';

    return 'unknown';
}

export function skyLabel(code: number): string {
    switch (skyKind(code)) {
        case 'clear':
            return t('sky_clear');
        case 'mostly_clear':
            return t('sky_mostly_clear');
        case 'partly_cloudy':
            return t('sky_partly_cloudy');
        case 'overcast':
            return t('sky_overcast');
        case 'fog':
            return t('sky_fog');
        case 'drizzle':
            return t('sky_drizzle');
        case 'freezing_drizzle':
            return t('sky_freezing_drizzle');
        case 'rain':
            return t('sky_rain');
        case 'freezing_rain':
            return t('sky_freezing_rain');
        case 'snow':
            return t('sky_snow');
        case 'showers':
            return t('sky_showers');
        case 'snow_showers':
            return t('sky_snow_showers');
        case 'thunderstorm':
            return t('sky_thunderstorm');
        case 'unknown':
            return t('sky_unknown');
    }
}

export function asUnits(value: unknown): WeatherUnits {
    return value === 'imperial' ? 'imperial' : 'metric';
}

export function degreeSuffix(units: WeatherUnits): string {
    return units === 'imperial' ? '°F' : '°C';
}

export function windSuffix(units: WeatherUnits): string {
    return units === 'imperial' ? 'mph' : 'km/h';
}

export function formatTemperature(
    value: number,
    units: WeatherUnits,
    withUnit: boolean
): string {
    const rounded = Math.round(value);

    return withUnit ? `${rounded}${degreeSuffix(units)}` : `${rounded}°`;
}

export function placeLabel(place: WeatherPlace): string {
    return [place.name, place.admin1, place.country]
        .filter((part) => part !== '')
        .join(', ');
}

export function weekdayLabel(day: string): string {
    const parsed = new Date(`${day}T12:00:00Z`);

    if (Number.isNaN(parsed.getTime())) return day;

    return parsed.toLocaleDateString(getLocale(), {
        weekday: 'short',
        timeZone: 'UTC',
    });
}

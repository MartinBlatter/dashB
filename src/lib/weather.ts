import { queryOptions, useQuery } from '@tanstack/react-query';
import { createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { z } from 'zod';

import { auth } from '#/lib/auth';

const GEOCODE_ENDPOINT = 'https://geocoding-api.open-meteo.com/v1/search';

const FORECAST_ENDPOINT = 'https://api.open-meteo.com/v1/forecast';

const WEATHER_USER_AGENT = 'dashb-weather/1.0';

const FETCH_TIMEOUT_MS = 10_000;

const MAX_RESPONSE_BYTES = 262_144;

const MAX_CACHE_ENTRIES = 100;

const GEOCODE_TTL_MS = 86_400_000;

const WEATHER_TTL_MS = 600_000;

export const WEATHER_STALE_MS = WEATHER_TTL_MS;

export type WeatherUnits = 'metric' | 'imperial';

export interface WeatherPlace {
    name: string;
    admin1: string;
    country: string;
    latitude: number;
    longitude: number;
}

export interface WeatherCurrent {
    temperature: number;
    apparent: number | null;
    code: number;
    isDay: boolean;
    wind: number | null;
}

export interface WeatherDay {
    day: string;
    code: number;
    max: number;
    min: number;
    precipitation: number | null;
}

export interface WeatherReading {
    status: 'ok';
    place: WeatherPlace;
    current: WeatherCurrent;
    days: Array<WeatherDay>;
    units: WeatherUnits;
    fetchedAt: string;
    stale: boolean;
}

export interface WeatherUnresolved {
    status: 'unresolved';
    query: string;
}

export interface WeatherFailure {
    status: 'error';
    reason: string;
}

export type WeatherPayload =
    WeatherReading | WeatherUnresolved | WeatherFailure;

interface GeocodeEntry {
    expiresAt: number;
    place: WeatherPlace | null;
}

interface WeatherEntry {
    expiresAt: number;
    inflight: Promise<WeatherReading> | null;
    lastGood: WeatherReading | null;
}

function geocodeCache(): Map<string, GeocodeEntry> {
    const store = globalThis as typeof globalThis & {
        __weatherGeocodeCache?: Map<string, GeocodeEntry>;
    };

    store.__weatherGeocodeCache ??= new Map<string, GeocodeEntry>();

    return store.__weatherGeocodeCache;
}

function weatherCache(): Map<string, WeatherEntry> {
    const store = globalThis as typeof globalThis & {
        __weatherCache?: Map<string, WeatherEntry>;
    };

    store.__weatherCache ??= new Map<string, WeatherEntry>();

    return store.__weatherCache;
}

function evict<TEntry extends { expiresAt: number }>(
    cache: Map<string, TEntry>
): void {
    if (cache.size <= MAX_CACHE_ENTRIES) return;

    const now = Date.now();

    for (const [key, entry] of cache) {
        if (entry.expiresAt <= now) cache.delete(key);
    }

    while (cache.size > MAX_CACHE_ENTRIES) {
        const oldest = cache.keys().next();

        if (oldest.done) break;

        cache.delete(oldest.value);
    }
}

async function currentUserId(): Promise<string | null> {
    const { headers } = getRequest();
    const session = await auth.api.getSession({ headers });

    return session?.user.id ?? null;
}

async function readCappedJson(response: Response): Promise<unknown> {
    const reader = response.body?.getReader();

    if (!reader) throw new Error('empty_response');

    const chunks: Array<Uint8Array> = [];
    let total = 0;

    for (;;) {
        const { done, value } = await reader.read();

        if (done) break;

        total += value.byteLength;

        if (total > MAX_RESPONSE_BYTES) {
            await reader.cancel();
            throw new Error('too_large');
        }

        chunks.push(value);
    }

    const merged = new Uint8Array(total);
    let offset = 0;

    for (const chunk of chunks) {
        merged.set(chunk, offset);
        offset += chunk.byteLength;
    }

    return JSON.parse(new TextDecoder('utf-8').decode(merged)) as unknown;
}

async function getJson(url: string): Promise<unknown> {
    const response = await fetch(url, {
        redirect: 'error',
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        headers: {
            accept: 'application/json',
            'user-agent': WEATHER_USER_AGENT,
        },
    });

    if (!response.ok) throw new Error(`http_${response.status}`);

    return await readCappedJson(response);
}

const geocodeSchema = z.object({
    results: z
        .array(
            z.object({
                name: z.string(),
                latitude: z.number(),
                longitude: z.number(),
                country: z.string().optional(),
                admin1: z.string().optional(),
            })
        )
        .optional(),
});

async function resolvePlace(
    query: string,
    language: string
): Promise<WeatherPlace | null> {
    const key = `${language}|${query.toLocaleLowerCase()}`;
    const cache = geocodeCache();
    const hit = cache.get(key);

    if (hit && hit.expiresAt > Date.now()) return hit.place;

    const url = `${GEOCODE_ENDPOINT}?name=${encodeURIComponent(
        query
    )}&count=1&language=${encodeURIComponent(language)}&format=json`;

    const parsed = geocodeSchema.safeParse(await getJson(url));

    if (!parsed.success) throw new Error('bad_geocode_response');

    const first = parsed.data.results?.[0];

    const place: WeatherPlace | null = first
        ? {
              name: first.name,
              admin1: first.admin1 ?? '',
              country: first.country ?? '',
              latitude: first.latitude,
              longitude: first.longitude,
          }
        : null;

    cache.set(key, { expiresAt: Date.now() + GEOCODE_TTL_MS, place });
    evict(cache);

    return place;
}

const forecastSchema = z.object({
    current: z.object({
        temperature_2m: z.number(),
        apparent_temperature: z.number().optional(),
        weather_code: z.number(),
        is_day: z.number().optional(),
        wind_speed_10m: z.number().optional(),
    }),
    daily: z
        .object({
            time: z.array(z.string()),
            weather_code: z.array(z.number()),
            temperature_2m_max: z.array(z.number()),
            temperature_2m_min: z.array(z.number()),
            precipitation_probability_max: z
                .array(z.number().nullable())
                .optional(),
        })
        .optional(),
});

async function loadForecast(
    place: WeatherPlace,
    units: WeatherUnits,
    days: number
): Promise<WeatherReading> {
    const params = new URLSearchParams({
        latitude: String(place.latitude),
        longitude: String(place.longitude),
        current:
            'temperature_2m,apparent_temperature,weather_code,is_day,wind_speed_10m',
        timezone: 'UTC',
    });

    if (days > 0) {
        params.set(
            'daily',
            'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max'
        );
        params.set('forecast_days', String(days));
    }

    if (units === 'imperial') {
        params.set('temperature_unit', 'fahrenheit');
        params.set('wind_speed_unit', 'mph');
    }

    const parsed = forecastSchema.safeParse(
        await getJson(`${FORECAST_ENDPOINT}?${params.toString()}`)
    );

    if (!parsed.success) throw new Error('bad_forecast_response');

    const { current, daily } = parsed.data;

    const forecast: Array<WeatherDay> = [];

    if (daily) {
        for (let index = 0; index < daily.time.length; index += 1) {
            const day = daily.time.at(index);
            const code = daily.weather_code.at(index);
            const max = daily.temperature_2m_max.at(index);
            const min = daily.temperature_2m_min.at(index);

            if (
                day === undefined ||
                code === undefined ||
                max === undefined ||
                min === undefined
            ) {
                continue;
            }

            forecast.push({
                day,
                code,
                max,
                min,
                precipitation:
                    daily.precipitation_probability_max?.[index] ?? null,
            });
        }
    }

    return {
        status: 'ok',
        place,
        current: {
            temperature: current.temperature_2m,
            apparent: current.apparent_temperature ?? null,
            code: current.weather_code,
            isDay: current.is_day === undefined ? true : current.is_day === 1,
            wind: current.wind_speed_10m ?? null,
        },
        days: forecast,
        units,
        fetchedAt: new Date().toISOString(),
        stale: false,
    };
}

async function readWeather(
    place: WeatherPlace,
    units: WeatherUnits,
    days: number
): Promise<WeatherReading> {
    const key = `${place.latitude},${place.longitude},${units},${days}`;
    const cache = weatherCache();
    const entry = cache.get(key);
    const now = Date.now();

    if (entry) {
        if (entry.inflight) return await entry.inflight;

        if (entry.lastGood && entry.expiresAt > now) return entry.lastGood;
    }

    const previous = entry?.lastGood ?? null;

    const inflight = loadForecast(place, units, days);

    cache.set(key, {
        expiresAt: now + WEATHER_TTL_MS,
        inflight,
        lastGood: previous,
    });

    try {
        const reading = await inflight;

        cache.set(key, {
            expiresAt: Date.now() + WEATHER_TTL_MS,
            inflight: null,
            lastGood: reading,
        });

        evict(cache);

        return reading;
    } catch (error) {
        cache.set(key, {
            expiresAt: Date.now() + WEATHER_TTL_MS,
            inflight: null,
            lastGood: previous,
        });

        if (previous) return { ...previous, stale: true };

        throw error;
    }
}

export const fetchWeather = createServerFn({ method: 'GET' })
    .validator(
        z.object({
            location: z.string().min(1).max(80),
            units: z.enum(['metric', 'imperial']),
            days: z.number().int().min(0).max(7),
            language: z.string().min(2).max(5),
        })
    )
    .handler(async ({ data }): Promise<WeatherPayload> => {
        const userId = await currentUserId();

        if (!userId) return { status: 'error', reason: 'not_signed_in' };

        const query = data.location.trim();

        if (query === '') return { status: 'unresolved', query };

        try {
            const place = await resolvePlace(query, data.language);

            if (!place) return { status: 'unresolved', query };

            return await readWeather(place, data.units, data.days);
        } catch (error) {
            return {
                status: 'error',
                reason: error instanceof Error ? error.message : 'unknown',
            };
        }
    });

export const weatherQueryKey = (
    location: string,
    units: WeatherUnits,
    days: number,
    language: string
): Array<string> => [
    'weather',
    location.trim().toLocaleLowerCase(),
    units,
    String(days),
    language,
];

export const weatherQueryOptions = (
    location: string,
    units: WeatherUnits,
    days: number,
    language: string
) =>
    queryOptions({
        queryKey: weatherQueryKey(location, units, days, language),
        queryFn: () =>
            fetchWeather({
                data: { location: location.trim(), units, days, language },
            }),
        enabled: location.trim() !== '',
        staleTime: WEATHER_STALE_MS,
        refetchInterval: WEATHER_STALE_MS,
    });

export function useWeather(
    location: string,
    units: WeatherUnits,
    days: number,
    language: string
) {
    const { data, isLoading } = useQuery(
        weatherQueryOptions(location, units, days, language)
    );

    return { payload: data, isLoading };
}

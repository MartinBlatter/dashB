import { queryOptions, useQuery } from '@tanstack/react-query';
import { createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { z } from 'zod';

import { prisma } from '#/db';
import { auth } from '#/lib/auth';
import {
    asDateFormat,
    dateFormats,
    defaultDateFormat,
} from '#/lib/date-format';
import { documentPreviewKind, normalizeMimeType } from '#/lib/page-documents';
import {
    clampSurfaceOpacity,
    defaultSurfaceOpacity,
    defaultThemeHue,
    minSurfaceOpacity,
} from '#/lib/theme';

import type { DateFormat } from '#/lib/date-format';

export interface UserSettings {
    themeHue: number;
    surfaceOpacity: number;
    backgroundImageId: string | null;
    dateFormat: DateFormat;
}

export const defaultUserSettings: UserSettings = {
    themeHue: defaultThemeHue,
    surfaceOpacity: defaultSurfaceOpacity,
    backgroundImageId: null,
    dateFormat: defaultDateFormat,
};

const updateUserSettingsInput = z.object({
    themeHue: z.number().int().min(0).max(359).optional(),
    surfaceOpacity: z
        .number()
        .int()
        .min(minSurfaceOpacity)
        .max(defaultSurfaceOpacity)
        .optional(),
    backgroundImageId: z.string().min(1).nullable().optional(),
    dateFormat: z.enum(dateFormats).optional(),
});

const settingsSelect = {
    themeHue: true,
    surfaceOpacity: true,
    backgroundImageId: true,
    dateFormat: true,
} as const;

type SettingsRow = {
    themeHue: number | null;
    surfaceOpacity: number | null;
    backgroundImageId: string | null;
    dateFormat: string | null;
};

function toSettings(row: SettingsRow | null): UserSettings {
    if (row === null) return defaultUserSettings;

    return {
        themeHue: row.themeHue ?? defaultThemeHue,
        surfaceOpacity:
            row.surfaceOpacity === null
                ? defaultSurfaceOpacity
                : clampSurfaceOpacity(row.surfaceOpacity),
        backgroundImageId: row.backgroundImageId,
        dateFormat: asDateFormat(row.dateFormat),
    };
}

async function currentUserId(): Promise<string | null> {
    const { headers } = getRequest();
    const session = await auth.api.getSession({ headers });

    return session?.user.id ?? null;
}

async function ownedImage(userId: string, id: string): Promise<void> {
    const row = await prisma.document.findFirst({
        where: { id, userId, kind: 'file' },
        select: { mimeType: true },
    });

    if (!row) throw new Error('Image not found');

    if (documentPreviewKind(normalizeMimeType(row.mimeType)) !== 'image') {
        throw new Error('Not an image');
    }
}

export const fetchUserSettings = createServerFn({ method: 'GET' }).handler(
    async (): Promise<UserSettings> => {
        const userId = await currentUserId();

        if (!userId) return defaultUserSettings;

        const settings = await prisma.userSettings.findUnique({
            where: { userId },
            select: settingsSelect,
        });

        return toSettings(settings);
    }
);

export const updateUserSettings = createServerFn({ method: 'POST' })
    .validator(updateUserSettingsInput)
    .handler(async ({ data }): Promise<UserSettings> => {
        const userId = await currentUserId();

        if (!userId) throw new Error('Not signed in');

        if (typeof data.backgroundImageId === 'string') {
            await ownedImage(userId, data.backgroundImageId);
        }

        const settings = await prisma.userSettings.upsert({
            where: { userId },
            create: { userId, ...data },
            update: data,
            select: settingsSelect,
        });

        return toSettings(settings);
    });

export const userSettingsQueryKey = ['user-settings'] as const;

export const userSettingsQueryOptions = () =>
    queryOptions({
        queryKey: userSettingsQueryKey,
        queryFn: () => fetchUserSettings(),
        staleTime: 30_000,
    });

export function useUserSettings(): UserSettings {
    const { data } = useQuery(userSettingsQueryOptions());

    return data ?? defaultUserSettings;
}

export function useDateFormat(): DateFormat {
    return useUserSettings().dateFormat;
}

import { queryOptions, useQuery } from '@tanstack/react-query';
import { createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { z } from 'zod';

import { prisma } from '#/db';
import { auth } from '#/lib/auth';
import { defaultThemeHue } from '#/lib/theme';

export interface UserSettings {
    themeHue: number;
}

const setThemeHueInput = z.object({
    themeHue: z.number().int().min(0).max(359),
});

async function currentUserId(): Promise<string | null> {
    const { headers } = getRequest();
    const session = await auth.api.getSession({ headers });

    return session?.user.id ?? null;
}

export const fetchUserSettings = createServerFn({ method: 'GET' }).handler(
    async (): Promise<UserSettings> => {
        const userId = await currentUserId();

        if (!userId) return { themeHue: defaultThemeHue };

        const settings = await prisma.userSettings.findUnique({
            where: { userId },
            select: { themeHue: true },
        });

        return { themeHue: settings?.themeHue ?? defaultThemeHue };
    }
);

export const setThemeHue = createServerFn({ method: 'POST' })
    .validator(setThemeHueInput)
    .handler(async ({ data }): Promise<UserSettings> => {
        const userId = await currentUserId();

        if (!userId) throw new Error('Not signed in');

        const settings = await prisma.userSettings.upsert({
            where: { userId },
            create: { userId, themeHue: data.themeHue },
            update: { themeHue: data.themeHue },
            select: { themeHue: true },
        });

        return { themeHue: settings.themeHue ?? defaultThemeHue };
    });

export const userSettingsQueryKey = ['user-settings'] as const;

export const userSettingsQueryOptions = () =>
    queryOptions({
        queryKey: userSettingsQueryKey,
        queryFn: () => fetchUserSettings(),
        staleTime: 30_000,
    });

export function useThemeHue(): number {
    const { data } = useQuery(userSettingsQueryOptions());

    return data?.themeHue ?? defaultThemeHue;
}

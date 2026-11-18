import { queryOptions, useQuery } from '@tanstack/react-query';
import { createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { z } from 'zod';

import { prisma } from '#/db';
import { auth } from '#/lib/auth';

import { asStoredValues } from '#/components/Widgets/values';

import type { StoredWidgetValues } from '#/components/Widgets/types';

export interface HeaderWidgetInstance {
    id: string;
    type: string;
    label: string;
    position: number;
    config: StoredWidgetValues;
}

const storedConfigSchema = z.record(
    z.string(),
    z.union([z.string(), z.number(), z.boolean(), z.null()])
);

const createHeaderWidgetInput = z.object({
    type: z.string().min(1),
    label: z.string().min(1),
    config: storedConfigSchema,
});

const updateHeaderWidgetInput = z.object({
    id: z.string().min(1),
    label: z.string().min(1),
    config: storedConfigSchema,
});

const deleteHeaderWidgetInput = z.object({
    id: z.string().min(1),
});

const reorderHeaderWidgetsInput = z.object({
    ids: z.array(z.string().min(1)),
});

async function currentUserId(): Promise<string | null> {
    const { headers } = getRequest();
    const session = await auth.api.getSession({ headers });

    return session?.user.id ?? null;
}

export const fetchHeaderWidgets = createServerFn({ method: 'GET' }).handler(
    async (): Promise<Array<HeaderWidgetInstance>> => {
        const userId = await currentUserId();

        if (!userId) return [];

        const rows = await prisma.headerWidget.findMany({
            where: { userId },
            orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
            select: {
                id: true,
                type: true,
                label: true,
                position: true,
                config: true,
            },
        });

        return rows.map((row) => ({
            id: row.id,
            type: row.type,
            label: row.label,
            position: row.position,
            config: asStoredValues(row.config),
        }));
    }
);

export const createHeaderWidget = createServerFn({ method: 'POST' })
    .validator(createHeaderWidgetInput)
    .handler(async ({ data }): Promise<void> => {
        const userId = await currentUserId();

        if (!userId) throw new Error('Not signed in');

        const last = await prisma.headerWidget.findFirst({
            where: { userId },
            orderBy: { position: 'desc' },
            select: { position: true },
        });

        await prisma.headerWidget.create({
            data: {
                userId,
                type: data.type,
                label: data.label,
                position: last ? last.position + 1 : 0,
                config: data.config,
            },
        });
    });

export const updateHeaderWidget = createServerFn({ method: 'POST' })
    .validator(updateHeaderWidgetInput)
    .handler(async ({ data }): Promise<void> => {
        const userId = await currentUserId();

        if (!userId) throw new Error('Not signed in');

        const updated = await prisma.headerWidget.updateMany({
            where: { id: data.id, userId },
            data: { label: data.label, config: data.config },
        });

        if (updated.count === 0) throw new Error('Widget not found');
    });

export const deleteHeaderWidget = createServerFn({ method: 'POST' })
    .validator(deleteHeaderWidgetInput)
    .handler(async ({ data }): Promise<void> => {
        const userId = await currentUserId();

        if (!userId) throw new Error('Not signed in');

        const deleted = await prisma.headerWidget.deleteMany({
            where: { id: data.id, userId },
        });

        if (deleted.count === 0) throw new Error('Widget not found');
    });

export const reorderHeaderWidgets = createServerFn({ method: 'POST' })
    .validator(reorderHeaderWidgetsInput)
    .handler(async ({ data }): Promise<void> => {
        const userId = await currentUserId();

        if (!userId) throw new Error('Not signed in');

        await prisma.$transaction(
            data.ids.map((id, index) =>
                prisma.headerWidget.updateMany({
                    where: { id, userId },
                    data: { position: index },
                })
            )
        );
    });

export const headerWidgetsQueryKey = ['header-widgets'] as const;

export const headerWidgetsQueryOptions = () =>
    queryOptions({
        queryKey: headerWidgetsQueryKey,
        queryFn: () => fetchHeaderWidgets(),
    });

export function useHeaderWidgets(): Array<HeaderWidgetInstance> {
    const { data } = useQuery(headerWidgetsQueryOptions());

    return data ?? [];
}

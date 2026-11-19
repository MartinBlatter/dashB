import { queryOptions, useQuery } from '@tanstack/react-query';
import { createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { z } from 'zod';

import { asStoredValues } from '#/components/Widgets/values';
import { prisma } from '#/db';
import { auth } from '#/lib/auth';

import type { StoredWidgetValues } from '#/components/Widgets/types';

export interface WidgetLayout {
    x: number;
    y: number;
    w: number;
    h: number;
}

export interface DashboardWidgetInstance extends WidgetLayout {
    id: string;
    type: string;
    label: string;
    config: StoredWidgetValues;
}

export const storedValuesSchema = z.record(
    z.string(),
    z.union([z.string(), z.number(), z.boolean(), z.null()])
);

const scopeInput = z.object({
    pageId: z.string().min(1).nullable(),
});

const createWidgetInput = z.object({
    pageId: z.string().min(1).nullable(),
    type: z.string().min(1),
    label: z.string().min(1),
    config: storedValuesSchema,
    w: z.number().int().min(1).max(12).optional(),
    h: z.number().int().min(1).max(40).optional(),
});

const updateWidgetInput = z.object({
    id: z.string().min(1),
    label: z.string().min(1),
    config: storedValuesSchema,
});

const deleteWidgetInput = z.object({ id: z.string().min(1) });

const saveLayoutInput = z.object({
    items: z.array(
        z.object({
            id: z.string().min(1),
            x: z.number().int().min(0),
            y: z.number().int().min(0),
            w: z.number().int().min(1),
            h: z.number().int().min(1),
        })
    ),
});

async function currentUserId(): Promise<string | null> {
    const { headers } = getRequest();
    const session = await auth.api.getSession({ headers });

    return session?.user.id ?? null;
}

const widgetSelect = {
    id: true,
    type: true,
    label: true,
    config: true,
    x: true,
    y: true,
    w: true,
    h: true,
} as const;

async function assertOwnedPage(
    userId: string,
    pageId: string | null
): Promise<void> {
    if (!pageId) return;

    const page = await prisma.page.findFirst({
        where: { id: pageId, userId },
        select: { id: true },
    });

    if (!page) throw new Error('Page not found');
}

export const fetchDashboardWidgets = createServerFn({ method: 'GET' })
    .validator(scopeInput)
    .handler(async ({ data }): Promise<Array<DashboardWidgetInstance>> => {
        const userId = await currentUserId();

        if (!userId) return [];

        const rows = await prisma.dashboardWidget.findMany({
            where: { userId, pageId: data.pageId },
            orderBy: [{ y: 'asc' }, { x: 'asc' }, { createdAt: 'asc' }],
            select: widgetSelect,
        });

        return rows.map((row) => ({
            ...row,
            config: asStoredValues(row.config),
        }));
    });

export const createDashboardWidget = createServerFn({ method: 'POST' })
    .validator(createWidgetInput)
    .handler(async ({ data }): Promise<string> => {
        const userId = await currentUserId();

        if (!userId) throw new Error('Not signed in');

        await assertOwnedPage(userId, data.pageId);

        const lowest = await prisma.dashboardWidget.findFirst({
            where: { userId, pageId: data.pageId },
            orderBy: { y: 'desc' },
            select: { y: true, h: true },
        });

        const created = await prisma.dashboardWidget.create({
            data: {
                userId,
                pageId: data.pageId,
                type: data.type,
                label: data.label,
                config: data.config,
                x: 0,
                y: lowest ? lowest.y + lowest.h : 0,
                w: data.w ?? 4,
                h: data.h ?? 4,
            },
            select: { id: true },
        });

        return created.id;
    });

export const updateDashboardWidget = createServerFn({ method: 'POST' })
    .validator(updateWidgetInput)
    .handler(async ({ data }): Promise<void> => {
        const userId = await currentUserId();

        if (!userId) throw new Error('Not signed in');

        const updated = await prisma.dashboardWidget.updateMany({
            where: { id: data.id, userId },
            data: { label: data.label, config: data.config },
        });

        if (updated.count === 0) throw new Error('Widget not found');
    });

export const deleteDashboardWidget = createServerFn({ method: 'POST' })
    .validator(deleteWidgetInput)
    .handler(async ({ data }): Promise<void> => {
        const userId = await currentUserId();

        if (!userId) throw new Error('Not signed in');

        const deleted = await prisma.dashboardWidget.deleteMany({
            where: { id: data.id, userId },
        });

        if (deleted.count === 0) throw new Error('Widget not found');
    });

export const saveDashboardLayout = createServerFn({ method: 'POST' })
    .validator(saveLayoutInput)
    .handler(async ({ data }): Promise<void> => {
        const userId = await currentUserId();

        if (!userId) throw new Error('Not signed in');

        await prisma.$transaction(
            data.items.map((item) =>
                prisma.dashboardWidget.updateMany({
                    where: { id: item.id, userId },
                    data: { x: item.x, y: item.y, w: item.w, h: item.h },
                })
            )
        );
    });

export const dashboardWidgetsQueryKey = (
    pageId: string | null = null
): Array<string | null> => ['dashboard-widgets', pageId];

export const dashboardWidgetsQueryOptions = (pageId: string | null = null) =>
    queryOptions({
        queryKey: dashboardWidgetsQueryKey(pageId),
        queryFn: () => fetchDashboardWidgets({ data: { pageId } }),
    });

export function useDashboardWidgets(
    pageId: string | null = null
): Array<DashboardWidgetInstance> {
    const { data } = useQuery(dashboardWidgetsQueryOptions(pageId));

    return data ?? [];
}

export function useDashboardWidgetsPending(
    pageId: string | null = null
): boolean {
    const { isPending } = useQuery(dashboardWidgetsQueryOptions(pageId));

    return isPending;
}

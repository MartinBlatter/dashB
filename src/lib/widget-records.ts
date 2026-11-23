import {
    queryOptions,
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';
import { createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { z } from 'zod';

import { asStoredValues } from '#/components/Widgets/values';
import { prisma } from '#/db';
import { auth } from '#/lib/auth';
import { storedValuesSchema } from '#/lib/dashboard-widgets';

import type { StoredWidgetValues } from '#/components/Widgets/types';

export interface WidgetRecord {
    id: string;
    collection: string;
    position: number;
    sortKey: string | null;
    data: StoredWidgetValues;
    createdAt: string;
    updatedAt: string;
}

export type WidgetRecordOrder = 'position' | 'sortKey';

export const maxWidgetRecordsPerCollection = 2000;

const listInput = z.object({
    widgetId: z.string().min(1),
    collection: z.string().min(1),
    order: z.enum(['position', 'sortKey']).optional(),
});

const createInput = z.object({
    widgetId: z.string().min(1),
    collection: z.string().min(1),
    data: storedValuesSchema,
    sortKey: z.string().nullable().optional(),
});

const updateInput = z.object({
    id: z.string().min(1),
    data: storedValuesSchema,
    sortKey: z.string().nullable().optional(),
    position: z.number().int().min(0).optional(),
});

const deleteInput = z.object({ id: z.string().min(1) });

const reorderInput = z.object({
    widgetId: z.string().min(1),
    collection: z.string().min(1),
    ids: z.array(z.string().min(1)).max(maxWidgetRecordsPerCollection),
});

const recordSelect = {
    id: true,
    collection: true,
    position: true,
    sortKey: true,
    data: true,
    createdAt: true,
    updatedAt: true,
} as const;

type RecordRow = {
    id: string;
    collection: string;
    position: number;
    sortKey: string | null;
    data: unknown;
    createdAt: Date;
    updatedAt: Date;
};

async function currentUserId(): Promise<string | null> {
    const { headers } = getRequest();
    const session = await auth.api.getSession({ headers });

    return session?.user.id ?? null;
}

function toRecord(row: RecordRow): WidgetRecord {
    return {
        id: row.id,
        collection: row.collection,
        position: row.position,
        sortKey: row.sortKey,
        data: asStoredValues(row.data),
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
    };
}

async function assertOwnedWidget(widgetId: string): Promise<void> {
    const userId = await currentUserId();

    if (!userId) throw new Error('Not signed in');

    const widget = await prisma.dashboardWidget.findFirst({
        where: { id: widgetId, userId },
        select: { id: true },
    });

    if (!widget) throw new Error('Widget not found');
}

async function ownedRecordWidgetId(recordId: string): Promise<string> {
    const userId = await currentUserId();

    if (!userId) throw new Error('Not signed in');

    const record = await prisma.widgetRecord.findFirst({
        where: { id: recordId, widget: { userId } },
        select: { widgetId: true },
    });

    if (!record) throw new Error('Record not found');

    return record.widgetId;
}

export const fetchWidgetRecords = createServerFn({ method: 'GET' })
    .validator(listInput)
    .handler(async ({ data }): Promise<Array<WidgetRecord>> => {
        const userId = await currentUserId();

        if (!userId) return [];

        const rows = await prisma.widgetRecord.findMany({
            where: {
                widgetId: data.widgetId,
                collection: data.collection,
                widget: { userId },
            },
            orderBy:
                data.order === 'sortKey'
                    ? [{ sortKey: 'asc' }, { createdAt: 'asc' }]
                    : [{ position: 'asc' }, { createdAt: 'asc' }],
            select: recordSelect,
        });

        return rows.map(toRecord);
    });

export const createWidgetRecord = createServerFn({ method: 'POST' })
    .validator(createInput)
    .handler(async ({ data }): Promise<WidgetRecord> => {
        await assertOwnedWidget(data.widgetId);

        const last = await prisma.widgetRecord.findFirst({
            where: { widgetId: data.widgetId, collection: data.collection },
            orderBy: { position: 'desc' },
            select: { position: true },
        });

        const row = await prisma.widgetRecord.create({
            data: {
                widgetId: data.widgetId,
                collection: data.collection,
                position: last ? last.position + 1 : 0,
                sortKey: data.sortKey ?? null,
                data: data.data,
            },
            select: recordSelect,
        });

        return toRecord(row);
    });

export const updateWidgetRecord = createServerFn({ method: 'POST' })
    .validator(updateInput)
    .handler(async ({ data }): Promise<WidgetRecord> => {
        await ownedRecordWidgetId(data.id);

        const row = await prisma.widgetRecord.update({
            where: { id: data.id },
            data: {
                data: data.data,
                ...(data.sortKey === undefined
                    ? {}
                    : { sortKey: data.sortKey }),
                ...(data.position === undefined
                    ? {}
                    : { position: data.position }),
            },
            select: recordSelect,
        });

        return toRecord(row);
    });

export const deleteWidgetRecord = createServerFn({ method: 'POST' })
    .validator(deleteInput)
    .handler(async ({ data }): Promise<void> => {
        await ownedRecordWidgetId(data.id);

        await prisma.widgetRecord.delete({ where: { id: data.id } });
    });

export const reorderWidgetRecords = createServerFn({ method: 'POST' })
    .validator(reorderInput)
    .handler(async ({ data }): Promise<void> => {
        await assertOwnedWidget(data.widgetId);

        await prisma.$transaction(
            data.ids.map((id, index) =>
                prisma.widgetRecord.updateMany({
                    where: {
                        id,
                        widgetId: data.widgetId,
                        collection: data.collection,
                    },
                    data: { position: index },
                })
            )
        );
    });

export const widgetRecordsQueryKey = (
    widgetId: string,
    collection: string
): Array<string> => ['widget-records', widgetId, collection];

export const widgetRecordsQueryOptions = (
    widgetId: string,
    collection: string,
    order?: WidgetRecordOrder
) =>
    queryOptions({
        queryKey: widgetRecordsQueryKey(widgetId, collection),
        queryFn: () =>
            fetchWidgetRecords({ data: { widgetId, collection, order } }),
    });

export interface WidgetRecordStore {
    records: Array<WidgetRecord>;
    isLoading: boolean;
    create: (values: {
        data: StoredWidgetValues;
        sortKey?: string | null;
    }) => Promise<void>;
    update: (values: {
        id: string;
        data: StoredWidgetValues;
        sortKey?: string | null;
    }) => Promise<void>;
    remove: (id: string) => Promise<void>;
    reorder: (ids: Array<string>) => Promise<void>;
}

function reorderByIds(
    current: Array<WidgetRecord> | undefined,
    ids: Array<string>
): Array<WidgetRecord> {
    const byId = new Map((current ?? []).map((record) => [record.id, record]));

    return ids
        .map((id, index) => {
            const record = byId.get(id);

            return record === undefined
                ? undefined
                : { ...record, position: index };
        })
        .filter((record): record is WidgetRecord => record !== undefined);
}

export function useWidgetRecords(
    widgetId: string,
    collection: string,
    order?: WidgetRecordOrder
): WidgetRecordStore {
    const queryClient = useQueryClient();
    const key = widgetRecordsQueryKey(widgetId, collection);

    const { data, isLoading } = useQuery(
        widgetRecordsQueryOptions(widgetId, collection, order)
    );

    const invalidate = () => queryClient.invalidateQueries({ queryKey: key });

    const create = useMutation({
        mutationFn: (values: {
            data: StoredWidgetValues;
            sortKey?: string | null;
        }) =>
            createWidgetRecord({
                data: { widgetId, collection, ...values },
            }),
        onSettled: invalidate,
    });

    const update = useMutation({
        mutationFn: (values: {
            id: string;
            data: StoredWidgetValues;
            sortKey?: string | null;
        }) => updateWidgetRecord({ data: values }),
        onMutate: (values) => {
            queryClient.setQueryData<Array<WidgetRecord>>(key, (current) =>
                (current ?? []).map((record) =>
                    record.id === values.id
                        ? {
                              ...record,
                              data: values.data,
                              sortKey:
                                  values.sortKey === undefined
                                      ? record.sortKey
                                      : values.sortKey,
                          }
                        : record
                )
            );
        },
        onSettled: invalidate,
    });

    const remove = useMutation({
        mutationFn: (id: string) => deleteWidgetRecord({ data: { id } }),
        onMutate: (id) => {
            queryClient.setQueryData<Array<WidgetRecord>>(key, (current) =>
                (current ?? []).filter((record) => record.id !== id)
            );
        },
        onSettled: invalidate,
    });

    const reorder = useMutation({
        mutationFn: (ids: Array<string>) =>
            reorderWidgetRecords({ data: { widgetId, collection, ids } }),
        onMutate: (ids) => {
            queryClient.setQueryData<Array<WidgetRecord>>(key, (current) =>
                reorderByIds(current, ids)
            );
        },
        onSettled: invalidate,
    });

    return {
        records: data ?? [],
        isLoading,
        create: async (values) => {
            await create.mutateAsync(values);
        },
        update: async (values) => {
            await update.mutateAsync(values);
        },
        remove: async (id) => {
            await remove.mutateAsync(id);
        },
        reorder: async (ids) => {
            await reorder.mutateAsync(ids);
        },
    };
}

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

export const maxPageRecordsPerCollection = 2000;

export interface PageRecord {
    id: string;
    collection: string;
    position: number;
    sortKey: string | null;
    data: StoredWidgetValues;
    createdAt: string;
    updatedAt: string;
}

export type PageRecordOrder = 'position' | 'sortKey';

const listInput = z.object({
    pageId: z.string().min(1),
    collection: z.string().min(1),
    order: z.enum(['position', 'sortKey']).optional(),
});

const createInput = z.object({
    pageId: z.string().min(1),
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

const deleteInput = z.object({
    id: z.string().min(1),
});

const deleteManyInput = z.object({
    ids: z.array(z.string().min(1)).min(1).max(maxPageRecordsPerCollection),
});

const reorderInput = z.object({
    pageId: z.string().min(1),
    collection: z.string().min(1),
    ids: z.array(z.string().min(1)).max(maxPageRecordsPerCollection),
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

async function assertOwnedPage(userId: string, pageId: string): Promise<void> {
    const page = await prisma.page.findFirst({
        where: { id: pageId, userId },
        select: { id: true },
    });

    if (!page) throw new Error('Page not found');
}

function toRecord(row: RecordRow): PageRecord {
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

export const fetchPageRecords = createServerFn({ method: 'GET' })
    .validator(listInput)
    .handler(async ({ data }): Promise<Array<PageRecord>> => {
        const userId = await currentUserId();

        if (!userId) return [];

        const rows = await prisma.pageRecord.findMany({
            where: {
                userId,
                pageId: data.pageId,
                collection: data.collection,
            },
            orderBy:
                data.order === 'sortKey'
                    ? [{ sortKey: 'asc' }, { createdAt: 'asc' }]
                    : [{ position: 'asc' }, { createdAt: 'asc' }],
            select: recordSelect,
        });

        return rows.map(toRecord);
    });

export const createPageRecord = createServerFn({ method: 'POST' })
    .validator(createInput)
    .handler(async ({ data }): Promise<PageRecord> => {
        const userId = await currentUserId();

        if (!userId) throw new Error('Not signed in');

        await assertOwnedPage(userId, data.pageId);

        const count = await prisma.pageRecord.count({
            where: {
                userId,
                pageId: data.pageId,
                collection: data.collection,
            },
        });

        if (count >= maxPageRecordsPerCollection) {
            throw new Error('Too many rows on this page');
        }

        const last = await prisma.pageRecord.findFirst({
            where: {
                userId,
                pageId: data.pageId,
                collection: data.collection,
            },
            orderBy: { position: 'desc' },
            select: { position: true },
        });

        const row = await prisma.pageRecord.create({
            data: {
                userId,
                pageId: data.pageId,
                collection: data.collection,
                position: last ? last.position + 1 : 0,
                sortKey: data.sortKey ?? null,
                data: data.data,
            },
            select: recordSelect,
        });

        return toRecord(row);
    });

export const updatePageRecord = createServerFn({ method: 'POST' })
    .validator(updateInput)
    .handler(async ({ data }): Promise<void> => {
        const userId = await currentUserId();

        if (!userId) throw new Error('Not signed in');

        const updated = await prisma.pageRecord.updateMany({
            where: { id: data.id, userId },
            data: {
                data: data.data,
                ...(data.sortKey === undefined
                    ? {}
                    : { sortKey: data.sortKey }),
                ...(data.position === undefined
                    ? {}
                    : { position: data.position }),
            },
        });

        if (updated.count === 0) throw new Error('Record not found');
    });

export const deletePageRecord = createServerFn({ method: 'POST' })
    .validator(deleteInput)
    .handler(async ({ data }): Promise<void> => {
        const userId = await currentUserId();

        if (!userId) throw new Error('Not signed in');

        const deleted = await prisma.pageRecord.deleteMany({
            where: { id: data.id, userId },
        });

        if (deleted.count === 0) throw new Error('Record not found');
    });

export const deletePageRecords = createServerFn({ method: 'POST' })
    .validator(deleteManyInput)
    .handler(async ({ data }): Promise<void> => {
        const userId = await currentUserId();

        if (!userId) throw new Error('Not signed in');

        await prisma.pageRecord.deleteMany({
            where: { id: { in: data.ids }, userId },
        });
    });

export const reorderPageRecords = createServerFn({ method: 'POST' })
    .validator(reorderInput)
    .handler(async ({ data }): Promise<void> => {
        const userId = await currentUserId();

        if (!userId) throw new Error('Not signed in');

        await assertOwnedPage(userId, data.pageId);

        await prisma.$transaction(
            data.ids.map((id, index) =>
                prisma.pageRecord.updateMany({
                    where: {
                        id,
                        userId,
                        pageId: data.pageId,
                        collection: data.collection,
                    },
                    data: { position: index },
                })
            )
        );
    });

export const pageRecordsQueryKey = (
    pageId: string,
    collection: string
): Array<string> => ['page-records', pageId, collection];

export const pageRecordsQueryOptions = (
    pageId: string,
    collection: string,
    order?: PageRecordOrder
) =>
    queryOptions({
        queryKey: pageRecordsQueryKey(pageId, collection),
        queryFn: () =>
            fetchPageRecords({ data: { pageId, collection, order } }),
    });

export interface PageRecordDraft {
    data: StoredWidgetValues;
    sortKey?: string | null;
}

export interface PageRecordEdit extends PageRecordDraft {
    id: string;
    position?: number;
}

export interface PageRecordStore {
    records: Array<PageRecord>;
    isPending: boolean;
    create: (draft: PageRecordDraft) => Promise<PageRecord>;
    update: (edit: PageRecordEdit) => Promise<void>;
    remove: (id: string) => Promise<void>;
    removeMany: (ids: Array<string>) => Promise<void>;
    reorder: (ids: Array<string>) => Promise<void>;
}

function reorderByIds(
    current: Array<PageRecord> | undefined,
    ids: Array<string>
): Array<PageRecord> {
    const byId = new Map((current ?? []).map((record) => [record.id, record]));

    return ids
        .map((id, index) => {
            const record = byId.get(id);

            return record === undefined
                ? undefined
                : { ...record, position: index };
        })
        .filter((record): record is PageRecord => record !== undefined);
}

export function usePageRecords(
    pageId: string,
    collection: string,
    order?: PageRecordOrder
): PageRecordStore {
    const queryClient = useQueryClient();
    const key = pageRecordsQueryKey(pageId, collection);

    const { data, isPending } = useQuery(
        pageRecordsQueryOptions(pageId, collection, order)
    );

    const invalidate = () => queryClient.invalidateQueries({ queryKey: key });

    const create = useMutation({
        mutationFn: (draft: PageRecordDraft) =>
            createPageRecord({ data: { pageId, collection, ...draft } }),
        onSettled: invalidate,
    });

    const update = useMutation({
        mutationFn: (edit: PageRecordEdit) => updatePageRecord({ data: edit }),
        onMutate: (edit) => {
            queryClient.setQueryData<Array<PageRecord>>(key, (current) =>
                (current ?? []).map((record) =>
                    record.id === edit.id
                        ? {
                              ...record,
                              data: edit.data,
                              sortKey:
                                  edit.sortKey === undefined
                                      ? record.sortKey
                                      : edit.sortKey,
                              position: edit.position ?? record.position,
                          }
                        : record
                )
            );
        },
        onSettled: invalidate,
    });

    const remove = useMutation({
        mutationFn: (id: string) => deletePageRecord({ data: { id } }),
        onMutate: (id) => {
            queryClient.setQueryData<Array<PageRecord>>(key, (current) =>
                (current ?? []).filter((record) => record.id !== id)
            );
        },
        onSettled: invalidate,
    });

    const removeMany = useMutation({
        mutationFn: (ids: Array<string>) =>
            deletePageRecords({ data: { ids } }),
        onMutate: (ids) => {
            const removed = new Set(ids);

            queryClient.setQueryData<Array<PageRecord>>(key, (current) =>
                (current ?? []).filter((record) => !removed.has(record.id))
            );
        },
        onSettled: invalidate,
    });

    const reorder = useMutation({
        mutationFn: (ids: Array<string>) =>
            reorderPageRecords({ data: { pageId, collection, ids } }),
        onMutate: (ids) => {
            queryClient.setQueryData<Array<PageRecord>>(key, (current) =>
                reorderByIds(current, ids)
            );
        },
        onSettled: invalidate,
    });

    return {
        records: data ?? [],
        isPending,
        create: (draft) => create.mutateAsync(draft),
        update: async (edit) => {
            await update.mutateAsync(edit);
        },
        remove: async (id) => {
            await remove.mutateAsync(id);
        },
        removeMany: async (ids) => {
            await removeMany.mutateAsync(ids);
        },
        reorder: async (ids) => {
            await reorder.mutateAsync(ids);
        },
    };
}

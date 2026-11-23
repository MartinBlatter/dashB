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
import {
    asColumnKind,
    joinColumnOptions,
    maxTableColumnLabelLength,
    maxTableColumnOptionsLength,
    maxTableColumns,
    splitColumnOptions,
    stripColumnValues,
    tableColumnKinds,
} from '#/lib/table-schema';

import type { StoredWidgetValues } from '#/components/Widgets/types';
import type {
    TableColumn,
    TableColumnDraft,
    TableColumnEdit,
    TableColumnStore,
    TableEntry,
    TableEntryStore,
} from '#/lib/table-schema';

const pageInput = z.object({
    pageId: z.string().min(1),
});

const optionsInput = z
    .array(z.string().min(1).max(maxTableColumnLabelLength))
    .max(100)
    .refine(
        (options) =>
            joinColumnOptions(options).length <= maxTableColumnOptionsLength,
        { error: () => 'Too many choices' }
    );

const createColumnInput = z.object({
    pageId: z.string().min(1),
    label: z.string().min(1).max(maxTableColumnLabelLength),
    kind: z.enum(tableColumnKinds),
    required: z.boolean(),
    options: optionsInput,
});

const updateColumnInput = z.object({
    id: z.string().min(1),
    label: z.string().min(1).max(maxTableColumnLabelLength),
    required: z.boolean(),
    options: optionsInput,
});

const idInput = z.object({
    id: z.string().min(1),
});

const reorderInput = z.object({
    pageId: z.string().min(1),
    ids: z.array(z.string().min(1)),
});

const createEntryInput = z.object({
    pageId: z.string().min(1),
    data: storedValuesSchema,
});

const updateEntryInput = z.object({
    id: z.string().min(1),
    data: storedValuesSchema,
});

const columnSelect = {
    id: true,
    label: true,
    kind: true,
    position: true,
    required: true,
    options: true,
} as const;

const entrySelect = {
    id: true,
    position: true,
    data: true,
} as const;

type ColumnRow = {
    id: string;
    label: string;
    kind: string;
    position: number;
    required: boolean;
    options: string | null;
};

type EntryRow = {
    id: string;
    position: number;
    data: unknown;
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

function toColumn(row: ColumnRow): TableColumn {
    return {
        id: row.id,
        label: row.label,
        kind: asColumnKind(row.kind),
        position: row.position,
        required: row.required,
        options: splitColumnOptions(row.options ?? ''),
    };
}

function toEntry(row: EntryRow): TableEntry {
    return {
        id: row.id,
        position: row.position,
        data: asStoredValues(row.data),
    };
}

export const fetchTableColumns = createServerFn({ method: 'GET' })
    .validator(pageInput)
    .handler(async ({ data }): Promise<Array<TableColumn>> => {
        const userId = await currentUserId();

        if (!userId) return [];

        const rows = await prisma.tableColumn.findMany({
            where: { userId, pageId: data.pageId },
            orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
            select: columnSelect,
        });

        return rows.map(toColumn);
    });

export const createTableColumn = createServerFn({ method: 'POST' })
    .validator(createColumnInput)
    .handler(async ({ data }): Promise<TableColumn> => {
        const userId = await currentUserId();

        if (!userId) throw new Error('Not signed in');

        await assertOwnedPage(userId, data.pageId);

        if (data.kind === 'select' && data.options.length === 0) {
            throw new Error('A choice column needs at least one choice');
        }

        const count = await prisma.tableColumn.count({
            where: { userId, pageId: data.pageId },
        });

        if (count >= maxTableColumns) throw new Error('Too many columns');

        const last = await prisma.tableColumn.findFirst({
            where: { userId, pageId: data.pageId },
            orderBy: { position: 'desc' },
            select: { position: true },
        });

        const row = await prisma.tableColumn.create({
            data: {
                userId,
                pageId: data.pageId,
                label: data.label,
                kind: data.kind,
                required: data.required,
                options:
                    data.options.length === 0
                        ? null
                        : joinColumnOptions(data.options),
                position: last ? last.position + 1 : 0,
            },
            select: columnSelect,
        });

        return toColumn(row);
    });

export const updateTableColumn = createServerFn({ method: 'POST' })
    .validator(updateColumnInput)
    .handler(async ({ data }): Promise<void> => {
        const userId = await currentUserId();

        if (!userId) throw new Error('Not signed in');

        const existing = await prisma.tableColumn.findFirst({
            where: { id: data.id, userId },
            select: { id: true, kind: true },
        });

        if (!existing) throw new Error('Column not found');

        if (existing.kind === 'select' && data.options.length === 0) {
            throw new Error('A choice column needs at least one choice');
        }

        await prisma.tableColumn.update({
            where: { id: existing.id },
            data: {
                label: data.label,
                required: data.required,
                options:
                    data.options.length === 0
                        ? null
                        : joinColumnOptions(data.options),
            },
        });
    });

export const deleteTableColumn = createServerFn({ method: 'POST' })
    .validator(idInput)
    .handler(async ({ data }): Promise<void> => {
        const userId = await currentUserId();

        if (!userId) throw new Error('Not signed in');

        const column = await prisma.tableColumn.findFirst({
            where: { id: data.id, userId },
            select: { id: true, pageId: true },
        });

        if (!column) throw new Error('Column not found');

        const rows = await prisma.tableEntry.findMany({
            where: { userId, pageId: column.pageId },
            select: entrySelect,
        });

        const stripped = rows
            .map(toEntry)
            .filter((entry) => column.id in entry.data)
            .map((entry) => ({
                id: entry.id,
                data: stripColumnValues(entry.data, column.id),
            }));

        await prisma.$transaction([
            prisma.tableColumn.delete({ where: { id: column.id } }),
            ...stripped.map((entry) =>
                prisma.tableEntry.update({
                    where: { id: entry.id },
                    data: { data: entry.data },
                })
            ),
        ]);
    });

export const reorderTableColumns = createServerFn({ method: 'POST' })
    .validator(reorderInput)
    .handler(async ({ data }): Promise<void> => {
        const userId = await currentUserId();

        if (!userId) throw new Error('Not signed in');

        await assertOwnedPage(userId, data.pageId);

        await prisma.$transaction(
            data.ids.map((id, index) =>
                prisma.tableColumn.updateMany({
                    where: { id, userId, pageId: data.pageId },
                    data: { position: index },
                })
            )
        );
    });

export const fetchTableEntries = createServerFn({ method: 'GET' })
    .validator(pageInput)
    .handler(async ({ data }): Promise<Array<TableEntry>> => {
        const userId = await currentUserId();

        if (!userId) return [];

        const rows = await prisma.tableEntry.findMany({
            where: { userId, pageId: data.pageId },
            orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
            select: entrySelect,
        });

        return rows.map(toEntry);
    });

export const createTableEntry = createServerFn({ method: 'POST' })
    .validator(createEntryInput)
    .handler(async ({ data }): Promise<TableEntry> => {
        const userId = await currentUserId();

        if (!userId) throw new Error('Not signed in');

        await assertOwnedPage(userId, data.pageId);

        const last = await prisma.tableEntry.findFirst({
            where: { userId, pageId: data.pageId },
            orderBy: { position: 'desc' },
            select: { position: true },
        });

        const row = await prisma.tableEntry.create({
            data: {
                userId,
                pageId: data.pageId,
                data: data.data,
                position: last ? last.position + 1 : 0,
            },
            select: entrySelect,
        });

        return toEntry(row);
    });

export const updateTableEntry = createServerFn({ method: 'POST' })
    .validator(updateEntryInput)
    .handler(async ({ data }): Promise<void> => {
        const userId = await currentUserId();

        if (!userId) throw new Error('Not signed in');

        const updated = await prisma.tableEntry.updateMany({
            where: { id: data.id, userId },
            data: { data: data.data },
        });

        if (updated.count === 0) throw new Error('Entry not found');
    });

export const deleteTableEntry = createServerFn({ method: 'POST' })
    .validator(idInput)
    .handler(async ({ data }): Promise<void> => {
        const userId = await currentUserId();

        if (!userId) throw new Error('Not signed in');

        const deleted = await prisma.tableEntry.deleteMany({
            where: { id: data.id, userId },
        });

        if (deleted.count === 0) throw new Error('Entry not found');
    });

export const reorderTableEntries = createServerFn({ method: 'POST' })
    .validator(reorderInput)
    .handler(async ({ data }): Promise<void> => {
        const userId = await currentUserId();

        if (!userId) throw new Error('Not signed in');

        await assertOwnedPage(userId, data.pageId);

        await prisma.$transaction(
            data.ids.map((id, index) =>
                prisma.tableEntry.updateMany({
                    where: { id, userId, pageId: data.pageId },
                    data: { position: index },
                })
            )
        );
    });

export const tableColumnsQueryKey = (pageId: string): Array<string> => [
    'table-columns',
    pageId,
];

export const tableColumnsQueryOptions = (pageId: string) =>
    queryOptions({
        queryKey: tableColumnsQueryKey(pageId),
        queryFn: () => fetchTableColumns({ data: { pageId } }),
    });

export const tableEntriesQueryKey = (pageId: string): Array<string> => [
    'table-entries',
    pageId,
];

export const tableEntriesQueryOptions = (pageId: string) =>
    queryOptions({
        queryKey: tableEntriesQueryKey(pageId),
        queryFn: () => fetchTableEntries({ data: { pageId } }),
    });

function reorderByIds<TItem extends { id: string; position: number }>(
    current: Array<TItem> | undefined,
    ids: Array<string>
): Array<TItem> {
    const byId = new Map((current ?? []).map((item) => [item.id, item]));

    return ids
        .map((id, index) => {
            const item = byId.get(id);

            return item === undefined
                ? undefined
                : { ...item, position: index };
        })
        .filter((item): item is TItem => item !== undefined);
}

export function useTableColumns(pageId: string): TableColumnStore {
    const queryClient = useQueryClient();
    const key = tableColumnsQueryKey(pageId);

    const { data, isPending } = useQuery(tableColumnsQueryOptions(pageId));

    const invalidate = () => queryClient.invalidateQueries({ queryKey: key });

    const create = useMutation({
        mutationFn: (draft: TableColumnDraft) =>
            createTableColumn({ data: { pageId, ...draft } }),
        onSettled: invalidate,
    });

    const update = useMutation({
        mutationFn: (values: { id: string } & TableColumnEdit) =>
            updateTableColumn({ data: values }),
        onMutate: (values) => {
            queryClient.setQueryData<Array<TableColumn>>(key, (current) =>
                (current ?? []).map((column) =>
                    column.id === values.id
                        ? {
                              ...column,
                              label: values.label,
                              required: values.required,
                              options: values.options,
                          }
                        : column
                )
            );
        },
        onSettled: invalidate,
    });

    const remove = useMutation({
        mutationFn: (id: string) => deleteTableColumn({ data: { id } }),
        onMutate: (id) => {
            queryClient.setQueryData<Array<TableColumn>>(key, (current) =>
                (current ?? []).filter((column) => column.id !== id)
            );
        },
        onSettled: async () => {
            await queryClient.invalidateQueries({
                queryKey: tableEntriesQueryKey(pageId),
            });

            await invalidate();
        },
    });

    const reorder = useMutation({
        mutationFn: (ids: Array<string>) =>
            reorderTableColumns({ data: { pageId, ids } }),
        onMutate: (ids) => {
            queryClient.setQueryData<Array<TableColumn>>(key, (current) =>
                reorderByIds(current, ids)
            );
        },
        onSettled: invalidate,
    });

    return {
        columns: data ?? [],
        isPending,
        create: async (draft) => {
            await create.mutateAsync(draft);
        },
        update: async (id, edit) => {
            await update.mutateAsync({ id, ...edit });
        },
        remove: async (id) => {
            await remove.mutateAsync(id);
        },
        reorder: async (ids) => {
            await reorder.mutateAsync(ids);
        },
    };
}

export function useTableEntries(pageId: string): TableEntryStore {
    const queryClient = useQueryClient();
    const key = tableEntriesQueryKey(pageId);

    const { data, isPending } = useQuery(tableEntriesQueryOptions(pageId));

    const invalidate = () => queryClient.invalidateQueries({ queryKey: key });

    const create = useMutation({
        mutationFn: (values: StoredWidgetValues) =>
            createTableEntry({ data: { pageId, data: values } }),
        onSettled: invalidate,
    });

    const update = useMutation({
        mutationFn: (values: { id: string; data: StoredWidgetValues }) =>
            updateTableEntry({ data: values }),
        onMutate: (values) => {
            queryClient.setQueryData<Array<TableEntry>>(key, (current) =>
                (current ?? []).map((entry) =>
                    entry.id === values.id
                        ? { ...entry, data: values.data }
                        : entry
                )
            );
        },
        onSettled: invalidate,
    });

    const remove = useMutation({
        mutationFn: (id: string) => deleteTableEntry({ data: { id } }),
        onMutate: (id) => {
            queryClient.setQueryData<Array<TableEntry>>(key, (current) =>
                (current ?? []).filter((entry) => entry.id !== id)
            );
        },
        onSettled: invalidate,
    });

    const reorder = useMutation({
        mutationFn: (ids: Array<string>) =>
            reorderTableEntries({ data: { pageId, ids } }),
        onMutate: (ids) => {
            queryClient.setQueryData<Array<TableEntry>>(key, (current) =>
                reorderByIds(current, ids)
            );
        },
        onSettled: invalidate,
    });

    return {
        entries: data ?? [],
        isPending,
        create: async (values) => {
            await create.mutateAsync(values);
        },
        update: async (id, values) => {
            await update.mutateAsync({ id, data: values });
        },
        remove: async (id) => {
            await remove.mutateAsync(id);
        },
        reorder: async (ids) => {
            await reorder.mutateAsync(ids);
        },
    };
}

import { useMemo } from 'react';
import { queryOptions, useQuery } from '@tanstack/react-query';
import { createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { z } from 'zod';

import { prisma } from '#/db';
import { auth } from '#/lib/auth';

import type { PrismaClient } from '#/generated/prisma/client';

export interface PageNode {
    id: string;
    title: string;
    slug: string;
    position: number;
    parentId: string | null;
}

export interface PageTreeNode extends PageNode {
    children: Array<PageTreeNode>;
}

export const slugTakenError = 'SLUG_TAKEN';
export const cycleError = 'PAGE_CYCLE';

const createPageInput = z.object({
    title: z.string().min(1),
    slug: z.string().min(1),
    position: z.number().int().min(0).optional(),
    parentId: z.string().min(1).nullable(),
});

const movePageInput = z.object({
    id: z.string().min(1),
    position: z.number().int().min(0),
    parentId: z.string().min(1).nullable(),
});

const updatePageInput = z.object({
    id: z.string().min(1),
    title: z.string().min(1),
    slug: z.string().min(1),
    position: z.number().int().min(0),
    parentId: z.string().min(1).nullable(),
});

const deletePageInput = z.object({
    id: z.string().min(1),
});

type TransactionClient = Omit<
    PrismaClient,
    '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

const stagedPosition = -1;
const stagingOffset = -2;

const pageSelect = {
    id: true,
    title: true,
    slug: true,
    position: true,
    parentId: true,
} as const;

async function currentUserId(): Promise<string | null> {
    const { headers } = getRequest();
    const session = await auth.api.getSession({ headers });

    return session?.user.id ?? null;
}

async function siblingIds(
    tx: TransactionClient,
    userId: string,
    parentId: string | null,
    excludeId?: string
): Promise<Array<string>> {
    const siblings = await tx.page.findMany({
        where: {
            userId,
            parentId,
            ...(excludeId ? { id: { not: excludeId } } : {}),
        },
        orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
        select: { id: true },
    });

    return siblings.map((sibling) => sibling.id);
}

async function applyOrder(
    tx: TransactionClient,
    ids: Array<string>
): Promise<void> {
    for (const [index, id] of ids.entries()) {
        await tx.page.update({
            where: { id },
            data: { position: stagingOffset - index },
        });
    }

    for (const [index, id] of ids.entries()) {
        await tx.page.update({ where: { id }, data: { position: index } });
    }
}

async function listPages(
    tx: TransactionClient,
    userId: string
): Promise<Array<PageNode>> {
    return tx.page.findMany({
        where: { userId },
        orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
        select: pageSelect,
    });
}

async function assertParentExists(
    tx: TransactionClient,
    userId: string,
    parentId: string | null
): Promise<void> {
    if (!parentId) return;

    const parent = await tx.page.findFirst({
        where: { id: parentId, userId },
        select: { id: true },
    });

    if (!parent) throw new Error('Parent page not found');
}

async function isSelfOrDescendant(
    tx: TransactionClient,
    userId: string,
    candidateId: string | null,
    ancestorId: string
): Promise<boolean> {
    let current = candidateId;

    while (current) {
        if (current === ancestorId) return true;

        const node = await tx.page.findFirst({
            where: { id: current, userId },
            select: { parentId: true },
        });

        current = node?.parentId ?? null;
    }

    return false;
}

export const fetchPages = createServerFn({ method: 'GET' }).handler(
    async (): Promise<Array<PageNode>> => {
        const userId = await currentUserId();

        if (!userId) return [];

        return listPages(prisma, userId);
    }
);

export const createPage = createServerFn({ method: 'POST' })
    .validator(createPageInput)
    .handler(async ({ data }): Promise<PageNode> => {
        const userId = await currentUserId();

        if (!userId) throw new Error('Not signed in');

        return prisma.$transaction(async (tx) => {
            await assertParentExists(tx, userId, data.parentId);

            const taken = await tx.page.findUnique({
                where: { userId_slug: { userId, slug: data.slug } },
                select: { id: true },
            });

            if (taken) throw new Error(slugTakenError);

            const siblings = await siblingIds(tx, userId, data.parentId);
            const index = Math.min(
                data.position ?? siblings.length,
                siblings.length
            );

            const created = await tx.page.create({
                data: {
                    userId,
                    title: data.title,
                    slug: data.slug,
                    position: stagedPosition,
                    parentId: data.parentId,
                },
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    parentId: true,
                },
            });

            siblings.splice(index, 0, created.id);
            await applyOrder(tx, siblings);

            return { ...created, position: index };
        });
    });

export const movePage = createServerFn({ method: 'POST' })
    .validator(movePageInput)
    .handler(async ({ data }): Promise<Array<PageNode>> => {
        const userId = await currentUserId();

        if (!userId) throw new Error('Not signed in');

        return prisma.$transaction(async (tx) => {
            const page = await tx.page.findFirst({
                where: { id: data.id, userId },
                select: { id: true, parentId: true },
            });

            if (!page) throw new Error('Page not found');

            await assertParentExists(tx, userId, data.parentId);

            if (await isSelfOrDescendant(tx, userId, data.parentId, page.id)) {
                throw new Error(cycleError);
            }

            const target = await siblingIds(tx, userId, data.parentId, page.id);
            const index = Math.min(data.position, target.length);

            if (page.parentId !== data.parentId) {
                await tx.page.update({
                    where: { id: page.id },
                    data: { parentId: data.parentId, position: stagedPosition },
                });

                await applyOrder(
                    tx,
                    await siblingIds(tx, userId, page.parentId, page.id)
                );
            }

            target.splice(index, 0, page.id);
            await applyOrder(tx, target);

            return listPages(tx, userId);
        });
    });

export const updatePage = createServerFn({ method: 'POST' })
    .validator(updatePageInput)
    .handler(async ({ data }): Promise<Array<PageNode>> => {
        const userId = await currentUserId();

        if (!userId) throw new Error('Not signed in');

        return prisma.$transaction(async (tx) => {
            const page = await tx.page.findFirst({
                where: { id: data.id, userId },
                select: { id: true, parentId: true },
            });

            if (!page) throw new Error('Page not found');

            await assertParentExists(tx, userId, data.parentId);

            if (await isSelfOrDescendant(tx, userId, data.parentId, page.id)) {
                throw new Error(cycleError);
            }

            const taken = await tx.page.findUnique({
                where: { userId_slug: { userId, slug: data.slug } },
                select: { id: true },
            });

            if (taken && taken.id !== page.id) throw new Error(slugTakenError);

            await tx.page.update({
                where: { id: page.id },
                data: {
                    title: data.title,
                    slug: data.slug,
                    parentId: data.parentId,
                    position: stagedPosition,
                },
            });

            if (page.parentId !== data.parentId) {
                await applyOrder(
                    tx,
                    await siblingIds(tx, userId, page.parentId, page.id)
                );
            }

            const target = await siblingIds(tx, userId, data.parentId, page.id);
            const index = Math.min(data.position, target.length);

            target.splice(index, 0, page.id);
            await applyOrder(tx, target);

            return listPages(tx, userId);
        });
    });

export const deletePage = createServerFn({ method: 'POST' })
    .validator(deletePageInput)
    .handler(async ({ data }): Promise<Array<PageNode>> => {
        const userId = await currentUserId();

        if (!userId) throw new Error('Not signed in');

        return prisma.$transaction(async (tx) => {
            const page = await tx.page.findFirst({
                where: { id: data.id, userId },
                select: { id: true, parentId: true },
            });

            if (!page) throw new Error('Page not found');

            await tx.page.delete({ where: { id: page.id } });
            await applyOrder(tx, await siblingIds(tx, userId, page.parentId));

            return listPages(tx, userId);
        });
    });

export const pagesQueryKey = ['pages'] as const;

export const pagesQueryOptions = () =>
    queryOptions({
        queryKey: pagesQueryKey,
        queryFn: () => fetchPages(),
    });

export function buildPageTree(pages: Array<PageNode>): Array<PageTreeNode> {
    const nodes = new Map<string, PageTreeNode>(
        pages.map((page) => [page.id, { ...page, children: [] }])
    );

    const roots: Array<PageTreeNode> = [];

    for (const page of pages) {
        const node = nodes.get(page.id);

        if (!node) continue;

        const parent = page.parentId ? nodes.get(page.parentId) : undefined;

        if (parent) parent.children.push(node);
        else roots.push(node);
    }

    return roots;
}

export function descendantIds(
    pages: Array<PageNode>,
    id: string
): Array<string> {
    return pages
        .filter((page) => page.parentId === id)
        .flatMap((page) => [page.id, ...descendantIds(pages, page.id)]);
}

export function usePageList(): Array<PageNode> {
    const { data } = useQuery(pagesQueryOptions());

    return data ?? [];
}

export function usePages(): Array<PageTreeNode> {
    const { data } = useQuery(pagesQueryOptions());

    return useMemo(() => buildPageTree(data ?? []), [data]);
}

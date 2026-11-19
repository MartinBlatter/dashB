import { queryOptions, useQuery } from '@tanstack/react-query';
import { createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { z } from 'zod';

import { prisma } from '#/db';
import { auth } from '#/lib/auth';

export interface Article {
    content: string;
}

export const maxArticleContentLength = 4_000_000;

const pageInput = z.object({
    pageId: z.string().min(1),
});

const saveArticleInput = z.object({
    pageId: z.string().min(1),
    content: z.string().max(maxArticleContentLength),
});

const emptyArticle: Article = { content: '' };

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

export const fetchArticle = createServerFn({ method: 'GET' })
    .validator(pageInput)
    .handler(async ({ data }): Promise<Article> => {
        const userId = await currentUserId();

        if (!userId) return emptyArticle;

        const article = await prisma.article.findFirst({
            where: { pageId: data.pageId, userId },
            select: { content: true },
        });

        return article ?? emptyArticle;
    });

export const saveArticle = createServerFn({ method: 'POST' })
    .validator(saveArticleInput)
    .handler(async ({ data }): Promise<void> => {
        const userId = await currentUserId();

        if (!userId) throw new Error('Not signed in');

        await assertOwnedPage(userId, data.pageId);

        await prisma.article.upsert({
            where: { pageId: data.pageId },
            create: { userId, pageId: data.pageId, content: data.content },
            update: { content: data.content },
        });
    });

export const articleQueryKey = (pageId: string): Array<string> => [
    'article',
    pageId,
];

export const articleQueryOptions = (pageId: string) =>
    queryOptions({
        queryKey: articleQueryKey(pageId),
        queryFn: () => fetchArticle({ data: { pageId } }),
    });

export function useArticle(pageId: string): Article {
    const { data } = useQuery(articleQueryOptions(pageId));

    return data ?? emptyArticle;
}

export function useArticlePending(pageId: string): boolean {
    const { isPending } = useQuery(articleQueryOptions(pageId));

    return isPending;
}

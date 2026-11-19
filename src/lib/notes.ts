import { queryOptions, useQuery } from '@tanstack/react-query';
import { createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { z } from 'zod';

import { prisma } from '#/db';
import { auth } from '#/lib/auth';

export interface Note {
    id: string;
    title: string;
    content: string;
    x: number;
    y: number;
    w: number;
    h: number;
}

export const maxNoteContentLength = 4_000_000;
export const maxNoteTitleLength = 200;

const pageInput = z.object({
    pageId: z.string().min(1),
});

const createNoteInput = z.object({
    pageId: z.string().min(1),
    title: z.string().min(1).max(maxNoteTitleLength),
    w: z.number().int().min(1).max(12).optional(),
    h: z.number().int().min(1).max(40).optional(),
});

const updateNoteInput = z.object({
    id: z.string().min(1),
    title: z.string().max(maxNoteTitleLength),
    content: z.string().max(maxNoteContentLength),
});

const deleteNoteInput = z.object({
    id: z.string().min(1),
});

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

const noteSelect = {
    id: true,
    title: true,
    content: true,
    x: true,
    y: true,
    w: true,
    h: true,
} as const;

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

export const fetchNotes = createServerFn({ method: 'GET' })
    .validator(pageInput)
    .handler(async ({ data }): Promise<Array<Note>> => {
        const userId = await currentUserId();

        if (!userId) return [];

        return prisma.note.findMany({
            where: { userId, pageId: data.pageId },
            orderBy: [{ y: 'asc' }, { x: 'asc' }, { createdAt: 'asc' }],
            select: noteSelect,
        });
    });

export const createNote = createServerFn({ method: 'POST' })
    .validator(createNoteInput)
    .handler(async ({ data }): Promise<Note> => {
        const userId = await currentUserId();

        if (!userId) throw new Error('Not signed in');

        await assertOwnedPage(userId, data.pageId);

        const lowest = await prisma.note.findFirst({
            where: { userId, pageId: data.pageId },
            orderBy: { y: 'desc' },
            select: { y: true, h: true },
        });

        return prisma.note.create({
            data: {
                userId,
                pageId: data.pageId,
                title: data.title,
                x: 0,
                y: lowest ? lowest.y + lowest.h : 0,
                ...(data.w === undefined ? {} : { w: data.w }),
                ...(data.h === undefined ? {} : { h: data.h }),
            },
            select: noteSelect,
        });
    });

export const updateNote = createServerFn({ method: 'POST' })
    .validator(updateNoteInput)
    .handler(async ({ data }): Promise<void> => {
        const userId = await currentUserId();

        if (!userId) throw new Error('Not signed in');

        const updated = await prisma.note.updateMany({
            where: { id: data.id, userId },
            data: { title: data.title, content: data.content },
        });

        if (updated.count === 0) throw new Error('Note not found');
    });

export const deleteNote = createServerFn({ method: 'POST' })
    .validator(deleteNoteInput)
    .handler(async ({ data }): Promise<void> => {
        const userId = await currentUserId();

        if (!userId) throw new Error('Not signed in');

        const deleted = await prisma.note.deleteMany({
            where: { id: data.id, userId },
        });

        if (deleted.count === 0) throw new Error('Note not found');
    });

export const saveNotesLayout = createServerFn({ method: 'POST' })
    .validator(saveLayoutInput)
    .handler(async ({ data }): Promise<void> => {
        const userId = await currentUserId();

        if (!userId) throw new Error('Not signed in');

        await prisma.$transaction(
            data.items.map((item) =>
                prisma.note.updateMany({
                    where: { id: item.id, userId },
                    data: { x: item.x, y: item.y, w: item.w, h: item.h },
                })
            )
        );
    });

export const notesQueryKey = (pageId: string): Array<string> => [
    'notes',
    pageId,
];

export const notesQueryOptions = (pageId: string) =>
    queryOptions({
        queryKey: notesQueryKey(pageId),
        queryFn: () => fetchNotes({ data: { pageId } }),
    });

export function useNotes(pageId: string): Array<Note> {
    const { data } = useQuery(notesQueryOptions(pageId));

    return data ?? [];
}

export function useNotesPending(pageId: string): boolean {
    const { isPending } = useQuery(notesQueryOptions(pageId));

    return isPending;
}

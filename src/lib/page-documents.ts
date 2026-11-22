import { useEffect, useState } from 'react';
import {
    queryOptions,
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';
import { createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { z } from 'zod';

import { prisma } from '#/db';
import { auth } from '#/lib/auth';

export const documentKinds = ['folder', 'file'] as const;

export type DocumentKind = (typeof documentKinds)[number];

export type DocumentPreviewKind = 'image' | 'pdf' | 'text' | 'audio' | 'video';

export const maxDocumentNameLength = 200;
export const maxDocumentFileSize = 25 * 1024 * 1024;
export const maxDocumentsPerPage = 2000;
export const fallbackMimeType = 'application/octet-stream';

export interface DocumentNode {
    id: string;
    parentId: string | null;
    kind: DocumentKind;
    name: string;
    mimeType: string | null;
    size: number;
    updatedAt: Date;
}

export function asDocumentKind(value: unknown): DocumentKind {
    return documentKinds.find((kind) => kind === value) ?? 'file';
}

function isPrintable(char: string): boolean {
    const code = char.codePointAt(0) ?? 0;

    return code > 31 && code !== 127;
}

export function normalizeDocumentName(raw: string): string | null {
    const name = [...raw].filter(isPrintable).join('').trim();

    if (name === '' || name.length > maxDocumentNameLength) return null;
    if (name === '.' || name === '..') return null;
    if (name.includes('/') || name.includes('\\')) return null;

    return name;
}

const mimePattern = /^[a-z0-9][a-z0-9.+-]*\/[a-z0-9][a-z0-9.+-]*$/;

export function normalizeMimeType(raw: string | null | undefined): string {
    const value = (raw ?? '').split(';')[0].trim().toLowerCase();

    return mimePattern.test(value) ? value : fallbackMimeType;
}

export const imageMimeTypes = [
    'image/png',
    'image/jpeg',
    'image/gif',
    'image/webp',
    'image/avif',
    'image/bmp',
] as const;

const previewImageTypes: ReadonlySet<string> = new Set(imageMimeTypes);

const previewTextTypes: ReadonlySet<string> = new Set([
    'text/plain',
    'text/markdown',
    'text/csv',
]);

export function documentPreviewKind(
    mimeType: string | null
): DocumentPreviewKind | null {
    if (mimeType === null) return null;
    if (previewImageTypes.has(mimeType)) return 'image';
    if (mimeType === 'application/pdf') return 'pdf';
    if (previewTextTypes.has(mimeType)) return 'text';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.startsWith('video/')) return 'video';

    return null;
}

export function splitDocumentName(name: string): {
    stem: string;
    extension: string;
} {
    const dot = name.lastIndexOf('.');

    if (dot <= 0 || dot === name.length - 1) {
        return { stem: name, extension: '' };
    }

    return { stem: name.slice(0, dot), extension: name.slice(dot) };
}

export function uniqueDocumentName(
    name: string,
    taken: ReadonlySet<string>
): string {
    if (!taken.has(name)) return name;

    const { stem, extension } = splitDocumentName(name);

    for (let suffix = 2; suffix <= 999; suffix += 1) {
        const candidate = `${stem} (${suffix})${extension}`;

        if (!taken.has(candidate)) return candidate;
    }

    return `${stem} (${Date.now()})${extension}`;
}

export const documentsApiBase = '/api/documents';
export const documentUploadUrl = `${documentsApiBase}/upload`;

export function documentFileUrl(id: string): string {
    return `${documentsApiBase}/${encodeURIComponent(id)}`;
}

export function documentDownloadUrl(id: string): string {
    return `${documentsApiBase}/${encodeURIComponent(id)}/download`;
}

const pageInput = z.object({
    pageId: z.string().min(1),
});

const nameSchema = z.string().min(1).max(maxDocumentNameLength);

const createFolderInput = z.object({
    pageId: z.string().min(1),
    parentId: z.string().min(1).nullable(),
    name: nameSchema,
});

const renameInput = z.object({
    id: z.string().min(1),
    name: nameSchema,
});

const moveInput = z.object({
    id: z.string().min(1),
    parentId: z.string().min(1).nullable(),
});

const idInput = z.object({
    id: z.string().min(1),
});

const nodeSelect = {
    id: true,
    parentId: true,
    kind: true,
    name: true,
    mimeType: true,
    size: true,
    updatedAt: true,
} as const;

type NodeRow = {
    id: string;
    parentId: string | null;
    kind: string;
    name: string;
    mimeType: string | null;
    size: number;
    updatedAt: Date;
};

function toNode(row: NodeRow): DocumentNode {
    return {
        id: row.id,
        parentId: row.parentId,
        kind: asDocumentKind(row.kind),
        name: row.name,
        mimeType: row.mimeType,
        size: row.size,
        updatedAt: row.updatedAt,
    };
}

async function currentUserId(): Promise<string | null> {
    const { headers } = getRequest();
    const session = await auth.api.getSession({ headers });

    return session?.user.id ?? null;
}

async function ownedPage(userId: string, pageId: string): Promise<void> {
    const page = await prisma.page.findFirst({
        where: { id: pageId, userId },
        select: { id: true },
    });

    if (!page) throw new Error('Page not found');
}

async function ownedFolder(
    userId: string,
    pageId: string,
    parentId: string | null
): Promise<void> {
    if (parentId === null) return;

    const folder = await prisma.document.findFirst({
        where: { id: parentId, userId, pageId, kind: 'folder' },
        select: { id: true },
    });

    if (!folder) throw new Error('Folder not found');
}

async function takenNames(
    userId: string,
    pageId: string,
    parentId: string | null,
    exceptId?: string
): Promise<Set<string>> {
    const rows = await prisma.document.findMany({
        where: {
            userId,
            pageId,
            parentId,
            ...(exceptId === undefined ? {} : { id: { not: exceptId } }),
        },
        select: { name: true },
    });

    return new Set(rows.map((row) => row.name));
}

export const fetchDocuments = createServerFn({ method: 'GET' })
    .validator(pageInput)
    .handler(async ({ data }): Promise<Array<DocumentNode>> => {
        const userId = await currentUserId();

        if (!userId) return [];

        const rows = await prisma.document.findMany({
            where: { userId, pageId: data.pageId },
            orderBy: [{ name: 'asc' }, { createdAt: 'asc' }],
            select: nodeSelect,
        });

        return rows.map(toNode);
    });

export const createDocumentFolder = createServerFn({ method: 'POST' })
    .validator(createFolderInput)
    .handler(async ({ data }): Promise<DocumentNode> => {
        const userId = await currentUserId();

        if (!userId) throw new Error('Not signed in');

        const name = normalizeDocumentName(data.name);

        if (name === null) throw new Error('Invalid name');

        await ownedPage(userId, data.pageId);
        await ownedFolder(userId, data.pageId, data.parentId);

        const count = await prisma.document.count({
            where: { userId, pageId: data.pageId },
        });

        if (count >= maxDocumentsPerPage) throw new Error('Too many documents');

        const taken = await takenNames(userId, data.pageId, data.parentId);

        if (taken.has(name)) throw new Error('Name already used');

        const row = await prisma.document.create({
            data: {
                userId,
                pageId: data.pageId,
                parentId: data.parentId,
                kind: 'folder',
                name,
            },
            select: nodeSelect,
        });

        return toNode(row);
    });

export const renameDocument = createServerFn({ method: 'POST' })
    .validator(renameInput)
    .handler(async ({ data }): Promise<void> => {
        const userId = await currentUserId();

        if (!userId) throw new Error('Not signed in');

        const name = normalizeDocumentName(data.name);

        if (name === null) throw new Error('Invalid name');

        const node = await prisma.document.findFirst({
            where: { id: data.id, userId },
            select: { id: true, pageId: true, parentId: true },
        });

        if (!node) throw new Error('Document not found');

        const taken = await takenNames(
            userId,
            node.pageId,
            node.parentId,
            node.id
        );

        if (taken.has(name)) throw new Error('Name already used');

        await prisma.document.update({
            where: { id: node.id },
            data: { name },
        });
    });

export const moveDocument = createServerFn({ method: 'POST' })
    .validator(moveInput)
    .handler(async ({ data }): Promise<void> => {
        const userId = await currentUserId();

        if (!userId) throw new Error('Not signed in');

        const node = await prisma.document.findFirst({
            where: { id: data.id, userId },
            select: { id: true, pageId: true, parentId: true, name: true },
        });

        if (!node) throw new Error('Document not found');
        if (node.parentId === data.parentId) return;
        if (node.id === data.parentId) throw new Error('Invalid target');

        await ownedFolder(userId, node.pageId, data.parentId);

        const rows = await prisma.document.findMany({
            where: { userId, pageId: node.pageId },
            select: { id: true, parentId: true },
        });

        if (isDescendant(rows, node.id, data.parentId)) {
            throw new Error('Invalid target');
        }

        const taken = await takenNames(
            userId,
            node.pageId,
            data.parentId,
            node.id
        );

        if (taken.has(node.name)) throw new Error('Name already used');

        await prisma.document.update({
            where: { id: node.id },
            data: { parentId: data.parentId },
        });
    });

export const deleteDocument = createServerFn({ method: 'POST' })
    .validator(idInput)
    .handler(async ({ data }): Promise<void> => {
        const userId = await currentUserId();

        if (!userId) throw new Error('Not signed in');

        const deleted = await prisma.document.deleteMany({
            where: { id: data.id, userId },
        });

        if (deleted.count === 0) throw new Error('Document not found');
    });

export function isDescendant(
    nodes: ReadonlyArray<{ id: string; parentId: string | null }>,
    ancestorId: string,
    candidateId: string | null
): boolean {
    const parents = new Map(nodes.map((node) => [node.id, node.parentId]));

    let current = candidateId;

    for (let steps = 0; steps < parents.size + 1; steps += 1) {
        if (current === null) return false;
        if (current === ancestorId) return true;

        current = parents.get(current) ?? null;
    }

    return false;
}

export async function uploadDocumentFile(input: {
    pageId: string;
    parentId: string | null;
    file: File;
}): Promise<void> {
    const body = new FormData();

    body.set('pageId', input.pageId);
    body.set('file', input.file, input.file.name);

    if (input.parentId !== null) body.set('parentId', input.parentId);

    const response = await fetch(documentUploadUrl, { method: 'POST', body });

    if (!response.ok) throw new Error('Upload failed');
}

export const documentsQueryKey = (pageId: string): Array<string> => [
    'documents',
    pageId,
];

export const documentsQueryOptions = (pageId: string) =>
    queryOptions({
        queryKey: documentsQueryKey(pageId),
        queryFn: () => fetchDocuments({ data: { pageId } }),
    });

export interface DocumentStore {
    nodes: Array<DocumentNode>;
    isPending: boolean;
    uploading: boolean;
    createFolder: (
        parentId: string | null,
        name: string
    ) => Promise<DocumentNode>;
    rename: (id: string, name: string) => Promise<void>;
    move: (id: string, parentId: string | null) => Promise<void>;
    remove: (id: string) => Promise<void>;
    upload: (
        parentId: string | null,
        files: ReadonlyArray<File>
    ) => Promise<void>;
}

export function useDocuments(pageId: string): DocumentStore {
    const queryClient = useQueryClient();
    const key = documentsQueryKey(pageId);

    const { data, isPending } = useQuery(documentsQueryOptions(pageId));

    const invalidate = () => queryClient.invalidateQueries({ queryKey: key });

    const createFolder = useMutation({
        mutationFn: (values: { parentId: string | null; name: string }) =>
            createDocumentFolder({ data: { pageId, ...values } }),
        onSettled: invalidate,
    });

    const rename = useMutation({
        mutationFn: (values: { id: string; name: string }) =>
            renameDocument({ data: values }),
        onMutate: (values) => {
            queryClient.setQueryData<Array<DocumentNode>>(key, (current) =>
                (current ?? []).map((node) =>
                    node.id === values.id
                        ? { ...node, name: values.name }
                        : node
                )
            );
        },
        onSettled: invalidate,
    });

    const move = useMutation({
        mutationFn: (values: { id: string; parentId: string | null }) =>
            moveDocument({ data: values }),
        onMutate: (values) => {
            queryClient.setQueryData<Array<DocumentNode>>(key, (current) =>
                (current ?? []).map((node) =>
                    node.id === values.id
                        ? { ...node, parentId: values.parentId }
                        : node
                )
            );
        },
        onSettled: invalidate,
    });

    const remove = useMutation({
        mutationFn: (id: string) => deleteDocument({ data: { id } }),
        onSettled: invalidate,
    });

    const upload = useMutation({
        mutationFn: async (values: {
            parentId: string | null;
            files: ReadonlyArray<File>;
        }) => {
            for (const file of values.files) {
                await uploadDocumentFile({
                    pageId,
                    parentId: values.parentId,
                    file,
                });
            }
        },
        onSettled: invalidate,
    });

    return {
        nodes: data ?? [],
        isPending,
        uploading: upload.isPending,
        createFolder: (parentId, name) =>
            createFolder.mutateAsync({ parentId, name }),
        rename: async (id, name) => {
            await rename.mutateAsync({ id, name });
        },
        move: async (id, parentId) => {
            await move.mutateAsync({ id, parentId });
        },
        remove: async (id) => {
            await remove.mutateAsync(id);
        },
        upload: async (parentId, files) => {
            await upload.mutateAsync({ parentId, files });
        },
    };
}

export type DocumentFile =
    | { status: 'loading'; url: null }
    | { status: 'ready'; url: string }
    | { status: 'error'; url: null };

const loadingFile: DocumentFile = { status: 'loading', url: null };

export function useDocumentFile(id: string | null): DocumentFile {
    const [file, setFile] = useState<DocumentFile>(loadingFile);

    useEffect(() => {
        setFile(loadingFile);

        if (id === null) return;

        const controller = new AbortController();

        let objectUrl: string | null = null;

        const load = async () => {
            try {
                const response = await fetch(documentFileUrl(id), {
                    signal: controller.signal,
                });

                if (!response.ok) throw new Error(String(response.status));

                objectUrl = URL.createObjectURL(await response.blob());

                setFile({ status: 'ready', url: objectUrl });
            } catch {
                if (!controller.signal.aborted) {
                    setFile({ status: 'error', url: null });
                }
            }
        };

        void load();

        return () => {
            controller.abort();

            if (objectUrl !== null) URL.revokeObjectURL(objectUrl);
        };
    }, [id]);

    return file;
}

export interface BackgroundImageOption {
    id: string;
    name: string;
    size: number;
    pageId: string;
    pageTitle: string;
}

export const maxBackgroundImageOptions = 500;

export const fetchBackgroundImages = createServerFn({ method: 'GET' }).handler(
    async (): Promise<Array<BackgroundImageOption>> => {
        const userId = await currentUserId();

        if (!userId) return [];

        const rows = await prisma.document.findMany({
            where: {
                userId,
                kind: 'file',
                mimeType: { in: [...imageMimeTypes] },
            },
            orderBy: [{ updatedAt: 'desc' }],
            take: maxBackgroundImageOptions,
            select: {
                id: true,
                name: true,
                size: true,
                pageId: true,
                page: { select: { title: true } },
            },
        });

        return rows.map((row) => ({
            id: row.id,
            name: row.name,
            size: row.size,
            pageId: row.pageId,
            pageTitle: row.page.title,
        }));
    }
);

export const backgroundImagesQueryKey = ['background-images'] as const;

export const backgroundImagesQueryOptions = () =>
    queryOptions({
        queryKey: backgroundImagesQueryKey,
        queryFn: () => fetchBackgroundImages(),
    });

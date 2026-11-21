import { prisma } from '#/db';
import { auth } from '#/lib/auth';
import {
    documentPreviewKind,
    documentsApiBase,
    fallbackMimeType,
    maxDocumentFileSize,
    maxDocumentsPerPage,
    normalizeDocumentName,
    normalizeMimeType,
    uniqueDocumentName,
} from '#/lib/page-documents';

export async function handleDocumentRequest(
    request: Request
): Promise<Response> {
    const session = await auth.api.getSession({ headers: request.headers });
    const userId = session?.user.id ?? null;

    if (userId === null) return plain(401, 'Not signed in');

    const segments = requestSegments(request);

    if (request.method === 'POST') {
        if (segments.at(0) !== 'upload') return plain(404, 'Not found');

        return uploadDocument(request, userId);
    }

    const id = segments.at(0) ?? '';
    const tail = segments.at(1);

    if (id === '' || segments.length > 2) return plain(404, 'Not found');
    if (tail !== undefined && tail !== 'download') {
        return plain(404, 'Not found');
    }

    return serveDocument(userId, id, tail === 'download');
}

function requestSegments(request: Request): Array<string> {
    const { pathname } = new URL(request.url);
    const start = pathname.indexOf(documentsApiBase);
    const tail =
        start === -1 ? '' : pathname.slice(start + documentsApiBase.length);

    return tail
        .split('/')
        .filter((segment) => segment !== '')
        .map((segment) => decodeURIComponent(segment));
}

async function serveDocument(
    userId: string,
    id: string,
    download: boolean
): Promise<Response> {
    const row = await prisma.document.findFirst({
        where: { id, userId, kind: 'file' },
        select: { name: true, mimeType: true, content: true },
    });

    if (!row || row.content === null) return plain(404, 'Not found');

    const mimeType = normalizeMimeType(row.mimeType);
    const inline = !download && documentPreviewKind(mimeType) !== null;

    return new Response(row.content, {
        status: 200,
        headers: {
            'content-type': inline
                ? inlineContentType(mimeType)
                : fallbackMimeType,
            'content-length': String(row.content.byteLength),
            'content-disposition': `${inline ? 'inline' : 'attachment'}; filename*=UTF-8''${encodeURIComponent(row.name)}`,
            'cache-control': 'private, no-cache, must-revalidate',
            'x-content-type-options': 'nosniff',
        },
    });
}

function inlineContentType(mimeType: string): string {
    return documentPreviewKind(mimeType) === 'text'
        ? 'text/plain; charset=utf-8'
        : mimeType;
}

async function uploadDocument(
    request: Request,
    userId: string
): Promise<Response> {
    const form = await request.formData();
    const pageId = formString(form, 'pageId');
    const parentId = formString(form, 'parentId');
    const file = form.get('file');

    if (pageId === '' || !(file instanceof File)) {
        return plain(400, 'Bad request');
    }

    if (file.size > maxDocumentFileSize) return plain(413, 'File too large');

    const page = await prisma.page.findFirst({
        where: { id: pageId, userId },
        select: { id: true },
    });

    if (!page) return plain(404, 'Page not found');

    const parent = parentId === '' ? null : parentId;

    if (parent !== null) {
        const folder = await prisma.document.findFirst({
            where: { id: parent, userId, pageId, kind: 'folder' },
            select: { id: true },
        });

        if (!folder) return plain(404, 'Folder not found');
    }

    const count = await prisma.document.count({ where: { userId, pageId } });

    if (count >= maxDocumentsPerPage) return plain(409, 'Too many documents');

    const base = file.name.split(/[\\/]/).pop() ?? '';
    const requested = normalizeDocumentName(base);

    if (requested === null) return plain(400, 'Invalid name');

    const siblings = await prisma.document.findMany({
        where: { userId, pageId, parentId: parent },
        select: { name: true },
    });

    const name = uniqueDocumentName(
        requested,
        new Set(siblings.map((row) => row.name))
    );

    const content = new Uint8Array(await file.arrayBuffer());

    if (content.byteLength > maxDocumentFileSize) {
        return plain(413, 'File too large');
    }

    const row = await prisma.document.create({
        data: {
            userId,
            pageId,
            parentId: parent,
            kind: 'file',
            name,
            mimeType: normalizeMimeType(file.type),
            size: content.byteLength,
            content,
        },
        select: { id: true, name: true },
    });

    return Response.json({ id: row.id, name: row.name }, { status: 201 });
}

function formString(form: FormData, key: string): string {
    const value = form.get(key);

    return typeof value === 'string' ? value : '';
}

function plain(status: number, message: string): Response {
    return new Response(message, {
        status,
        headers: { 'content-type': 'text/plain; charset=utf-8' },
    });
}

import {
    FileArchiveIcon,
    FileAudioIcon,
    FileCodeIcon,
    FileCsvIcon,
    FileDocIcon,
    FileIcon,
    FileImageIcon,
    FilePdfIcon,
    FileTextIcon,
    FileVideoIcon,
    FileXlsIcon,
    FolderIcon,
} from '@phosphor-icons/react';

import {
    documentPreviewKind,
    fallbackMimeType,
    splitDocumentName,
} from '#/lib/page-documents';

import type { Icon } from '@phosphor-icons/react';
import type { DocumentNode } from '#/lib/page-documents';

const sizeUnits = ['B', 'kB', 'MB', 'GB'];

export function formatSize(bytes: number): string {
    let value = Math.max(0, bytes);
    let unit = 0;

    while (value >= 1000 && unit < sizeUnits.length - 1) {
        value /= 1000;
        unit += 1;
    }

    const digits = unit === 0 || value >= 10 ? 0 : 1;

    return `${value.toFixed(digits)} ${sizeUnits.at(unit) ?? 'B'}`;
}

const archiveTypes: ReadonlySet<string> = new Set([
    'application/zip',
    'application/x-7z-compressed',
    'application/x-rar-compressed',
    'application/vnd.rar',
    'application/gzip',
    'application/x-tar',
]);

const docTypes: ReadonlySet<string> = new Set([
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/rtf',
]);

const sheetTypes: ReadonlySet<string> = new Set([
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.oasis.opendocument.spreadsheet',
]);

const codeTypes: ReadonlySet<string> = new Set([
    'application/json',
    'application/xml',
    'text/xml',
    'text/html',
    'text/css',
    'text/javascript',
]);

export function documentIcon(node: DocumentNode): Icon {
    if (node.kind === 'folder') return FolderIcon;

    const mimeType = node.mimeType ?? fallbackMimeType;

    if (mimeType === 'text/csv') return FileCsvIcon;
    if (archiveTypes.has(mimeType)) return FileArchiveIcon;
    if (docTypes.has(mimeType)) return FileDocIcon;
    if (sheetTypes.has(mimeType)) return FileXlsIcon;
    if (codeTypes.has(mimeType)) return FileCodeIcon;

    switch (documentPreviewKind(mimeType)) {
        case 'image':
            return FileImageIcon;
        case 'pdf':
            return FilePdfIcon;
        case 'text':
            return FileTextIcon;
        case 'audio':
            return FileAudioIcon;
        case 'video':
            return FileVideoIcon;
        case null:
            return FileIcon;
    }
}

export function documentTypeLabel(node: DocumentNode): string {
    if (node.mimeType !== null && node.mimeType !== fallbackMimeType) {
        return node.mimeType;
    }

    const { extension } = splitDocumentName(node.name);

    return extension === ''
        ? fallbackMimeType
        : extension.slice(1).toUpperCase();
}

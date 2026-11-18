import { createWidgetMessages } from '#/components/Widgets/i18n';

import type {
    StoredWidgetValues,
    WidgetField,
} from '#/components/Widgets/types';
import type { WidgetRecord } from '#/lib/widget-records';

export const bookmarkCollection = 'bookmarks';

export const t = createWidgetMessages({
    en: {
        label: 'Bookmarks',
        description: 'Quick links to the places you keep going back to.',
        new_tab: 'Open in a new tab',
        columns: 'Columns',
        columns_hint: 'How many links to place side by side',
        title: 'Title',
        title_placeholder: 'What to call this link',
        url: 'Address',
        url_placeholder: 'example.com',
        add_bookmark: 'Add bookmark',
        new_bookmark: 'New bookmark',
        edit_bookmark: 'Edit bookmark',
        save_bookmark: 'Save bookmark',
        delete_bookmark: 'Delete bookmark',
        empty: 'No bookmarks yet.',
        unusable: 'Not a usable web address',
        options: 'Bookmark options',
    },
    de: {
        label: 'Lesezeichen',
        description: 'Schnelle Links zu den Seiten, die du immer wieder nutzt.',
        new_tab: 'In neuem Tab öffnen',
        columns: 'Spalten',
        columns_hint: 'Wie viele Links nebeneinander stehen',
        title: 'Titel',
        title_placeholder: 'Wie dieser Link heißen soll',
        url: 'Adresse',
        url_placeholder: 'example.com',
        add_bookmark: 'Lesezeichen hinzufügen',
        new_bookmark: 'Neues Lesezeichen',
        edit_bookmark: 'Lesezeichen bearbeiten',
        save_bookmark: 'Lesezeichen speichern',
        delete_bookmark: 'Lesezeichen löschen',
        empty: 'Noch keine Lesezeichen.',
        unusable: 'Keine nutzbare Webadresse',
        options: 'Lesezeichen-Optionen',
    },
});

export interface Bookmark {
    id: string;
    title: string;
    url: string;
    href: string | null;
    host: string | null;
}

const schemeWithAuthority = /^[a-z][a-z0-9+.-]*:\/\//i;

const schemePrefix = /^([a-z][a-z0-9+.-]*):(.*)$/i;

export function safeHref(value: unknown): string | null {
    if (typeof value !== 'string') return null;

    const trimmed = value.trim();

    if (trimmed === '') return null;

    let candidate = trimmed;

    if (!schemeWithAuthority.test(trimmed)) {
        const match = schemePrefix.exec(trimmed);

        if (match !== null && !/^\d/.test(match[2])) return null;

        candidate = `https://${trimmed}`;
    }

    let parsed: URL;

    try {
        parsed = new URL(candidate);
    } catch {
        return null;
    }

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return null;
    }

    if (parsed.hostname === '') return null;

    return parsed.toString();
}

export function hostOf(href: string | null): string | null {
    if (href === null) return null;

    try {
        return new URL(href).hostname.replace(/^www\./, '');
    } catch {
        return null;
    }
}

export function initialOf(title: string, host: string | null): string {
    const source = title.trim() === '' ? (host ?? '?') : title.trim();

    return source.slice(0, 1).toLocaleUpperCase();
}

export const bookmarkFields: ReadonlyArray<WidgetField> = [
    {
        kind: 'text',
        name: 'title',
        label: () => t('title'),
        placeholder: () => t('title_placeholder'),
        required: true,
        maxLength: 80,
    },
    {
        kind: 'text',
        name: 'url',
        label: () => t('url'),
        placeholder: () => t('url_placeholder'),
        required: true,
        maxLength: 2000,
    },
];

export function decodeBookmark(record: WidgetRecord): Bookmark {
    const { data } = record;

    const url = typeof data.url === 'string' ? data.url : '';
    const href = safeHref(url);

    return {
        id: record.id,
        title: typeof data.title === 'string' ? data.title : '',
        url,
        href,
        host: hostOf(href),
    };
}

export function encodeBookmark(bookmark: {
    title: string;
    url: string;
}): StoredWidgetValues {
    return {
        title: bookmark.title,
        url: bookmark.url,
    };
}

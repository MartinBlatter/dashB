import { Marked } from 'marked';

import { helpDocByFile } from '#/lib/help-docs';

import type { HelpDoc } from '#/lib/help-docs';

export interface HelpHeading {
    id: string;
    level: number;
    text: string;
}

export interface HelpRender {
    html: string;
    headings: Array<HelpHeading>;
}

interface HelpLink {
    href: string;
    external: boolean;
}

const repoUrl = 'https://github.com/MartinBlatter/dashB';
const repoBranch = 'main';
const minOutlineLevel = 2;
const maxOutlineLevel = 3;
const schemePattern = /^[a-z][a-z\d+.-]*:/i;
const slugStripPattern = /[^\p{L}\p{N} _-]/gu;
const spacePattern = /\s+/g;

export function helpSourceUrl(doc: HelpDoc): string {
    return `${repoUrl}/blob/${repoBranch}/${doc.file}`;
}

export function renderHelpDoc(doc: HelpDoc, markdown: string): HelpRender {
    const headings: Array<HelpHeading> = [];
    const used = new Map<string, number>();
    const dir = docDir(doc.file);

    const parser = new Marked({
        gfm: true,
        renderer: {
            heading(token) {
                const inline = this.parser.parseInline(token.tokens);
                const text = this.parser.parseInline(
                    token.tokens,
                    this.parser.textRenderer
                );
                const id = headingId(text, used);

                if (
                    token.depth >= minOutlineLevel &&
                    token.depth <= maxOutlineLevel
                ) {
                    headings.push({ id, level: token.depth, text });
                }

                return `<h${token.depth} id="${id}">${inline}</h${token.depth}>\n`;
            },
            link(token) {
                const target = helpLink(dir, token.href);
                const inline = this.parser.parseInline(token.tokens);
                const title = token.title ?? '';
                const titleAttr =
                    title.length === 0
                        ? ''
                        : ` title="${escapeAttribute(title)}"`;
                const rel = target.external
                    ? ' target="_blank" rel="noreferrer noopener"'
                    : '';

                return `<a href="${escapeAttribute(target.href)}"${titleAttr}${rel}>${inline}</a>`;
            },
            html() {
                return '';
            },
        },
    });

    return { html: parser.parse(markdown, { async: false }), headings };
}

function helpLink(dir: string, href: string): HelpLink {
    if (schemePattern.test(href) || href.startsWith('//')) {
        return { href, external: true };
    }

    if (href.startsWith('#')) return { href, external: false };

    const [path, fragment] = splitFragment(href);
    const resolved = resolvePath(dir, path);
    const doc = helpDocByFile(resolved);

    if (doc) return { href: `/help/${doc.slug}${fragment}`, external: false };

    const kind = path.endsWith('/') ? 'tree' : 'blob';

    return {
        href: `${repoUrl}/${kind}/${repoBranch}/${resolved}`,
        external: true,
    };
}

function resolvePath(dir: string, path: string): string {
    const segments =
        path.startsWith('/') || dir.length === 0 ? [] : dir.split('/');

    for (const segment of path.split('/')) {
        if (segment.length === 0 || segment === '.') continue;

        if (segment === '..') segments.pop();
        else segments.push(segment);
    }

    return segments.join('/');
}

function splitFragment(href: string): [string, string] {
    const hash = href.indexOf('#');

    return hash === -1 ? [href, ''] : [href.slice(0, hash), href.slice(hash)];
}

function docDir(file: string): string {
    const slash = file.lastIndexOf('/');

    return slash === -1 ? '' : file.slice(0, slash);
}

function headingId(text: string, used: Map<string, number>): string {
    const base = text
        .toLowerCase()
        .replace(slugStripPattern, '')
        .trim()
        .replace(spacePattern, '-');
    const slug = base.length > 0 ? base : 'section';
    const seen = used.get(slug) ?? 0;

    used.set(slug, seen + 1);

    return seen === 0 ? slug : `${slug}-${seen}`;
}

function escapeAttribute(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

export interface ArticleHeading {
    index: number;
    level: number;
    text: string;
}

export const outlineLevels = [1, 2, 3, 4] as const;

export const headingSelector = outlineLevels
    .map((level) => `.ProseMirror h${level}`)
    .join(', ');

const headingPattern = /<h([1-4])\b[^>]*>([\s\S]*?)<\/h\1>/gi;
const tagPattern = /<[^>]*>/g;
const blockEndPattern = /<\/(?:p|h[1-6]|li|blockquote|pre|figcaption|div)>/gi;
const breakPattern = /<br\b[^>]*>/gi;
const entityPattern = /&(#x[0-9a-f]+|#\d+|[a-z][a-z0-9]*);/gi;

const namedEntities = new Map([
    ['amp', '&'],
    ['lt', '<'],
    ['gt', '>'],
    ['quot', '"'],
    ['apos', "'"],
    ['nbsp', ' '],
    ['ndash', '–'],
    ['mdash', '—'],
    ['hellip', '…'],
]);

const maxCodePoint = 0x10ffff;

export function articleHeadings(html: string): Array<ArticleHeading> {
    const headings: Array<ArticleHeading> = [];
    let index = 0;

    for (const match of html.matchAll(headingPattern)) {
        const level = Number(match[1]);
        const text = plainText(match[2]);

        if (text.length > 0) headings.push({ index, level, text });

        index += 1;
    }

    return headings;
}

export function articleWordCount(html: string): number {
    const text = plainText(html);

    return text.length === 0 ? 0 : text.split(' ').length;
}

export function plainText(html: string): string {
    return decodeEntities(
        html
            .replace(breakPattern, ' ')
            .replace(blockEndPattern, ' ')
            .replace(tagPattern, '')
    )
        .replace(/\s+/g, ' ')
        .trim();
}

function decodeEntities(text: string): string {
    return text.replace(
        entityPattern,
        (match: string, entity: string) => decodeEntity(entity) ?? match
    );
}

function decodeEntity(entity: string): string | null {
    const lower = entity.toLowerCase();
    const named = namedEntities.get(lower);

    if (named !== undefined) return named;

    const code = lower.startsWith('#x')
        ? Number.parseInt(lower.slice(2), 16)
        : lower.startsWith('#')
          ? Number.parseInt(lower.slice(1), 10)
          : Number.NaN;

    if (!Number.isInteger(code) || code < 1 || code > maxCodePoint) return null;

    try {
        return String.fromCodePoint(code);
    } catch {
        return null;
    }
}

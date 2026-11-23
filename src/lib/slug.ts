const foldings = new Map([
    ['ä', 'ae'],
    ['ö', 'oe'],
    ['ü', 'ue'],
    ['ß', 'ss'],
    ['å', 'a'],
    ['æ', 'ae'],
    ['ø', 'o'],
    ['œ', 'oe'],
]);

export function slugify(value: string): string {
    return value
        .toLowerCase()
        .replaceAll(/[äöüßåæøœ]/gu, (char) => foldings.get(char) ?? char)
        .normalize('NFD')
        .replaceAll(/\p{Diacritic}/gu, '')
        .replaceAll(/[^a-z0-9]+/gu, '-')
        .replace(/^-+/u, '')
        .replace(/-+$/u, '');
}

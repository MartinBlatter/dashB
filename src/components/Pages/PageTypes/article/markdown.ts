import { marked } from 'marked';
import TurndownService from 'turndown';

const turndown = new TurndownService({
    headingStyle: 'atx',
    hr: '---',
    bulletListMarker: '-',
    codeBlockStyle: 'fenced',
    emDelimiter: '*',
    strongDelimiter: '**',
    linkStyle: 'inlined',
});

turndown.addRule('underline', {
    filter: ['u'],
    replacement: (content: string) => content,
});

export function htmlToMarkdown(html: string): string {
    return turndown.turndown(html);
}

export function markdownToHtml(markdown: string): string {
    return marked.parse(markdown, { async: false, gfm: true });
}

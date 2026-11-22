export interface HelpDoc {
    slug: string;
    file: string;
    title: string;
    description: string;
}

export const helpDocs: Array<HelpDoc> = [
    {
        slug: 'user-guide',
        file: 'docs/UserGuide.md',
        title: 'Using DashB',
        description:
            'The dashboard, pages, widgets and settings, from a standing start.',
    },
    {
        slug: 'overview',
        file: 'README.md',
        title: 'Overview',
        description:
            'The stack, the scripts, how the app is laid out, theming and deployment.',
    },
    {
        slug: 'page-types',
        file: 'docs/PageTypes.md',
        title: 'Creating a page type',
        description:
            'How a page type is written, registered, configured and stored.',
    },
    {
        slug: 'dashboard-widgets',
        file: 'docs/DashboardWidgets.md',
        title: 'Creating a dashboard widget',
        description:
            'The cards on the dashboard: settings fields, the record store and the widget frame.',
    },
    {
        slug: 'header-widgets',
        file: 'docs/HeaderWidgets.md',
        title: 'Creating a header widget',
        description:
            'The small readouts in the header, and the space they have to work with.',
    },
];

const sources: Record<string, (() => Promise<string>) | undefined> = {
    ...import.meta.glob<string>('../../*.md', {
        query: '?raw',
        import: 'default',
    }),
    ...import.meta.glob<string>('../../docs/*.md', {
        query: '?raw',
        import: 'default',
    }),
};

export function helpDocBySlug(slug: string): HelpDoc | null {
    return helpDocs.find((doc) => doc.slug === slug) ?? null;
}

export function helpDocByFile(file: string): HelpDoc | null {
    return helpDocs.find((doc) => doc.file === file) ?? null;
}

export async function helpDocSource(doc: HelpDoc): Promise<string> {
    const load = sources[`../../${doc.file}`];

    if (!load) throw new Error(`Missing help document: ${doc.file}`);

    return await load();
}

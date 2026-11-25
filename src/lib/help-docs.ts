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
        title: 'About DashB',
        description:
            'What the app is, where to get it, and how to run it yourself.',
    },
    {
        slug: 'architecture',
        file: 'docs/Architecture.md',
        title: 'How the project is built',
        description:
            'The stack, the scripts, how the app is laid out, theming, auth, forms and i18n.',
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
    {
        slug: 'desktop',
        file: 'docs/Desktop.md',
        title: 'The desktop app',
        description:
            'How a launch works, where your data lives, packaging and releases.',
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

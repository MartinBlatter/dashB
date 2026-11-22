import { createFileRoute, notFound } from '@tanstack/react-router';

import HelpDocView from '#/components/Help/HelpDocView';
import HelpMissing from '#/components/Help/HelpMissing';
import { helpDocBySlug, helpDocSource } from '#/lib/help-docs';

export const Route = createFileRoute('/help/$doc')({
    loader: async ({ params }) => {
        const doc = helpDocBySlug(params.doc);

        if (!doc) throw notFound();

        return { doc, markdown: await helpDocSource(doc) };
    },
    component: HelpDocRoute,
    notFoundComponent: HelpMissing,
});

function HelpDocRoute() {
    const { doc, markdown } = Route.useLoaderData();

    return (
        <main>
            <HelpDocView doc={doc} markdown={markdown} />
        </main>
    );
}

import gridLayoutStyles from 'react-grid-layout/css/styles.css?url';
import dashboardGridStyles from '#/components/Dashboard/grid.css?url';

import { createFileRoute, redirect } from '@tanstack/react-router';

import PageView from '#/components/Pages/PageView';
import {
    isCanonicalPath,
    pagePath,
    pagesQueryOptions,
    pathSegments,
    resolvePagePath,
} from '#/lib/pages';

export const Route = createFileRoute('/$')({
    head: () => ({
        links: [
            { rel: 'stylesheet', href: gridLayoutStyles },
            { rel: 'stylesheet', href: dashboardGridStyles },
        ],
    }),
    loader: async ({ context, params }) => {
        const segments = pathSegments(params._splat ?? '');
        const pages =
            await context.queryClient.ensureQueryData(pagesQueryOptions());

        const page = resolvePagePath(pages, segments);

        if (page && !isCanonicalPath(pages, page, segments)) {
            throw redirect({ to: pagePath(pages, page.id) });
        }

        return { segments };
    },
    component: PageRoute,
});

function PageRoute() {
    const { segments } = Route.useLoaderData();

    return (
        <main>
            <PageView segments={segments} />
        </main>
    );
}

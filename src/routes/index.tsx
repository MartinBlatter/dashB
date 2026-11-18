import gridLayoutStyles from 'react-grid-layout/css/styles.css?url';
import dashboardGridStyles from '#/components/Dashboard/grid.css?url';

import { createFileRoute } from '@tanstack/react-router';

import Dashboard from '#/components/Dashboard/Dashboard';

export const Route = createFileRoute('/')({
    head: () => ({
        links: [
            { rel: 'stylesheet', href: gridLayoutStyles },
            { rel: 'stylesheet', href: dashboardGridStyles },
        ],
    }),
    component: App,
});

function App() {
    return (
        <main>
            <Dashboard />
        </main>
    );
}

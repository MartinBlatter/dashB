import { createFileRoute } from '@tanstack/react-router';

import HelpIndex from '#/components/Help/HelpIndex';

export const Route = createFileRoute('/help/')({
    component: HelpIndexRoute,
});

function HelpIndexRoute() {
    return (
        <main>
            <HelpIndex />
        </main>
    );
}

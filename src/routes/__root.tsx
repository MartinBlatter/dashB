import mantineCoreStyles from '@mantine/core/styles.css?url';

import {
    HeadContent,
    Scripts,
    createRootRouteWithContext,
    redirect,
} from '@tanstack/react-router';
import {
    AppShell,
    useAppShellResize,
    ColorSchemeScript,
    mantineHtmlProps,
    MantineProvider,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools';
import { TanStackDevtools } from '@tanstack/react-devtools';
import Footer from '../components/Footer/Footer';
import Header from '../components/Header/Header';

import TanStackQueryDevtools from '../integrations/tanstack-query/devtools';

import { getLocale } from '#/paraglide/runtime';

import type { QueryClient } from '@tanstack/react-query';
import Navbar from '#/components/Navbar/Navbar';
import { isPublicPath } from '#/lib/auth-routes';
import { sessionQueryOptions, useSession } from '#/lib/session';

interface MyRouterContext {
    queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
    beforeLoad: async ({ context, location }) => {
        // Other redirect strategies are possible; see
        // https://github.com/TanStack/router/tree/main/examples/react/i18n-paraglide#offline-redirect
        if (typeof document !== 'undefined') {
            document.documentElement.setAttribute('lang', getLocale());
        }

        const session = await context.queryClient.ensureQueryData(
            sessionQueryOptions()
        );
        const user = session?.user ?? null;

        if (!user && !isPublicPath(location.pathname)) {
            throw redirect({
                to: '/login',
                search: { redirect: location.href },
            });
        }

        return { user };
    },

    head: () => ({
        meta: [
            {
                charSet: 'utf-8',
            },
            {
                name: 'viewport',
                content: 'width=device-width, initial-scale=1',
            },
            {
                title: 'DashB',
            },
        ],
        links: [{ rel: 'stylesheet', href: mantineCoreStyles }],
    }),
    shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
    const resize = useAppShellResize({
        navbar: { min: 200, max: 500 },
        header: { min: 48, max: 120 },
    });

    // Mobile starts collapsed, desktop starts open.
    const [mobileNavOpened, { toggle: toggleMobileNav }] = useDisclosure(false);
    const [desktopNavOpened, { toggle: toggleDesktopNav }] =
        useDisclosure(true);

    const session = useSession();

    return (
        <html lang={getLocale()} {...mantineHtmlProps} suppressHydrationWarning>
            <head>
                <ColorSchemeScript />
                <HeadContent />
            </head>
            <body>
                <MantineProvider>
                    {session?.user ? (
                        <AppShell
                            header={{ height: 60 }}
                            navbar={{
                                width: 300,
                                breakpoint: 'sm',
                                collapsed: {
                                    mobile: !mobileNavOpened,
                                    desktop: !desktopNavOpened,
                                },
                            }}
                            resize={resize}
                            padding={{ base: 10, sm: 15, lg: 'xl' }}
                            footer={{ height: 60 }}
                        >
                            <AppShell.Header>
                                <Header
                                    toggleMobileNav={toggleMobileNav}
                                    toggleDesktopNav={toggleDesktopNav}
                                />
                            </AppShell.Header>
                            <AppShell.Navbar>
                                <Navbar />
                            </AppShell.Navbar>
                            <AppShell.Main>{children}</AppShell.Main>
                            <AppShell.Footer>
                                <Footer />
                            </AppShell.Footer>
                        </AppShell>
                    ) : (
                        children
                    )}
                    {import.meta.env.DEV && (
                        <TanStackDevtools
                            config={{
                                position: 'bottom-right',
                            }}
                            plugins={[
                                {
                                    name: 'Tanstack Router',
                                    render: <TanStackRouterDevtoolsPanel />,
                                },
                                TanStackQueryDevtools,
                            ]}
                        />
                    )}
                </MantineProvider>
                <Scripts />
            </body>
        </html>
    );
}

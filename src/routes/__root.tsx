import mantineCoreStyles from '@mantine/core/styles.css?url';
import mantineDatesStyles from '@mantine/dates/styles.css?url';
import mantineScheduleStyles from '@mantine/schedule/styles.css?url';
import mantineTiptapStyles from '@mantine/tiptap/styles.css?url';

import {
    HeadContent,
    Scripts,
    createRootRouteWithContext,
    redirect,
} from '@tanstack/react-router';
import {
    AppShell,
    Box,
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
import ColorSchemeToggle from '../components/Header/ColorSchemeToggle';

import TanStackQueryDevtools from '../integrations/tanstack-query/devtools';

import { getLocale } from '#/paraglide/runtime';

import type { QueryClient } from '@tanstack/react-query';
import Navbar from '#/components/Navbar/Navbar';
import NavbarMenu from '#/components/Navbar/NavbarMenu';
import { isPublicPath } from '#/lib/auth-routes';
import { sessionQueryOptions, useSession } from '#/lib/session';
import { themeForHue } from '#/lib/theme';
import { userSettingsQueryOptions, useThemeHue } from '#/lib/user-settings';

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

        if (user) {
            await context.queryClient.ensureQueryData(
                userSettingsQueryOptions()
            );
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
        links: [
            { rel: 'stylesheet', href: mantineCoreStyles },
            { rel: 'stylesheet', href: mantineDatesStyles },
            { rel: 'stylesheet', href: mantineScheduleStyles },
            { rel: 'stylesheet', href: mantineTiptapStyles },
        ],
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
    const theme = themeForHue(useThemeHue());

    return (
        <html lang={getLocale()} {...mantineHtmlProps} suppressHydrationWarning>
            <head>
                <ColorSchemeScript />
                <HeadContent />
            </head>
            <body>
                <MantineProvider theme={theme} defaultColorScheme="auto">
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
                                <NavbarMenu />
                            </AppShell.Navbar>
                            <AppShell.Main>{children}</AppShell.Main>
                            <AppShell.Footer>
                                <Footer />
                            </AppShell.Footer>
                        </AppShell>
                    ) : (
                        <>
                            {/* The auth pages render outside the AppShell, so
                                they get their own floating toggle. */}
                            <Box
                                pos="fixed"
                                top={0}
                                right={0}
                                p="sm"
                                style={{ zIndex: 100 }}
                            >
                                <ColorSchemeToggle />
                            </Box>
                            {children}
                        </>
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

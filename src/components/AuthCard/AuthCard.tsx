import { Center, Paper, Stack, Text, Title } from '@mantine/core';
import type { ReactNode } from 'react';

/**
 * Shell for the sign-in and sign-up pages. These render outside the dashboard
 * `AppShell` (see `src/routes/__root.tsx`), so the card centres itself in the
 * viewport instead of sitting inside the app layout.
 */
export default function AuthCard({
    title,
    subtitle,
    children,
    footer,
}: {
    title: string;
    subtitle?: string;
    children: ReactNode;
    footer?: ReactNode;
}) {
    return (
        <Center mih="100dvh" p="md">
            <Paper withBorder shadow="sm" radius="md" p="xl" w="100%" maw={420}>
                <Stack gap={4} mb="lg">
                    <Title order={2}>{title}</Title>
                    {subtitle ? (
                        <Text c="dimmed" size="sm">
                            {subtitle}
                        </Text>
                    ) : null}
                </Stack>

                {children}

                {footer ? (
                    <Text size="sm" mt="lg" ta="center">
                        {footer}
                    </Text>
                ) : null}
            </Paper>
        </Center>
    );
}

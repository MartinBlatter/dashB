import { Box, Group, Text } from '@mantine/core';
import { QuestionIcon } from '@phosphor-icons/react';

import { AnchorLink } from '#/components/AnchorLink/AnchorLink';
import { m } from '#/paraglide/messages';

export default function Footer() {
    const year = new Date().getFullYear();

    return (
        <Box
            h="100%"
            px="sm"
            style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                alignItems: 'center',
                gap: 'var(--mantine-spacing-xs)',
            }}
        >
            <Group gap="xs" wrap="nowrap" justify="flex-start">
                <AnchorLink to="/help" size="sm" underline="hover">
                    <Group gap={6} wrap="nowrap">
                        <QuestionIcon size={16} />
                        {m['footer.help']()}
                    </Group>
                </AnchorLink>
            </Group>

            <Group gap="xs" wrap="nowrap" justify="flex-end">
                <Text size="sm" c="dimmed">
                    © {year} DashB
                </Text>
            </Group>
        </Box>
    );
}

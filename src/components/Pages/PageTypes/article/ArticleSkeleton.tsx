import { Group, Skeleton, Stack } from '@mantine/core';

import type { ReactElement } from 'react';

export default function ArticleSkeleton(): ReactElement {
    return (
        <Stack gap="xs" aria-hidden>
            <Group justify="space-between">
                <Skeleton height={24} width={160} radius="sm" />
                <Skeleton height={12} width={90} radius="sm" />
            </Group>

            <Skeleton height={420} radius="md" />
        </Stack>
    );
}

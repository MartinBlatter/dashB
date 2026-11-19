import { Skeleton, Stack } from '@mantine/core';

import type { ReactElement } from 'react';

const lines = [
    { id: 'a', width: '100%' },
    { id: 'b', width: '92%' },
    { id: 'c', width: '78%' },
];

export default function PageSkeleton(): ReactElement {
    return (
        <Stack gap="md" aria-hidden>
            <Skeleton height={28} width="40%" radius="sm" />

            <Stack gap="sm">
                {lines.map((line) => (
                    <Skeleton
                        key={line.id}
                        height={12}
                        width={line.width}
                        radius="sm"
                    />
                ))}
            </Stack>
        </Stack>
    );
}

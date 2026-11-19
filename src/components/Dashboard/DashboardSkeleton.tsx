import { SimpleGrid, Skeleton } from '@mantine/core';

import type { ReactElement } from 'react';

const cards = [
    { id: 'a', height: 260 },
    { id: 'b', height: 260 },
    { id: 'c', height: 200 },
    { id: 'd', height: 200 },
];

export default function DashboardSkeleton(): ReactElement {
    return (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing={12} aria-hidden>
            {cards.map((card) => (
                <Skeleton key={card.id} height={card.height} radius="md" />
            ))}
        </SimpleGrid>
    );
}

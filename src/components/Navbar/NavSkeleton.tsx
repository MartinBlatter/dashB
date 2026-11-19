import { Box, Skeleton } from '@mantine/core';

import type { ReactElement } from 'react';

const rows = [
    { id: 'a', width: '70%', nested: false },
    { id: 'b', width: '55%', nested: true },
    { id: 'c', width: '80%', nested: false },
    { id: 'd', width: '45%', nested: true },
    { id: 'e', width: '65%', nested: false },
];

export default function NavSkeleton(): ReactElement {
    return (
        <Box aria-hidden>
            {rows.map((row) => (
                <Skeleton
                    key={row.id}
                    height={14}
                    width={row.width}
                    radius="sm"
                    my={12}
                    ml={row.nested ? 'xl' : 'sm'}
                />
            ))}
        </Box>
    );
}

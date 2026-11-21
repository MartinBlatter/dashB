import { Box } from '@mantine/core';

import type { ReactNode } from 'react';

export default function PreviewStage({ children }: { children: ReactNode }) {
    return (
        <Box
            p="xs"
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 120,
                overflow: 'hidden',
                borderRadius: 'var(--mantine-radius-sm)',
                backgroundColor: 'var(--mantine-color-default-hover)',
            }}
        >
            {children}
        </Box>
    );
}

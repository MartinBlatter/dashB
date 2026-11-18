import { Box } from '@mantine/core';
import type { ReactElement } from 'react';
import AddNewPageModal from './AddNewPageModal';

export default function NavbarMenu(): ReactElement {
    return (
        <Box
            mt="auto"
            p="sm"
            pt="sm"
            style={{
                borderTop: '1px solid var(--app-shell-border-color)',
            }}
        >
            <AddNewPageModal />
        </Box>
    );
}

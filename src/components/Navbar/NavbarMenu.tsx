import { Box, Button, Group } from '@mantine/core';
import { CheckIcon, PencilSimpleIcon } from '@phosphor-icons/react';

import { m } from '#/paraglide/messages';

import AddNewPageModal from './AddNewPageModal';
import { usePageEditModeToggle } from './edit-mode';

import type { ReactElement } from 'react';

export default function NavbarMenu(): ReactElement {
    const [editMode, toggleEditMode] = usePageEditModeToggle();

    return (
        <Box
            mt="auto"
            p="sm"
            pt="sm"
            style={{
                borderTop: '1px solid var(--app-shell-border-color)',
            }}
        >
            <Group gap="xs">
                <AddNewPageModal />

                <Button
                    leftSection={
                        editMode ? (
                            <CheckIcon size={14} />
                        ) : (
                            <PencilSimpleIcon size={14} />
                        )
                    }
                    variant={editMode ? 'filled' : 'default'}
                    aria-pressed={editMode}
                    onClick={toggleEditMode}
                >
                    {editMode
                        ? m['navbar.edit_mode_done']()
                        : m['navbar.edit_mode']()}
                </Button>
            </Group>
        </Box>
    );
}

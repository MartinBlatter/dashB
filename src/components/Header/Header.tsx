import { ActionIcon, Box, Group } from '@mantine/core';
import { ListIcon } from '@phosphor-icons/react';
import UserMenu from './UserMenu';
import AddHeaderWidgetModal from './AddHeaderWidgetModal';
import HeaderWidgetBar from './HeaderWidgets/HeaderWidgetBar';

export default function Header({
    toggleMobileNav,
    toggleDesktopNav,
}: {
    toggleMobileNav: () => void;
    toggleDesktopNav: () => void;
}) {
    return (
        <Box
            h="100%"
            px="sm"
            style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto 1fr',
                alignItems: 'center',
                gap: 'var(--mantine-spacing-xs)',
            }}
        >
            <Group gap="xs" wrap="nowrap" justify="flex-start">
                <ActionIcon
                    autoContrast
                    aria-label="Toggle navigation"
                    size="lg"
                    hiddenFrom="sm"
                    onClick={toggleMobileNav}
                >
                    <ListIcon size={20} />
                </ActionIcon>
                <ActionIcon
                    autoContrast
                    aria-label="Toggle navigation"
                    size="lg"
                    visibleFrom="sm"
                    onClick={toggleDesktopNav}
                >
                    <ListIcon size={20} />
                </ActionIcon>
            </Group>

            <HeaderWidgetBar />

            <Group gap="xs" wrap="nowrap" justify="flex-end">
                <AddHeaderWidgetModal />
                <UserMenu />
            </Group>
        </Box>
    );
}

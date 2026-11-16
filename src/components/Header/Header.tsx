import { ActionIcon, Group, Button } from '@mantine/core';
import { ListIcon, PlusIcon } from '@phosphor-icons/react';
import { m } from '#/paraglide/messages';
import ParaglideLocaleSwitcher from './LocaleSwitcher';
import ColorSchemeToggle from './ColorSchemeToggle';
import UserMenu from './USerMenu';

export default function Header({
    toggleMobileNav,
    toggleDesktopNav,
}: {
    toggleMobileNav: () => void;
    toggleDesktopNav: () => void;
}) {
    return (
        <Group h="100%" px="sm" gap="xs" justify="space-between" wrap="nowrap">
            <Group gap="xs" wrap="nowrap">
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
            <Group gap="xs" wrap="nowrap">
                <Button leftSection={<PlusIcon size={14} />}>
                    {m['header.add_widget']()}
                </Button>
                <ParaglideLocaleSwitcher />
                <ColorSchemeToggle />
                <UserMenu />
            </Group>
        </Group>
    );
}

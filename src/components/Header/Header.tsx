import { useState } from 'react';
import {
    ActionIcon,
    Group,
    Menu,
    Text,
    UnstyledButton,
    Button,
} from '@mantine/core';
import {
    CaretDownIcon,
    ListIcon,
    PlusIcon,
    SignOutIcon,
} from '@phosphor-icons/react';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';

import { authClient } from '#/lib/auth-client';
import { sessionQueryKey, useSession } from '#/lib/session';
import { m } from '#/paraglide/messages';
import ParaglideLocaleSwitcher from '../LocaleSwitcher/LocaleSwitcher';

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
                <UserMenu />
            </Group>
        </Group>
    );
}

function UserMenu() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const session = useSession();
    const [signingOut, setSigningOut] = useState(false);

    const user = session?.user;

    if (!user) {
        return null;
    }

    const signOut = async () => {
        setSigningOut(true);

        try {
            await authClient.signOut();
            await queryClient.invalidateQueries({ queryKey: sessionQueryKey });
            await router.navigate({ to: '/login' });
        } finally {
            setSigningOut(false);
        }
    };

    return (
        <Menu position="bottom-end" withArrow>
            <Menu.Target>
                <UnstyledButton aria-label={m['auth.account']()} px="xs">
                    <Group gap={6} wrap="nowrap">
                        <Text size="sm" fw={500} lineClamp={1}>
                            {user.name || user.email}
                        </Text>
                        <CaretDownIcon size={14} />
                    </Group>
                </UnstyledButton>
            </Menu.Target>

            <Menu.Dropdown>
                <Menu.Label>{user.email}</Menu.Label>
                <Menu.Item
                    leftSection={<SignOutIcon size={16} />}
                    disabled={signingOut}
                    onClick={() => void signOut()}
                >
                    {m['auth.signOut']()}
                </Menu.Item>
            </Menu.Dropdown>
        </Menu>
    );
}

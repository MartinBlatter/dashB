import { useState } from 'react';
import { Menu, Text, Group, UnstyledButton } from '@mantine/core';
import { CaretDownIcon, SignOutIcon } from '@phosphor-icons/react';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { m } from '#/paraglide/messages';
import { authClient } from '#/lib/auth-client';
import { sessionQueryKey, useSession } from '#/lib/session';

export default function UserMenu() {
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

import { useState } from 'react';
import {
    ActionIcon,
    Group,
    HueSlider,
    Menu,
    Switch,
    Text,
    UnstyledButton,
    useComputedColorScheme,
    useMantineColorScheme,
} from '@mantine/core';
import {
    ArrowCounterClockwiseIcon,
    CaretDownIcon,
    CheckIcon,
    MoonIcon,
    SignOutIcon,
    SunIcon,
} from '@phosphor-icons/react';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { m } from '#/paraglide/messages';
import { getLocale, locales, setLocale } from '#/paraglide/runtime';
import { authClient } from '#/lib/auth-client';
import { sessionQueryKey, useSession } from '#/lib/session';
import { clampHue, defaultThemeHue } from '#/lib/theme';
import {
    setThemeHue,
    userSettingsQueryKey,
    useThemeHue,
} from '#/lib/user-settings';

import type { Locale } from '#/components/Widgets/i18n';

function localeName(locale: Locale): string {
    try {
        return (
            new Intl.DisplayNames([locale], { type: 'language' }).of(locale) ??
            locale.toUpperCase()
        );
    } catch {
        return locale.toUpperCase();
    }
}

export default function UserMenu() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const session = useSession();
    const [signingOut, setSigningOut] = useState(false);

    const { setColorScheme } = useMantineColorScheme();
    const computedColorScheme = useComputedColorScheme('light', {
        getInitialValueInEffect: true,
    });
    const themeHue = useThemeHue();

    const user = session?.user;

    if (!user) {
        return null;
    }

    const dark = computedColorScheme === 'dark';
    const currentLocale = getLocale();

    const previewHue = (hue: number) => {
        queryClient.setQueryData(userSettingsQueryKey, {
            themeHue: clampHue(hue),
        });
    };

    const saveHue = async (hue: number) => {
        previewHue(hue);

        const next = await setThemeHue({ data: { themeHue: clampHue(hue) } });

        queryClient.setQueryData(userSettingsQueryKey, next);
    };

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

                <Menu.Divider />

                <Menu.Label>{m['header.appearance']()}</Menu.Label>
                <Menu.Item
                    closeMenuOnClick={false}
                    leftSection={
                        dark ? <MoonIcon size={16} /> : <SunIcon size={16} />
                    }
                    rightSection={
                        <Switch
                            size="xs"
                            checked={dark}
                            readOnly
                            tabIndex={-1}
                            aria-hidden
                        />
                    }
                    aria-label={`${m['header.dark_mode']()}: ${
                        dark ? m['header.on']() : m['header.off']()
                    }`}
                    onClick={() => setColorScheme(dark ? 'light' : 'dark')}
                >
                    {m['header.dark_mode']()}
                </Menu.Item>

                <Menu.Label>{m['header.theme_color']()}</Menu.Label>
                <Group gap="xs" px="sm" pb={6} wrap="nowrap">
                    <HueSlider
                        flex={1}
                        size="md"
                        aria-label={m['header.theme_color']()}
                        value={themeHue}
                        onChange={previewHue}
                        onChangeEnd={(hue) => void saveHue(hue)}
                    />
                    <ActionIcon
                        variant="subtle"
                        color="gray"
                        size="md"
                        aria-label={m['header.theme_color_reset']()}
                        onClick={() => void saveHue(defaultThemeHue)}
                    >
                        <ArrowCounterClockwiseIcon size={16} />
                    </ActionIcon>
                </Group>

                <Menu.Label>{m['header.language_label']()}</Menu.Label>
                {locales.map((locale) => {
                    const active = locale === currentLocale;

                    return (
                        <Menu.Item
                            key={locale}
                            aria-current={active ? true : undefined}
                            rightSection={
                                active ? <CheckIcon size={14} /> : null
                            }
                            onClick={() => {
                                if (!active) setLocale(locale);
                            }}
                        >
                            {localeName(locale)}
                        </Menu.Item>
                    );
                })}

                <Menu.Divider />

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

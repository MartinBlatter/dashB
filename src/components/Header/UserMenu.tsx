import { useState } from 'react';
import {
    ActionIcon,
    Group,
    HueSlider,
    Menu,
    Slider,
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
    ImageIcon,
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
import {
    clampHue,
    clampSurfaceOpacity,
    defaultSurfaceOpacity,
    defaultThemeHue,
    minSurfaceOpacity,
    translucentSurfaceOpacity,
} from '#/lib/theme';
import {
    defaultUserSettings,
    updateUserSettings,
    userSettingsQueryKey,
    useUserSettings,
} from '#/lib/user-settings';

import BackgroundImageModal from './BackgroundImageModal';

import type { Locale } from '#/components/Widgets/i18n';
import type { UserSettings } from '#/lib/user-settings';

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
    const [picking, setPicking] = useState(false);

    const { setColorScheme } = useMantineColorScheme();
    const computedColorScheme = useComputedColorScheme('light', {
        getInitialValueInEffect: true,
    });
    const settings = useUserSettings();

    const user = session?.user;

    if (!user) {
        return null;
    }

    const dark = computedColorScheme === 'dark';
    const currentLocale = getLocale();

    const preview = (patch: Partial<UserSettings>) => {
        queryClient.setQueryData<UserSettings>(
            userSettingsQueryKey,
            (current) => ({
                ...(current ?? defaultUserSettings),
                ...patch,
            })
        );
    };

    const save = async (patch: Partial<UserSettings>) => {
        preview(patch);

        const next = await updateUserSettings({ data: patch });

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
        <>
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
                            dark ? (
                                <MoonIcon size={16} />
                            ) : (
                                <SunIcon size={16} />
                            )
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
                            value={settings.themeHue}
                            onChange={(hue) =>
                                preview({ themeHue: clampHue(hue) })
                            }
                            onChangeEnd={(hue) =>
                                void save({ themeHue: clampHue(hue) })
                            }
                        />
                        <ActionIcon
                            variant="subtle"
                            color="gray"
                            size="md"
                            aria-label={m['header.theme_color_reset']()}
                            onClick={() =>
                                void save({ themeHue: defaultThemeHue })
                            }
                        >
                            <ArrowCounterClockwiseIcon size={16} />
                        </ActionIcon>
                    </Group>

                    <Menu.Label>{m['header.surface_opacity']()}</Menu.Label>
                    <Group gap="xs" px="sm" pb={6} wrap="nowrap">
                        <Slider
                            flex={1}
                            size="md"
                            min={minSurfaceOpacity}
                            max={defaultSurfaceOpacity}
                            step={1}
                            label={(value) => `${value}%`}
                            aria-label={m['header.surface_opacity']()}
                            value={settings.surfaceOpacity}
                            onChange={(opacity) =>
                                preview({
                                    surfaceOpacity:
                                        clampSurfaceOpacity(opacity),
                                })
                            }
                            onChangeEnd={(opacity) =>
                                void save({
                                    surfaceOpacity:
                                        clampSurfaceOpacity(opacity),
                                })
                            }
                        />
                        <ActionIcon
                            variant="subtle"
                            color="gray"
                            size="md"
                            aria-label={m['header.surface_opacity_reset']()}
                            onClick={() =>
                                void save({
                                    surfaceOpacity: defaultSurfaceOpacity,
                                })
                            }
                        >
                            <ArrowCounterClockwiseIcon size={16} />
                        </ActionIcon>
                    </Group>

                    <Menu.Item
                        leftSection={<ImageIcon size={16} />}
                        onClick={() => setPicking(true)}
                    >
                        {m['header.background_image']()}
                    </Menu.Item>

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

            <BackgroundImageModal
                opened={picking}
                selectedId={settings.backgroundImageId}
                onClose={() => setPicking(false)}
                onSelect={async (backgroundImageId) => {
                    const translucent =
                        backgroundImageId !== null &&
                        settings.surfaceOpacity === defaultSurfaceOpacity;

                    await save({
                        backgroundImageId,
                        ...(translucent
                            ? { surfaceOpacity: translucentSurfaceOpacity }
                            : {}),
                    });
                }}
            />
        </>
    );
}

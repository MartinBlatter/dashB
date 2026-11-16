import {
    ActionIcon,
    useMantineColorScheme,
    useComputedColorScheme,
} from '@mantine/core';
import { MoonIcon, SunIcon } from '@phosphor-icons/react';

export default function ColorSchemeToggle() {
    const { setColorScheme } = useMantineColorScheme();
    const computedColorScheme = useComputedColorScheme('light', {
        getInitialValueInEffect: true,
    });

    return (
        <ActionIcon
            onClick={() =>
                setColorScheme(
                    computedColorScheme === 'dark' ? 'light' : 'dark'
                )
            }
            variant="filled"
            size="lg"
            aria-label="Toggle color scheme"
        >
            {computedColorScheme === 'dark' ? (
                <SunIcon style={{ width: 18, height: 18 }} />
            ) : (
                <MoonIcon style={{ width: 18, height: 18 }} />
            )}
        </ActionIcon>
    );
}

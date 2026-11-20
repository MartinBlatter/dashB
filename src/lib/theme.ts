import { createTheme } from '@mantine/core';

import type { MantineColorsTuple, MantineThemeOverride } from '@mantine/core';

export const defaultThemeHue = 208;

export const brandColor = 'brand';

export function clampHue(hue: number): number {
    if (!Number.isFinite(hue)) return defaultThemeHue;

    return ((Math.round(hue) % 360) + 360) % 360;
}

function channels(
    segment: number,
    chroma: number,
    mid: number
): [number, number, number] {
    if (segment < 1) return [chroma, mid, 0];
    if (segment < 2) return [mid, chroma, 0];
    if (segment < 3) return [0, chroma, mid];
    if (segment < 4) return [0, mid, chroma];
    if (segment < 5) return [mid, 0, chroma];

    return [chroma, 0, mid];
}

function hex(hue: number, saturation: number, lightness: number): string {
    const s = saturation / 100;
    const l = lightness / 100;
    const chroma = (1 - Math.abs(2 * l - 1)) * s;
    const segment = hue / 60;
    const mid = chroma * (1 - Math.abs((segment % 2) - 1));
    const offset = l - chroma / 2;

    return `#${channels(segment, chroma, mid)
        .map((channel) =>
            Math.round((channel + offset) * 255)
                .toString(16)
                .padStart(2, '0')
        )
        .join('')}`;
}

function saturationScale(hue: number): number {
    const offset = Math.abs(hue - 140);
    const distance = Math.min(offset, 360 - offset);

    return 1 - 0.25 * Math.exp(-((distance / 50) ** 2));
}

export function hueShades(hue: number): MantineColorsTuple {
    const h = clampHue(hue);
    const scale = saturationScale(h);
    const shade = (saturation: number, lightness: number) =>
        hex(h, saturation * scale, lightness);

    return [
        shade(100, 96),
        shade(96, 91),
        shade(92, 83),
        shade(88, 74),
        shade(84, 65),
        shade(80, 57),
        shade(76, 52),
        shade(74, 47),
        shade(70, 42),
        shade(66, 37),
    ];
}

export function themeForHue(hue: number): MantineThemeOverride {
    return createTheme({
        primaryColor: brandColor,
        colors: { [brandColor]: hueShades(hue) },
        autoContrast: true,
    });
}

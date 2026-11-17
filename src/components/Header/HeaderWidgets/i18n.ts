import { getLocale } from '#/paraglide/runtime';

import type { locales } from '#/paraglide/runtime';

export type Locale = (typeof locales)[number];

export type WidgetMessages<TKey extends string> = Record<
    Locale,
    Record<TKey, string>
>;

export function createWidgetMessages<TKey extends string>(
    messages: WidgetMessages<TKey>
): (key: TKey) => string {
    return (key) => messages[getLocale()][key];
}

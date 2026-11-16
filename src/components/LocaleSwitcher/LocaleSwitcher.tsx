// Locale switcher refs:
// - Paraglide docs: https://inlang.com/m/gerre34r/library-inlang-paraglideJs
// - Router example: https://github.com/TanStack/router/tree/main/examples/react/i18n-paraglide#switching-locale
import { getLocale, locales, setLocale } from '#/paraglide/runtime';
import { m } from '#/paraglide/messages';
import { Button, Menu } from '@mantine/core';

export default function ParaglideLocaleSwitcher() {
    const currentLocale = getLocale();

    return (
        <div style={{ display: 'flex', gap: '0.25rem' }}>
            <Menu
                shadow="md"
                width={200}
                aria-label={m['header.language_label']()}
            >
                <Menu.Target>
                    <Button key={currentLocale}>
                        {currentLocale.toUpperCase()}
                    </Button>
                </Menu.Target>
                <Menu.Dropdown>
                    {locales.map((locale) =>
                        locale !== currentLocale ? (
                            <Menu.Item
                                key={locale}
                                onClick={() => setLocale(locale)}
                            >
                                {locale.toUpperCase()}
                            </Menu.Item>
                        ) : null
                    )}
                </Menu.Dropdown>
            </Menu>
        </div>
    );
}

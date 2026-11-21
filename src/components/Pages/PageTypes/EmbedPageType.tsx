import { Alert, Box } from '@mantine/core';
import { BrowserIcon, WarningIcon } from '@phosphor-icons/react';

import { createWidgetMessages } from '#/components/Widgets/i18n';
import { valueNumber, valueText } from '#/components/Widgets/values';

import type { PageTypeMeta, PageTypeProps } from './types';
import type { ReactElement } from 'react';

const t = createWidgetMessages({
    en: {
        label: 'Embed',
        description: 'Show another site or tool inside this page.',
        url: 'Address',
        url_hint:
            'An http or https address. Many sites refuse to be embedded and then show nothing — that is the site’s choice, not a setting here.',
        height: 'Height',
        height_hint: 'In pixels.',
        fullscreen: 'Allow fullscreen',
        missing: 'No address yet',
        missing_hint:
            'Open the page settings and enter the address you want to show here.',
        invalid: 'That address cannot be shown',
        invalid_hint:
            'Only http and https addresses can be embedded. Open the page settings and check it.',
    },
    de: {
        label: 'Einbettung',
        description: 'Eine andere Seite oder ein Tool in dieser Seite zeigen.',
        url: 'Adresse',
        url_hint:
            'Eine http- oder https-Adresse. Viele Seiten verbieten das Einbetten und bleiben dann leer — das entscheidet die Seite, nicht diese Einstellung.',
        height: 'Höhe',
        height_hint: 'In Pixeln.',
        fullscreen: 'Vollbild erlauben',
        missing: 'Noch keine Adresse',
        missing_hint:
            'Öffne die Seiteneinstellungen und trage die Adresse ein, die hier erscheinen soll.',
        invalid: 'Diese Adresse kann nicht gezeigt werden',
        invalid_hint:
            'Nur http- und https-Adressen lassen sich einbetten. Öffne die Seiteneinstellungen und prüfe sie.',
    },
});

const defaultHeight = 800;

const sandbox = 'allow-scripts allow-same-origin allow-forms allow-popups';

export const widgetMeta = {
    type: 'embed',
    label: () => t('label'),
    description: () => t('description'),
    icon: BrowserIcon,
    fields: [
        {
            kind: 'text',
            name: 'url',
            label: () => t('url'),
            description: () => t('url_hint'),
            defaultValue: '',
            required: true,
            maxLength: 2000,
        },
        {
            kind: 'number',
            name: 'height',
            label: () => t('height'),
            description: () => t('height_hint'),
            defaultValue: defaultHeight,
            min: 200,
            max: 4000,
            step: 50,
            required: true,
        },
        {
            kind: 'switch',
            name: 'allowFullscreen',
            label: () => t('fullscreen'),
            defaultValue: false,
        },
    ],
} satisfies PageTypeMeta;

function embedUrl(raw: string): string | null {
    try {
        const parsed = new URL(raw);

        return parsed.protocol === 'https:' || parsed.protocol === 'http:'
            ? parsed.toString()
            : null;
    } catch {
        return null;
    }
}

export default function EmbedPageType({
    title,
    config,
}: PageTypeProps): ReactElement {
    const raw = valueText(config, 'url').trim();
    const height = valueNumber(config, 'height', defaultHeight);
    const allowFullscreen = config.allowFullscreen === true;

    if (raw === '') {
        return (
            <Alert
                variant="light"
                color="gray"
                icon={<WarningIcon size={18} />}
                title={t('missing')}
            >
                {t('missing_hint')}
            </Alert>
        );
    }

    const url = embedUrl(raw);

    if (url === null) {
        return (
            <Alert
                variant="light"
                color="yellow"
                icon={<WarningIcon size={18} />}
                title={t('invalid')}
            >
                {t('invalid_hint')}
            </Alert>
        );
    }

    return (
        <Box
            component="iframe"
            src={url}
            title={title}
            sandbox={sandbox}
            referrerPolicy="no-referrer"
            allow={allowFullscreen ? 'fullscreen' : undefined}
            allowFullScreen={allowFullscreen}
            loading="lazy"
            w="100%"
            h={height}
            display="block"
            style={{ border: 0, borderRadius: 'var(--mantine-radius-md)' }}
        />
    );
}

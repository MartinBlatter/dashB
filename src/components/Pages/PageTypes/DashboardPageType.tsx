import { SquaresFourIcon } from '@phosphor-icons/react';

import Dashboard from '#/components/Dashboard/Dashboard';
import { createWidgetMessages } from '#/components/Widgets/i18n';

import type { PageTypeMeta, PageTypeProps } from './types';

const t = createWidgetMessages({
    en: {
        label: 'Dashboard',
        description:
            'A widget grid of its own, separate from the main dashboard.',
    },
    de: {
        label: 'Dashboard',
        description: 'Ein eigenes Widget-Raster, getrennt vom Haupt-Dashboard.',
    },
});

export const widgetMeta = {
    type: 'dashboard',
    label: () => t('label'),
    description: () => t('description'),
    icon: SquaresFourIcon,
} satisfies PageTypeMeta;

export default function DashboardPageType({ pageId }: PageTypeProps) {
    return <Dashboard pageId={pageId} />;
}

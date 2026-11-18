import { createWidgetRegistry } from '#/components/Widgets/registry';

import type { HeaderWidgetMeta, HeaderWidgetProps } from './types';

const modules = import.meta.glob<unknown>('./*Widget.tsx', { eager: true });

export const headerWidgetRegistry = createWidgetRegistry<
    HeaderWidgetMeta,
    HeaderWidgetProps
>('HeaderWidgets', modules);

export const getHeaderWidget = headerWidgetRegistry.get;

export const headerWidgetOptions = headerWidgetRegistry.options;

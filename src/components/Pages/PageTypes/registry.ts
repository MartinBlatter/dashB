import { createWidgetRegistry } from '#/components/Widgets/registry';

import type { PageTypeMeta, PageTypeProps } from './types';

const modules = import.meta.glob<unknown>('./*PageType.tsx', { eager: true });

export const pageTypeRegistry = createWidgetRegistry<
    PageTypeMeta,
    PageTypeProps
>('PageTypes', modules, 'page');

export const getPageType = pageTypeRegistry.get;

export const pageTypeOptions = pageTypeRegistry.options;

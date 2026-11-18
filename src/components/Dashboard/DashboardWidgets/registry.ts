import { createWidgetRegistry } from '#/components/Widgets/registry';

import type { DashboardWidgetMeta, DashboardWidgetProps } from './types';

const modules = import.meta.glob<unknown>('./*Widget.tsx', { eager: true });

export const dashboardWidgetRegistry = createWidgetRegistry<
    DashboardWidgetMeta,
    DashboardWidgetProps
>('DashboardWidgets', modules);

export const getDashboardWidget = dashboardWidgetRegistry.get;

export const dashboardWidgetOptions = dashboardWidgetRegistry.options;

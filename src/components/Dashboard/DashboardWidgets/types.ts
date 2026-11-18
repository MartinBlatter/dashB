import type {
    WidgetDefinition,
    WidgetMetaBase,
    WidgetModuleBase,
    WidgetValues,
} from '#/components/Widgets/types';

export interface DashboardWidgetProps {
    id: string;
    label: string;
    config: WidgetValues;
}

export interface DashboardWidgetSize {
    w: number;
    h: number;
    minW?: number;
    minH?: number;
}

export interface DashboardWidgetMeta extends WidgetMetaBase {
    defaultSize?: DashboardWidgetSize;
}

export type DashboardWidgetModule = WidgetModuleBase<DashboardWidgetProps>;

export type DashboardWidgetDefinition = WidgetDefinition<
    DashboardWidgetMeta,
    DashboardWidgetProps
>;

import type {
    WidgetDefinition,
    WidgetMetaBase,
    WidgetModuleBase,
    WidgetValues,
} from '#/components/Widgets/types';

export interface HeaderWidgetProps {
    id: string;
    label: string;
    config: WidgetValues;
}

export type HeaderWidgetMeta = WidgetMetaBase;

export type HeaderWidgetModule = WidgetModuleBase<HeaderWidgetProps>;

export type HeaderWidgetDefinition = WidgetDefinition<
    HeaderWidgetMeta,
    HeaderWidgetProps
>;

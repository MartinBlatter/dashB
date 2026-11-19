import type { Icon } from '@phosphor-icons/react';
import type {
    WidgetDefinition,
    WidgetMetaBase,
    WidgetModuleBase,
    WidgetValues,
} from '#/components/Widgets/types';

export interface PageTypeProps {
    pageId: string;
    title: string;
    config: WidgetValues;
}

export interface PageTypeMeta extends WidgetMetaBase {
    icon?: Icon;
}

export type PageTypeModule = WidgetModuleBase<PageTypeProps>;

export type PageTypeDefinition = WidgetDefinition<PageTypeMeta, PageTypeProps>;

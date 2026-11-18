import type { ComponentType } from 'react';

export type WidgetFieldValue = string | number | boolean;

export type WidgetValues = Record<string, WidgetFieldValue>;

export type StoredWidgetValue = string | number | boolean | null;

export type StoredWidgetValues = Record<string, StoredWidgetValue>;

interface WidgetFieldBase {
    name: string;
    label: () => string;
    description?: () => string;
    required?: boolean;
}

export interface WidgetTextField extends WidgetFieldBase {
    kind: 'text';
    placeholder?: () => string;
    maxLength?: number;
    defaultValue?: string;
}

export interface WidgetTextareaField extends WidgetFieldBase {
    kind: 'textarea';
    placeholder?: () => string;
    maxLength?: number;
    rows?: number;
    defaultValue?: string;
}

export interface WidgetNumberField extends WidgetFieldBase {
    kind: 'number';
    min?: number;
    max?: number;
    step?: number;
    defaultValue?: number;
}

export interface WidgetDateField extends WidgetFieldBase {
    kind: 'date';
    defaultValue?: string;
}

export interface WidgetDateTimeField extends WidgetFieldBase {
    kind: 'datetime';
    defaultValue?: string;
    withSeconds?: boolean;
}

export interface WidgetSelectField extends WidgetFieldBase {
    kind: 'select';
    options: () => Array<{ value: string; label: string }>;
    defaultValue?: string;
}

export interface WidgetSwitchField extends WidgetFieldBase {
    kind: 'switch';
    defaultValue?: boolean;
}

export type WidgetField =
    | WidgetTextField
    | WidgetTextareaField
    | WidgetNumberField
    | WidgetDateField
    | WidgetDateTimeField
    | WidgetSelectField
    | WidgetSwitchField;

export const widgetFieldKinds: ReadonlySet<WidgetField['kind']> = new Set<
    WidgetField['kind']
>(['text', 'textarea', 'number', 'date', 'datetime', 'select', 'switch']);

export const labelFieldName = 'label';

export interface WidgetMetaBase {
    type: string;
    label: () => string;
    description?: () => string;
    fields?: ReadonlyArray<WidgetField>;
}

export interface WidgetModuleBase<TProps> {
    widgetMeta: WidgetMetaBase;
    default: ComponentType<TProps>;
}

export type WidgetDefinition<TMeta extends WidgetMetaBase, TProps> = TMeta & {
    fields: ReadonlyArray<WidgetField>;
    Component: ComponentType<TProps>;
};

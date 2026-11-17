import type { ComponentType } from 'react';

export type WidgetFieldValue = string | number | boolean;

export type WidgetConfig = Record<string, WidgetFieldValue>;

export type StoredWidgetValue = string | number | boolean | null;

export type StoredWidgetConfig = Record<string, StoredWidgetValue>;

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

export interface WidgetNumberField extends WidgetFieldBase {
    kind: 'number';
    min?: number;
    max?: number;
    step?: number;
    defaultValue?: number;
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
    | WidgetNumberField
    | WidgetDateTimeField
    | WidgetSelectField
    | WidgetSwitchField;

export interface HeaderWidgetProps {
    id: string;
    label: string;
    config: WidgetConfig;
}

export interface HeaderWidgetMeta {
    type: string;
    label: () => string;
    description?: () => string;
    fields?: ReadonlyArray<WidgetField>;
}

export interface HeaderWidgetModule {
    widgetMeta: HeaderWidgetMeta;
    default: ComponentType<HeaderWidgetProps>;
}

export interface HeaderWidgetDefinition extends HeaderWidgetMeta {
    fields: ReadonlyArray<WidgetField>;
    Component: ComponentType<HeaderWidgetProps>;
}

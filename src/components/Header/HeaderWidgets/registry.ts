import { getLocale } from '#/paraglide/runtime';

import type {
    HeaderWidgetDefinition,
    HeaderWidgetModule,
    WidgetField,
} from './types';

const modules = import.meta.glob<unknown>('./*Widget.tsx', { eager: true });

const FIELD_KINDS: ReadonlySet<string> = new Set<WidgetField['kind']>([
    'text',
    'number',
    'datetime',
    'select',
    'switch',
]);

function isHeaderWidgetModule(module: unknown): module is HeaderWidgetModule {
    if (typeof module !== 'object' || module === null) return false;

    const { widgetMeta, default: component } = module as Partial<
        Record<'widgetMeta' | 'default', unknown>
    >;

    if (typeof component !== 'function') return false;
    if (typeof widgetMeta !== 'object' || widgetMeta === null) return false;

    const { type, label } = widgetMeta as Partial<
        Record<'type' | 'label', unknown>
    >;

    return (
        typeof type === 'string' &&
        type.length > 0 &&
        typeof label === 'function'
    );
}

function validateFields(
    path: string,
    fields: ReadonlyArray<WidgetField>
): boolean {
    const seen = new Set<string>();

    for (const field of fields) {
        if (!field.name) {
            reportInvalidWidget(`${path} has a field without a \`name\`.`);
            return false;
        }

        if (seen.has(field.name)) {
            reportInvalidWidget(
                `${path} declares the field "${field.name}" twice; names must be unique because they are persisted in HeaderWidgetValue.name.`
            );
            return false;
        }

        if (!FIELD_KINDS.has(field.kind)) {
            reportInvalidWidget(
                `${path} declares field "${field.name}" with unknown kind "${field.kind}".`
            );
            return false;
        }

        if (typeof field.label !== 'function') {
            reportInvalidWidget(
                `${path} must declare \`label\` on field "${field.name}" as a function, so the active locale is resolved at render time.`
            );
            return false;
        }

        seen.add(field.name);
    }

    return true;
}

function collectWidgets(): Array<HeaderWidgetDefinition> {
    const byType = new Map<string, HeaderWidgetDefinition>();

    for (const [path, module] of Object.entries(modules)) {
        if (!isHeaderWidgetModule(module)) {
            reportInvalidWidget(
                `${path} must default-export a component and export \`widgetMeta\` with a non-empty \`type\` and a \`label\` function (a function, so the active locale is resolved at render time).`
            );
            continue;
        }

        const meta = module.widgetMeta;

        if (byType.has(meta.type)) {
            reportInvalidWidget(
                `${path} reuses the widget type "${meta.type}"; types must be unique because they are persisted in HeaderWidget.type.`
            );
            continue;
        }

        const fields = meta.fields ?? [];

        if (!validateFields(path, fields)) continue;

        byType.set(meta.type, {
            ...meta,
            fields,
            Component: module.default,
        });
    }

    return [...byType.values()].sort((a, b) => a.type.localeCompare(b.type));
}

function reportInvalidWidget(message: string): void {
    const text = `[HeaderWidgets] ${message}`;

    if (import.meta.env.DEV) {
        throw new Error(text);
    }

    console.error(text);
}

export const headerWidgets: Array<HeaderWidgetDefinition> = collectWidgets();

const headerWidgetsByType = new Map(
    headerWidgets.map((widget) => [widget.type, widget])
);

export function getHeaderWidget(
    type: string
): HeaderWidgetDefinition | undefined {
    return headerWidgetsByType.get(type);
}

export function headerWidgetOptions(): Array<{
    value: string;
    label: string;
}> {
    const locale = getLocale();

    return headerWidgets
        .map((widget) => ({ value: widget.type, label: widget.label() }))
        .sort((a, b) => a.label.localeCompare(b.label, locale));
}

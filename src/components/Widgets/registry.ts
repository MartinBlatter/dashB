import { getLocale } from '#/paraglide/runtime';

import { labelFieldName, widgetFieldKinds } from './types';

import type {
    WidgetDefinition,
    WidgetField,
    WidgetMetaBase,
    WidgetModuleBase,
} from './types';

export interface WidgetRegistry<TMeta extends WidgetMetaBase, TProps> {
    all: Array<WidgetDefinition<TMeta, TProps>>;
    get: (type: string) => WidgetDefinition<TMeta, TProps> | undefined;
    options: () => Array<{ value: string; label: string }>;
}

export function createWidgetRegistry<TMeta extends WidgetMetaBase, TProps>(
    namespace: string,
    modules: Record<string, unknown>
): WidgetRegistry<TMeta, TProps> {
    const byType = new Map<string, WidgetDefinition<TMeta, TProps>>();

    function report(message: string): void {
        const text = `[${namespace}] ${message}`;

        if (import.meta.env.DEV) throw new Error(text);

        console.error(text);
    }

    for (const [path, module] of Object.entries(modules)) {
        if (!isWidgetModule<TProps>(module)) {
            report(
                `${path} must default-export a component and export \`widgetMeta\` with a non-empty \`type\` and a \`label\` function (a function, so the active locale is resolved at render time).`
            );
            continue;
        }

        const meta = module.widgetMeta as TMeta;

        if (byType.has(meta.type)) {
            report(
                `${path} reuses the widget type "${meta.type}"; types must be unique because they are persisted on the widget row.`
            );
            continue;
        }

        const fields = meta.fields ?? [];

        if (!validateFields(path, fields, report)) continue;

        byType.set(meta.type, { ...meta, fields, Component: module.default });
    }

    const all = [...byType.values()].sort((a, b) =>
        a.type.localeCompare(b.type)
    );

    return {
        all,
        get: (type) => byType.get(type),
        options: () => {
            const locale = getLocale();

            return all
                .map((widget) => ({
                    value: widget.type,
                    label: widget.label(),
                }))
                .sort((a, b) => a.label.localeCompare(b.label, locale));
        },
    };
}

function isWidgetModule<TProps>(
    module: unknown
): module is WidgetModuleBase<TProps> {
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
    fields: ReadonlyArray<WidgetField>,
    report: (message: string) => void
): boolean {
    const seen = new Set<string>();

    for (const field of fields) {
        if (!field.name) {
            report(`${path} has a field without a \`name\`.`);
            return false;
        }

        if (field.name === labelFieldName) {
            report(
                `${path} declares a field named "${labelFieldName}", which is reserved for the widget's own name.`
            );
            return false;
        }

        if (seen.has(field.name)) {
            report(
                `${path} declares the field "${field.name}" twice; names must be unique because they key the stored config.`
            );
            return false;
        }

        if (!widgetFieldKinds.has(field.kind)) {
            report(
                `${path} declares field "${field.name}" with unknown kind "${field.kind}".`
            );
            return false;
        }

        if (typeof field.label !== 'function') {
            report(
                `${path} must declare \`label\` on field "${field.name}" as a function, so the active locale is resolved at render time.`
            );
            return false;
        }

        seen.add(field.name);
    }

    return true;
}

import { m } from '#/paraglide/messages';

import { labelFieldName } from './types';
import { fromStoredValues } from './values';

import type { StoredWidgetValues, WidgetField, WidgetValues } from './types';

const labelField: WidgetField = {
    kind: 'text',
    name: labelFieldName,
    label: () => m['widget.label'](),
    placeholder: () => m['widget.label_placeholder'](),
    required: true,
    maxLength: 60,
};

export function widgetConfigFields(
    fields: ReadonlyArray<WidgetField>
): Array<WidgetField> {
    return [labelField, ...fields];
}

export function widgetConfigValues(
    fields: ReadonlyArray<WidgetField>,
    label: string,
    config: unknown
): WidgetValues {
    return { ...fromStoredValues(fields, config), [labelFieldName]: label };
}

export function splitWidgetConfig(values: StoredWidgetValues): {
    label: string;
    config: StoredWidgetValues;
} {
    const { [labelFieldName]: label, ...config } = values;

    return { label: typeof label === 'string' ? label : '', config };
}

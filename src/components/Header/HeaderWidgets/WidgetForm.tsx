import { useState } from 'react';
import { Text } from '@mantine/core';

import { useAppForm } from '#/components/Form/Form';
import { m } from '#/paraglide/messages';

import { WidgetConfigFields } from './WidgetConfigFields';
import { widgetFormSchema } from './validation';
import { toStoredConfig, widgetConfigDefaults } from './values';

import type {
    HeaderWidgetDefinition,
    StoredWidgetConfig,
    WidgetConfig,
} from './types';

export default function WidgetForm({
    widget,
    initialLabel,
    initialConfig,
    submitLabel,
    onSubmit,
}: {
    widget: HeaderWidgetDefinition;
    initialLabel?: string;
    initialConfig?: WidgetConfig;
    submitLabel: string;
    onSubmit: (values: {
        label: string;
        config: StoredWidgetConfig;
    }) => Promise<void>;
}) {
    const [submitError, setSubmitError] = useState<string | null>(null);

    const form = useAppForm({
        defaultValues: {
            label: initialLabel ?? widget.label(),
            config: initialConfig ?? widgetConfigDefaults(widget.fields),
        },
        validators: { onSubmit: widgetFormSchema(widget.fields) },
        onSubmit: async ({ value }) => {
            setSubmitError(null);

            try {
                await onSubmit({
                    label: value.label,
                    config: toStoredConfig(widget.fields, value.config),
                });
            } catch {
                setSubmitError(m['header.widget_form.save_failed']());
            }
        },
    });

    return (
        <form.AppForm>
            <form.FormRoot gap="sm">
                {widget.description ? (
                    <Text size="sm" c="dimmed">
                        {widget.description()}
                    </Text>
                ) : null}

                <form.AppField name="label">
                    {(field) => (
                        <field.TextField
                            label={m['header.widget_label']()}
                            placeholder={m['header.widget_label_placeholder']()}
                            withAsterisk
                        />
                    )}
                </form.AppField>

                <WidgetConfigFields form={form} fields={widget.fields} />

                {submitError ? (
                    <Text size="sm" c="red">
                        {submitError}
                    </Text>
                ) : null}

                <form.SubmitButton>{submitLabel}</form.SubmitButton>
            </form.FormRoot>
        </form.AppForm>
    );
}

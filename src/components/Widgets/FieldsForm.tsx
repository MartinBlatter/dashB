import { useState } from 'react';
import { Text } from '@mantine/core';

import { useAppForm } from '#/components/Form/Form';
import { m } from '#/paraglide/messages';

import { FieldInputs } from './FieldInputs';
import { widgetValuesSchema } from './validation';
import { toStoredValues, widgetValueDefaults } from './values';

import type { StoredWidgetValues, WidgetField, WidgetValues } from './types';

export default function FieldsForm({
    fields,
    description,
    initialValues,
    submitLabel,
    onSubmit,
}: {
    fields: ReadonlyArray<WidgetField>;
    description?: string;
    initialValues?: WidgetValues;
    submitLabel: string;
    onSubmit: (values: StoredWidgetValues) => Promise<void>;
}) {
    const [submitError, setSubmitError] = useState<string | null>(null);

    const form = useAppForm({
        defaultValues: {
            values: initialValues ?? widgetValueDefaults(fields),
        },
        validators: { onSubmit: widgetValuesSchema(fields) },
        onSubmit: async ({ value }) => {
            setSubmitError(null);

            try {
                await onSubmit(toStoredValues(fields, value.values));
            } catch {
                setSubmitError(m['widget.form.save_failed']());
            }
        },
    });

    return (
        <form.AppForm>
            <form.FormRoot gap="sm">
                {description ? (
                    <Text size="sm" c="dimmed">
                        {description}
                    </Text>
                ) : null}

                <FieldInputs
                    form={form}
                    fields="values"
                    widgetFields={fields}
                />

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

import { withForm } from '#/components/Form/Form';

import type { WidgetField, WidgetValues } from './types';

const emptyValues: WidgetValues = {};

export const FieldInputs = withForm({
    defaultValues: { values: emptyValues },
    props: { fields: [] as ReadonlyArray<WidgetField> },
    render: ({ form, fields }) => (
        <>
            {fields.map((field) => (
                <form.AppField key={field.name} name={`values.${field.name}`}>
                    {(bound) => {
                        const label = field.label();
                        const description = field.description?.();

                        switch (field.kind) {
                            case 'text':
                                return (
                                    <bound.TextField
                                        label={label}
                                        description={description}
                                        placeholder={field.placeholder?.()}
                                        maxLength={field.maxLength}
                                        withAsterisk={field.required}
                                    />
                                );

                            case 'number':
                                return (
                                    <bound.NumberField
                                        label={label}
                                        description={description}
                                        min={field.min}
                                        max={field.max}
                                        step={field.step}
                                        withAsterisk={field.required}
                                    />
                                );

                            case 'date':
                                return (
                                    <bound.DateField
                                        label={label}
                                        description={description}
                                        withAsterisk={field.required}
                                    />
                                );

                            case 'datetime':
                                return (
                                    <bound.DateTimeField
                                        label={label}
                                        description={description}
                                        withSeconds={field.withSeconds}
                                        withAsterisk={field.required}
                                    />
                                );

                            case 'select':
                                return (
                                    <bound.SelectField
                                        label={label}
                                        description={description}
                                        data={field.options()}
                                        withAsterisk={field.required}
                                    />
                                );

                            case 'switch':
                                return (
                                    <bound.SwitchField
                                        label={label}
                                        description={description}
                                    />
                                );
                        }
                    }}
                </form.AppField>
            ))}
        </>
    ),
});

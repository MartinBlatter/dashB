import dayjs from 'dayjs';
import { z } from 'zod';

import { m } from '#/paraglide/messages';

import type { WidgetField, WidgetFieldValue } from './types';

function widgetFieldSchema(
    field: WidgetField
): z.ZodType<WidgetFieldValue, WidgetFieldValue> {
    const required = field.required ?? false;

    switch (field.kind) {
        case 'text':
        case 'textarea': {
            let schema = z.string();

            if (field.maxLength !== undefined) {
                schema = schema.max(field.maxLength, {
                    error: () =>
                        m['widget.form.too_long']({
                            count: field.maxLength ?? 0,
                        }),
                });
            }

            return required
                ? schema.min(1, {
                      error: () => m['widget.form.required'](),
                  })
                : schema;
        }

        case 'number': {
            let schema = z.number({
                error: () => m['widget.form.invalid_number'](),
            });

            if (field.min !== undefined) {
                schema = schema.min(field.min, {
                    error: () =>
                        m['widget.form.too_small']({ min: field.min ?? 0 }),
                });
            }

            if (field.max !== undefined) {
                schema = schema.max(field.max, {
                    error: () =>
                        m['widget.form.too_large']({ max: field.max ?? 0 }),
                });
            }

            return required ? schema : z.union([z.literal(''), schema]);
        }

        case 'date':
            return z
                .string()
                .refine((value) => value !== '' || !required, {
                    error: () => m['widget.form.required'](),
                })
                .refine((value) => value === '' || dayjs(value).isValid(), {
                    error: () => m['widget.form.invalid_day'](),
                });

        case 'datetime':
            return z
                .string()
                .refine((value) => value !== '' || !required, {
                    error: () => m['widget.form.required'](),
                })
                .refine((value) => value === '' || dayjs(value).isValid(), {
                    error: () => m['widget.form.invalid_date'](),
                });

        case 'select': {
            const allowed = new Set(
                field.options().map((option) => option.value)
            );

            return z
                .string()
                .refine(
                    (value) =>
                        (!required && value === '') || allowed.has(value),
                    { error: () => m['widget.form.required']() }
                );
        }

        case 'switch':
            return z.boolean();
    }
}

export function widgetValuesObject(fields: ReadonlyArray<WidgetField>) {
    return z.object(
        Object.fromEntries(
            fields.map((field) => [field.name, widgetFieldSchema(field)])
        )
    );
}

export function widgetValuesSchema(fields: ReadonlyArray<WidgetField>) {
    return z.object({ values: widgetValuesObject(fields) });
}

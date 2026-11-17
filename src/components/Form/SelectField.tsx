import { Select } from '@mantine/core';

import { useBoundField } from './use-bound-field';

import type { BoundInputProps } from './use-bound-field';
import type { SelectProps } from '@mantine/core';

/**
 * Mantine `Select` bound to the field named by the surrounding
 * `form.AppField`.
 *
 * Clearing the input reports `null`, which is stored as `''` so the bound value
 * stays a string and validators do not have to handle both.
 */
export function SelectField(props: Omit<SelectProps, BoundInputProps>) {
    const { field, value, error } = useBoundField<string>();

    return (
        <Select
            {...props}
            value={value}
            onChange={(next) => field.handleChange(next ?? '')}
            onBlur={field.handleBlur}
            error={error}
        />
    );
}

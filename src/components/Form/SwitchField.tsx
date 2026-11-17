import { Switch } from '@mantine/core';

import { useBoundField } from './use-bound-field';

import type { BoundInputProps } from './use-bound-field';
import type { SwitchProps } from '@mantine/core';

/**
 * Mantine `Switch` bound to the field named by the surrounding
 * `form.AppField`. Binds `checked` rather than `value`, which `Switch` ignores.
 */
export function SwitchField(
    props: Omit<SwitchProps, BoundInputProps | 'checked' | 'defaultChecked'>
) {
    const { field, value, error } = useBoundField<boolean>();

    return (
        <Switch
            {...props}
            checked={value}
            onChange={(event) =>
                field.handleChange(event.currentTarget.checked)
            }
            onBlur={field.handleBlur}
            error={error}
        />
    );
}

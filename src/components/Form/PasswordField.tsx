import { PasswordInput } from '@mantine/core';

import { useBoundField } from './use-bound-field';

import type { BoundInputProps } from './use-bound-field';
import type { PasswordInputProps } from '@mantine/core';

/**
 * Mantine `PasswordInput` bound to the field named by the surrounding
 * `form.AppField`. Every other `PasswordInput` prop still passes through.
 */
export function PasswordField(
    props: Omit<PasswordInputProps, BoundInputProps>
) {
    const { field, value, error } = useBoundField<string>();

    return (
        <PasswordInput
            {...props}
            value={value}
            onChange={(event) => field.handleChange(event.currentTarget.value)}
            onBlur={field.handleBlur}
            error={error}
        />
    );
}

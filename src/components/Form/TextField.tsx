import { TextInput } from '@mantine/core';

import { useBoundField } from './use-bound-field';

import type { BoundInputProps } from './use-bound-field';
import type { TextInputProps } from '@mantine/core';

/**
 * Mantine `TextInput` bound to the field named by the surrounding
 * `form.AppField`. Every other `TextInput` prop still passes through.
 */
export function TextField(props: Omit<TextInputProps, BoundInputProps>) {
    const { field, value, error } = useBoundField<string>();

    return (
        <TextInput
            {...props}
            value={value}
            onChange={(event) => field.handleChange(event.currentTarget.value)}
            onBlur={field.handleBlur}
            error={error}
        />
    );
}

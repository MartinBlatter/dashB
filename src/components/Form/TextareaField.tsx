import { Textarea } from '@mantine/core';

import { useBoundField } from './use-bound-field';

import type { BoundInputProps } from './use-bound-field';
import type { TextareaProps } from '@mantine/core';

export function TextareaField(props: Omit<TextareaProps, BoundInputProps>) {
    const { field, value, error } = useBoundField<string>();

    return (
        <Textarea
            autosize
            minRows={2}
            maxRows={8}
            {...props}
            value={value}
            onChange={(event) => field.handleChange(event.currentTarget.value)}
            onBlur={field.handleBlur}
            error={error}
        />
    );
}

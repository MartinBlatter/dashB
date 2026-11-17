import { NumberInput } from '@mantine/core';

import { useBoundField } from './use-bound-field';

import type { BoundInputProps } from './use-bound-field';
import type { NumberInputProps } from '@mantine/core';

/**
 * Mantine `NumberInput` bound to the field named by the surrounding
 * `form.AppField`.
 *
 * The bound value is `number | ''` — `''` is what the input reports while
 * empty, and validators have to treat it as "missing" rather than as `0`.
 */
export function NumberField(props: Omit<NumberInputProps, BoundInputProps>) {
    const { field, value, error } = useBoundField<number | ''>();

    return (
        <NumberInput
            {...props}
            value={value}
            onChange={(next) =>
                field.handleChange(typeof next === 'string' ? '' : next)
            }
            onBlur={field.handleBlur}
            error={error}
        />
    );
}

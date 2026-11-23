import { useState } from 'react';
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
    const [draft, setDraft] = useState<string | null>(null);

    function handleChange(next: number | string) {
        if (typeof next !== 'string') {
            setDraft(null);
            field.handleChange(next);

            return;
        }

        setDraft(next);

        const parsed = Number(next);

        field.handleChange(
            next.trim() !== '' && Number.isFinite(parsed) ? parsed : ''
        );
    }

    return (
        <NumberInput
            {...props}
            value={draft ?? value}
            onChange={handleChange}
            onBlur={() => {
                setDraft(null);
                field.handleBlur();
            }}
            error={error}
        />
    );
}

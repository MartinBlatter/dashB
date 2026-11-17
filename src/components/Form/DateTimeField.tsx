import { DateTimePicker } from '@mantine/dates';

import { useBoundField } from './use-bound-field';

import type { BoundInputProps } from './use-bound-field';
import type { DateTimePickerProps } from '@mantine/dates';

/**
 * Mantine `DateTimePicker` bound to the field named by the surrounding
 * `form.AppField`.
 *
 * The bound value is a `YYYY-MM-DD HH:mm:ss` string, which is what the picker
 * reports, and `''` while empty — the picker itself wants `null` for that, so
 * the two are translated here rather than at every call site.
 *
 * Requires `@mantine/dates/styles.css`, imported once in `__root.tsx`.
 */
export function DateTimeField(
    props: Omit<DateTimePickerProps, BoundInputProps>
) {
    const { field, value, error } = useBoundField<string>();

    return (
        <DateTimePicker
            {...props}
            value={value === '' ? null : value}
            onChange={(next) => field.handleChange(next ?? '')}
            onBlur={field.handleBlur}
            error={error}
        />
    );
}

import { DatePickerInput } from '@mantine/dates';

import { useBoundField } from './use-bound-field';

import type { BoundInputProps } from './use-bound-field';
import type { DatePickerInputProps } from '@mantine/dates';

export function DateField(props: Omit<DatePickerInputProps, BoundInputProps>) {
    const { field, value, error } = useBoundField<string>();

    return (
        <DatePickerInput
            valueFormat="YYYY-MM-DD"
            {...props}
            value={value === '' ? null : value}
            onChange={(next) => field.handleChange(next ?? '')}
            onBlur={field.handleBlur}
            error={error}
        />
    );
}

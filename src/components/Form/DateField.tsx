import { DatePickerInput } from '@mantine/dates';

import { pickerDateFormat } from '#/lib/date-format';
import { useDateFormat } from '#/lib/user-settings';

import { useBoundField } from './use-bound-field';

import type { BoundInputProps } from './use-bound-field';
import type { DatePickerInputProps } from '@mantine/dates';

export function DateField(props: Omit<DatePickerInputProps, BoundInputProps>) {
    const { field, value, error } = useBoundField<string>();
    const dateFormat = useDateFormat();

    return (
        <DatePickerInput
            valueFormat={pickerDateFormat(dateFormat)}
            {...props}
            value={value === '' ? null : value}
            onChange={(next) => field.handleChange(next ?? '')}
            onBlur={field.handleBlur}
            error={error}
        />
    );
}

import { Button } from '@mantine/core';
import { useSelector } from '@tanstack/react-form';

import { useFormContext } from './form-context';

import type { ButtonProps } from '@mantine/core';

/**
 * Submit button that shows the form's in-flight state, so routes no longer
 * wrap a button in `form.Subscribe` to read `isSubmitting`.
 *
 * Must be rendered inside `form.AppForm`, which provides the form context.
 */
export function SubmitButton(props: Omit<ButtonProps, 'loading'>) {
    const form = useFormContext();
    const isSubmitting = useSelector(form.store, (state) => state.isSubmitting);

    return <Button {...props} type="submit" loading={isSubmitting} />;
}

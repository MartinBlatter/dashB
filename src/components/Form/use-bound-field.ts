import { useSelector } from '@tanstack/react-form';

import { errorText } from '#/lib/form-errors';

import { useFieldContext } from './form-context';

/**
 * Props a bound field component owns. Omitting them from a field's public prop
 * type turns passing one from a call site into a type error rather than a
 * value that is silently overwritten by the binding.
 */
export type BoundInputProps =
    'value' | 'defaultValue' | 'onChange' | 'onBlur' | 'error';

/**
 * Subscribes to the field bound by the surrounding `form.AppField`.
 *
 * Reads go through `useSelector` rather than `field.state` directly: the field
 * object keeps the same identity across updates, so the React Compiler
 * (enabled in `vite.config.ts`) can treat a `field.state.value` read as
 * unchanged and serve a stale value. Subscribing also narrows re-renders to
 * the one input instead of the whole form.
 *
 * Errors stay hidden until the field is touched, so a freshly opened form is
 * not covered in red. `handleSubmit` marks every field touched before it
 * validates, so submit-time errors still reach untouched fields.
 */
export function useBoundField<TValue = string>() {
    const field = useFieldContext<TValue>();
    const value = useSelector(field.store, (state) => state.value);
    const error = useSelector(field.store, (state) =>
        state.meta.isTouched ? errorText(state.meta.errors) : undefined
    );

    return { field, value, error };
}

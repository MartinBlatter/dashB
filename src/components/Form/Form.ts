import { createFormHook } from '@tanstack/react-form';

import { FormRoot } from './FormRoot';
import { PasswordField } from './PasswordField';
import { SubmitButton } from './SubmitButton';
import { TextField } from './TextField';
import { fieldContext, formContext } from './form-context';

/**
 * Mantine inputs bound to TanStack Form once, so routes declare which field
 * goes where instead of re-plumbing value/onChange/onBlur/error on every
 * input.
 *
 * ```tsx
 * const form = useAppForm({
 *     defaultValues: { email: '' },
 *     validators: { onSubmit: schema },
 *     onSubmit: async ({ value }) => { ... },
 * });
 *
 * <form.AppForm>
 *     <form.FormRoot>
 *         <form.AppField name="email">
 *             {(field) => <field.TextField label="Email" type="email" />}
 *         </form.AppField>
 *         <form.SubmitButton fullWidth>Sign in</form.SubmitButton>
 *     </form.FormRoot>
 * </form.AppForm>
 * ```
 *
 * Field components hang off the `AppField` render argument, form components
 * off the form itself. `name` is checked against `defaultValues`, but the
 * value *type* is not: pointing `TextField` at a non-string field compiles
 * and then misbehaves at runtime.
 *
 * Adding an input type means one more file next to this one, registered in
 * `fieldComponents` below.
 */
export const { useAppForm, withForm } = createFormHook({
    fieldContext,
    formContext,
    fieldComponents: { TextField, PasswordField },
    formComponents: { FormRoot, SubmitButton },
});

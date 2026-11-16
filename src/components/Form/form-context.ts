import { createFormHookContexts } from '@tanstack/react-form';

/**
 * Kept out of `Form.ts` because the dependency runs both ways: the field
 * components need `useFieldContext`, and `createFormHook` needs the field
 * components. Everything imports the contexts from here instead, which breaks
 * the cycle.
 */
export const { fieldContext, formContext, useFieldContext, useFormContext } =
    createFormHookContexts();

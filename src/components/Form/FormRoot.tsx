import { Stack } from '@mantine/core';

import { useFormContext } from './form-context';

import type { StackProps } from '@mantine/core';
import type { ReactNode } from 'react';

/**
 * The `<form>` element plus the submit wiring every form otherwise repeats:
 * suppress the browser's native navigation and hand off to TanStack Form.
 *
 * Children sit in a vertical `Stack`, which is what the forms in this app
 * want. A form needing a different layout can still render a plain `<form>`
 * and call `form.handleSubmit()` itself.
 *
 * Must be rendered inside `form.AppForm`, which provides the form context.
 */
export function FormRoot({
    children,
    gap,
}: {
    children: ReactNode;
    gap?: StackProps['gap'];
}) {
    const form = useFormContext();

    return (
        <form
            onSubmit={(event) => {
                event.preventDefault();
                void form.handleSubmit();
            }}
        >
            <Stack gap={gap}>{children}</Stack>
        </form>
    );
}

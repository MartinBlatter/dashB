/**
 * TanStack Form reports validation issues as whatever the validator produced —
 * strings for inline validators, Standard Schema issue objects for Zod. This
 * flattens either shape into a single message for Mantine's `error` prop.
 */
export function errorText(errors: ReadonlyArray<unknown>): string | undefined {
    const messages = errors
        .map((error) => {
            if (typeof error === 'string') {
                return error;
            }

            if (error && typeof error === 'object' && 'message' in error) {
                return String((error as { message?: unknown }).message ?? '');
            }

            return '';
        })
        .filter((message) => message.length > 0);

    return messages.length > 0 ? messages.join(' ') : undefined;
}

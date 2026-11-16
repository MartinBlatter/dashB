import { useState } from 'react';
import { Alert } from '@mantine/core';
import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute, redirect, useRouter } from '@tanstack/react-router';
import { z } from 'zod';

import { AnchorLink } from '#/components/AnchorLink/AnchorLink';
import AuthCard from '#/components/AuthCard/AuthCard';
import { useAppForm } from '#/components/Form/Form';
import { authClient } from '#/lib/auth-client';
import { safeRedirectTarget } from '#/lib/auth-routes';
import { sessionQueryKey } from '#/lib/session';
import { m } from '#/paraglide/messages';

const searchSchema = z.object({
    redirect: z.string().optional(),
});

const signInSchema = z.object({
    email: z.email({ error: () => m['auth.invalidEmail']() }),
    password: z.string().min(1, { error: () => m['auth.passwordRequired']() }),
});

export const Route = createFileRoute('/login')({
    validateSearch: searchSchema,
    beforeLoad: ({ context, search }) => {
        if (context.user) {
            throw redirect({ href: safeRedirectTarget(search.redirect) });
        }
    },
    component: LoginPage,
});

function LoginPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const search = Route.useSearch();
    const [submitError, setSubmitError] = useState<string | null>(null);

    const form = useAppForm({
        defaultValues: { email: '', password: '' },
        validators: { onSubmit: signInSchema },
        onSubmit: async ({ value }) => {
            setSubmitError(null);

            const { error } = await authClient.signIn.email({
                email: value.email,
                password: value.password,
            });

            if (error) {
                setSubmitError(error.message ?? m['auth.signInFailed']());
                return;
            }

            await queryClient.invalidateQueries({ queryKey: sessionQueryKey });
            await router.navigate({
                href: safeRedirectTarget(search.redirect),
            });
        },
    });

    return (
        <AuthCard
            title={m['auth.signInTitle']()}
            subtitle={m['auth.signInSubtitle']()}
            footer={
                <>
                    {m['auth.noAccount']()}{' '}
                    <AnchorLink
                        to="/register"
                        search={{ redirect: search.redirect }}
                    >
                        {m['auth.createAccount']()}
                    </AnchorLink>
                </>
            }
        >
            <form.AppForm>
                <form.FormRoot>
                    {submitError ? (
                        <Alert color="red" role="alert">
                            {submitError}
                        </Alert>
                    ) : null}

                    <form.AppField name="email">
                        {(field) => (
                            <field.TextField
                                label={m['auth.email']()}
                                type="email"
                                autoComplete="email"
                                required
                            />
                        )}
                    </form.AppField>

                    <form.AppField name="password">
                        {(field) => (
                            <field.PasswordField
                                label={m['auth.password']()}
                                autoComplete="current-password"
                                required
                            />
                        )}
                    </form.AppField>

                    <form.SubmitButton fullWidth>
                        {m['auth.signIn']()}
                    </form.SubmitButton>
                </form.FormRoot>
            </form.AppForm>
        </AuthCard>
    );
}

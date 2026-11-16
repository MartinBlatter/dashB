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

const minPasswordLength = 8;

const signUpSchema = z
    .object({
        name: z.string().min(1, { error: () => m['auth.nameRequired']() }),
        email: z.email({ error: () => m['auth.invalidEmail']() }),
        password: z.string().min(minPasswordLength, {
            error: () =>
                m['auth.passwordTooShort']({ count: minPasswordLength }),
        }),
        confirmPassword: z.string(),
    })
    .refine((value) => value.password === value.confirmPassword, {
        error: () => m['auth.passwordMismatch'](),
        path: ['confirmPassword'],
    });

export const Route = createFileRoute('/register')({
    validateSearch: searchSchema,
    beforeLoad: ({ context, search }) => {
        if (context.user) {
            throw redirect({ href: safeRedirectTarget(search.redirect) });
        }
    },
    component: RegisterPage,
});

function RegisterPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const search = Route.useSearch();
    const [submitError, setSubmitError] = useState<string | null>(null);

    const form = useAppForm({
        defaultValues: {
            name: '',
            email: '',
            password: '',
            confirmPassword: '',
        },
        validators: { onSubmit: signUpSchema },
        onSubmit: async ({ value }) => {
            setSubmitError(null);

            const { error } = await authClient.signUp.email({
                name: value.name,
                email: value.email,
                password: value.password,
            });

            if (error) {
                setSubmitError(error.message ?? m['auth.signUpFailed']());
                return;
            }

            // Better Auth signs the new account in automatically.
            await queryClient.invalidateQueries({ queryKey: sessionQueryKey });
            await router.navigate({
                href: safeRedirectTarget(search.redirect),
            });
        },
    });

    return (
        <AuthCard
            title={m['auth.signUpTitle']()}
            subtitle={m['auth.signUpSubtitle']()}
            footer={
                <>
                    {m['auth.haveAccount']()}{' '}
                    <AnchorLink
                        to="/login"
                        search={{ redirect: search.redirect }}
                    >
                        {m['auth.signIn']()}
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

                    <form.AppField name="name">
                        {(field) => (
                            <field.TextField
                                label={m['auth.name']()}
                                autoComplete="name"
                                required
                            />
                        )}
                    </form.AppField>

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
                                autoComplete="new-password"
                                required
                            />
                        )}
                    </form.AppField>

                    <form.AppField name="confirmPassword">
                        {(field) => (
                            <field.PasswordField
                                label={m['auth.confirmPassword']()}
                                autoComplete="new-password"
                                required
                            />
                        )}
                    </form.AppField>

                    <form.SubmitButton fullWidth>
                        {m['auth.signUp']()}
                    </form.SubmitButton>
                </form.FormRoot>
            </form.AppForm>
        </AuthCard>
    );
}

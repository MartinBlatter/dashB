import { useState } from 'react';
import { Button, Modal, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { PlusIcon } from '@phosphor-icons/react';
import { useQueryClient } from '@tanstack/react-query';

import { useAppForm } from '#/components/Form/Form';
import {
    createPage,
    pagesQueryKey,
    slugTakenError,
    usePageList,
} from '#/lib/pages';
import { m } from '#/paraglide/messages';

import { pageFormSchema } from './validation';

import type { ReactElement } from 'react';

export default function AddNewPageModal(): ReactElement {
    const [opened, { open, close }] = useDisclosure(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const queryClient = useQueryClient();
    const pages = usePageList();

    const parentOptions = pages.map((page) => ({
        value: page.id,
        label: page.title,
    }));

    function nextPosition(parentId: string | null): number {
        return pages.filter((page) => page.parentId === parentId).length;
    }

    const form = useAppForm({
        defaultValues: {
            title: '',
            slug: '',
            position: nextPosition(null),
            parentId: '',
        },
        validators: { onSubmit: pageFormSchema() },
        onSubmit: async ({ value }) => {
            setSubmitError(null);

            try {
                await createPage({
                    data: {
                        title: value.title,
                        slug: value.slug,
                        position: value.position,
                        parentId: value.parentId || null,
                    },
                });

                await queryClient.invalidateQueries({
                    queryKey: pagesQueryKey,
                });

                handleClose();
            } catch (error) {
                setSubmitError(
                    error instanceof Error &&
                        error.message.includes(slugTakenError)
                        ? m['navbar.page_form.slug_taken']()
                        : m['navbar.page_form.save_failed']()
                );
            }
        },
    });

    function handleClose() {
        close();
        setSubmitError(null);
        form.reset();
    }

    return (
        <>
            <Button
                leftSection={<PlusIcon size={14} />}
                variant="default"
                onClick={open}
            >
                {m['navbar.add_page']()}
            </Button>

            <Modal
                opened={opened}
                onClose={handleClose}
                title={m['navbar.add_page']()}
            >
                <form.AppForm>
                    <form.FormRoot gap="sm">
                        <form.AppField name="title">
                            {(field) => (
                                <field.TextField
                                    label={m['navbar.page_form.title']()}
                                    placeholder={m[
                                        'navbar.page_form.title_placeholder'
                                    ]()}
                                    withAsterisk
                                />
                            )}
                        </form.AppField>

                        <form.AppField name="slug">
                            {(field) => (
                                <field.TextField
                                    label={m['navbar.page_form.slug']()}
                                    placeholder={m[
                                        'navbar.page_form.slug_placeholder'
                                    ]()}
                                    withAsterisk
                                />
                            )}
                        </form.AppField>

                        <form.AppField
                            name="parentId"
                            listeners={{
                                onChange: ({ value }) => {
                                    form.setFieldValue(
                                        'position',
                                        nextPosition(value || null)
                                    );
                                },
                            }}
                        >
                            {(field) => (
                                <field.SelectField
                                    label={m['navbar.page_form.parent']()}
                                    placeholder={m[
                                        'navbar.page_form.parent_placeholder'
                                    ]()}
                                    data={parentOptions}
                                    nothingFoundMessage={m[
                                        'navbar.page_form.parent_empty'
                                    ]()}
                                    searchable
                                    clearable
                                />
                            )}
                        </form.AppField>

                        <form.AppField name="position">
                            {(field) => (
                                <field.NumberField
                                    label={m['navbar.page_form.position']()}
                                    min={0}
                                    step={1}
                                    allowDecimal={false}
                                    allowNegative={false}
                                />
                            )}
                        </form.AppField>

                        {submitError ? (
                            <Text size="sm" c="red">
                                {submitError}
                            </Text>
                        ) : null}

                        <form.SubmitButton>
                            {m['navbar.page_form.submit']()}
                        </form.SubmitButton>
                    </form.FormRoot>
                </form.AppForm>
            </Modal>
        </>
    );
}

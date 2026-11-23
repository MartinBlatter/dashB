import { useState } from 'react';
import { Button, Divider, Modal, Text } from '@mantine/core';
import { TrashIcon } from '@phosphor-icons/react';
import { useQueryClient } from '@tanstack/react-query';

import { useAppForm } from '#/components/Form/Form';
import {
    cycleError,
    descendantIds,
    pagesQueryKey,
    slugTakenError,
    updatePage,
    usePageList,
} from '#/lib/pages';
import { m } from '#/paraglide/messages';

import { pageFormSchema } from './validation';

import type { PageNode } from '#/lib/pages';
import type { ReactElement } from 'react';

export default function EditPageModal({
    page,
    onClose,
    onRequestDelete,
}: {
    page: PageNode | null;
    onClose: () => void;
    onRequestDelete: () => void;
}): ReactElement {
    return (
        <Modal
            opened={page !== null}
            onClose={onClose}
            title={m['navbar.edit_page']()}
        >
            {page ? (
                <EditPageForm
                    key={page.id}
                    page={page}
                    onClose={onClose}
                    onRequestDelete={onRequestDelete}
                />
            ) : null}
        </Modal>
    );
}

function EditPageForm({
    page,
    onClose,
    onRequestDelete,
}: {
    page: PageNode;
    onClose: () => void;
    onRequestDelete: () => void;
}): ReactElement {
    const [submitError, setSubmitError] = useState<string | null>(null);
    const queryClient = useQueryClient();
    const pages = usePageList();

    const blocked = new Set([page.id, ...descendantIds(pages, page.id)]);
    const parentOptions = pages
        .filter((candidate) => !blocked.has(candidate.id))
        .map((candidate) => ({ value: candidate.id, label: candidate.title }));

    function positionFor(parentId: string | null): number {
        if (parentId === page.parentId) return page.position;

        return pages.filter(
            (candidate) =>
                candidate.parentId === parentId && candidate.id !== page.id
        ).length;
    }

    const form = useAppForm({
        defaultValues: {
            title: page.title,
            slug: page.slug,
            position: page.position,
            parentId: page.parentId ?? '',
        },
        validators: { onSubmit: pageFormSchema() },
        onSubmit: async ({ value }) => {
            setSubmitError(null);

            try {
                const next = await updatePage({
                    data: {
                        id: page.id,
                        title: value.title,
                        slug: value.slug,
                        position: value.position,
                        parentId: value.parentId || null,
                    },
                });

                queryClient.setQueryData(pagesQueryKey, next);

                await queryClient.invalidateQueries({
                    queryKey: pagesQueryKey,
                });

                onClose();
            } catch (error) {
                setSubmitError(errorMessage(error));
            }
        },
    });

    return (
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
                            label={m['navbar.page_form.address']()}
                            description={m['navbar.page_form.address_hint']()}
                            placeholder={m[
                                'navbar.page_form.address_placeholder'
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
                                positionFor(value || null)
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
                    {m['navbar.page_form.save']()}
                </form.SubmitButton>

                <Divider />

                <Button
                    fullWidth
                    variant="subtle"
                    color="red"
                    leftSection={<TrashIcon size={14} />}
                    onClick={onRequestDelete}
                >
                    {m['navbar.delete_page']()}
                </Button>
            </form.FormRoot>
        </form.AppForm>
    );
}

function errorMessage(error: unknown): string {
    if (!(error instanceof Error)) return m['navbar.page_form.save_failed']();

    if (error.message.includes(slugTakenError)) {
        return m['navbar.page_form.address_taken']();
    }

    if (error.message.includes(cycleError)) {
        return m['navbar.page_form.invalid_parent']();
    }

    return m['navbar.page_form.save_failed']();
}

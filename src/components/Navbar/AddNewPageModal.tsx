import { useRef, useState } from 'react';
import { Button, Divider, Modal, Select, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { PlusIcon } from '@phosphor-icons/react';
import { useQueryClient } from '@tanstack/react-query';

import { useAppForm } from '#/components/Form/Form';
import {
    getPageType,
    pageTypeOptions,
} from '#/components/Pages/PageTypes/registry';
import { FieldInputs } from '#/components/Widgets/FieldInputs';
import {
    toStoredValues,
    widgetValueDefaults,
} from '#/components/Widgets/values';
import {
    createPage,
    pagesQueryKey,
    slugTakenError,
    usePageList,
} from '#/lib/pages';
import { slugify } from '#/lib/slug';
import { m } from '#/paraglide/messages';

import { newPageFormSchema } from './validation';

import type { WidgetValues } from '#/components/Widgets/types';
import type { ReactElement } from 'react';

const emptyValues: WidgetValues = {};

export default function AddNewPageModal(): ReactElement {
    const [opened, { open, close }] = useDisclosure(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [type, setType] = useState<string | null>(null);
    const [typeError, setTypeError] = useState<string | null>(null);
    const slugTouched = useRef(false);
    const queryClient = useQueryClient();
    const pages = usePageList();

    const parentOptions = pages.map((page) => ({
        value: page.id,
        label: page.title,
    }));

    const selected = type ? getPageType(type) : undefined;
    const fields = selected?.fields ?? [];

    function nextPosition(parentId: string | null): number {
        return pages.filter((page) => page.parentId === parentId).length;
    }

    const form = useAppForm({
        defaultValues: {
            title: '',
            slug: '',
            position: nextPosition(null),
            parentId: '',
            values: emptyValues,
        },
        validators: { onSubmit: newPageFormSchema(fields) },
        onSubmit: async ({ value }) => {
            setSubmitError(null);

            if (!selected) {
                setTypeError(m['navbar.page_form.type_required']());
                return;
            }

            try {
                await createPage({
                    data: {
                        title: value.title,
                        slug: value.slug,
                        position: value.position,
                        parentId: value.parentId || null,
                        type: selected.type,
                        config: toStoredValues(selected.fields, value.values),
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
                        ? m['navbar.page_form.address_taken']()
                        : m['navbar.page_form.save_failed']()
                );
            }
        },
    });

    function handleTypeChange(next: string | null) {
        const definition = next ? getPageType(next) : undefined;

        setType(next);
        setTypeError(null);
        form.setFieldValue(
            'values',
            widgetValueDefaults(definition?.fields ?? [])
        );
    }

    function handleClose() {
        close();
        setSubmitError(null);
        setType(null);
        setTypeError(null);
        slugTouched.current = false;
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
                        <form.AppField
                            name="title"
                            listeners={{
                                onChange: ({ value }) => {
                                    if (slugTouched.current) return;

                                    form.setFieldValue('slug', slugify(value));
                                },
                            }}
                        >
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

                        <Select
                            label={m['page.type']()}
                            description={
                                selected?.description?.() ??
                                m['navbar.page_form.type_hint']()
                            }
                            placeholder={m['page.type_placeholder']()}
                            data={pageTypeOptions()}
                            value={type}
                            onChange={handleTypeChange}
                            error={typeError}
                            nothingFoundMessage={m['page.type_empty']()}
                            searchable
                            withAsterisk
                        />

                        <form.AppField
                            name="slug"
                            listeners={{
                                onChange: ({ value }) => {
                                    slugTouched.current =
                                        value !== '' &&
                                        value !==
                                            slugify(
                                                form.getFieldValue('title')
                                            );
                                },
                            }}
                        >
                            {(field) => (
                                <field.TextField
                                    label={m['navbar.page_form.address']()}
                                    description={m[
                                        'navbar.page_form.address_hint'
                                    ]()}
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

                        {fields.length > 0 ? (
                            <>
                                <Divider
                                    label={m[
                                        'navbar.page_form.type_settings'
                                    ]()}
                                    labelPosition="center"
                                />

                                <FieldInputs
                                    key={selected?.type}
                                    form={form}
                                    fields="values"
                                    widgetFields={fields}
                                />
                            </>
                        ) : null}

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

import { useState } from 'react';
import { Modal, Select, Stack } from '@mantine/core';
import { useQueryClient } from '@tanstack/react-query';

import FieldsForm from '#/components/Widgets/FieldsForm';
import { fromStoredValues } from '#/components/Widgets/values';
import { pagesQueryKey, setPageType } from '#/lib/pages';
import { m } from '#/paraglide/messages';

import { getPageType, pageTypeOptions } from './PageTypes/registry';

import type { PageNode } from '#/lib/pages';

export default function SetPageTypeModal({
    page,
    onClose,
}: {
    page: PageNode | null;
    onClose: () => void;
}) {
    const [type, setType] = useState<string | null>(null);
    const queryClient = useQueryClient();

    const options = pageTypeOptions();
    const selected = type ? getPageType(type) : undefined;

    function handleClose() {
        onClose();
        setType(null);
    }

    return (
        <Modal
            opened={page !== null}
            onClose={handleClose}
            title={m['page.set_type']()}
        >
            <Stack gap="sm">
                <Select
                    label={m['page.type']()}
                    placeholder={m['page.type_placeholder']()}
                    data={options}
                    value={type}
                    onChange={setType}
                    searchable
                    nothingFoundMessage={m['page.type_empty']()}
                />

                {page && selected ? (
                    <FieldsForm
                        key={selected.type}
                        fields={selected.fields}
                        description={selected.description?.()}
                        initialValues={fromStoredValues(selected.fields, {})}
                        submitLabel={m['page.set_type_submit']()}
                        onSubmit={async (config) => {
                            const next = await setPageType({
                                data: {
                                    id: page.id,
                                    type: selected.type,
                                    config,
                                },
                            });

                            queryClient.setQueryData(pagesQueryKey, next);

                            await queryClient.invalidateQueries({
                                queryKey: pagesQueryKey,
                            });

                            handleClose();
                        }}
                    />
                ) : null}
            </Stack>
        </Modal>
    );
}

import { useState } from 'react';
import { Modal, Select, Stack } from '@mantine/core';
import { useQueryClient } from '@tanstack/react-query';

import FieldsForm from '#/components/Widgets/FieldsForm';
import { fromStoredValues } from '#/components/Widgets/values';
import { pagesQueryKey, setPageType } from '#/lib/pages';
import { m } from '#/paraglide/messages';

import { getPageType, pageTypeOptions } from './PageTypes/registry';

import type { PageNode } from '#/lib/pages';
import type { ReactElement } from 'react';

export default function SetPageTypeModal({
    page,
    onClose,
}: {
    page: PageNode | null;
    onClose: () => void;
}): ReactElement {
    return (
        <Modal
            opened={page !== null}
            onClose={onClose}
            title={
                page && page.type !== null
                    ? m['page.settings']()
                    : m['page.set_type']()
            }
        >
            {page ? (
                <PageTypeForm key={page.id} page={page} onClose={onClose} />
            ) : null}
        </Modal>
    );
}

function PageTypeForm({
    page,
    onClose,
}: {
    page: PageNode;
    onClose: () => void;
}): ReactElement {
    const [type, setType] = useState<string | null>(page.type);
    const queryClient = useQueryClient();

    const options = pageTypeOptions();
    const selected = type ? getPageType(type) : undefined;

    return (
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

            {selected ? (
                <FieldsForm
                    key={selected.type}
                    fields={selected.fields}
                    description={selected.description?.()}
                    initialValues={fromStoredValues(
                        selected.fields,
                        selected.type === page.type ? page.config : {}
                    )}
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

                        onClose();
                    }}
                />
            ) : null}
        </Stack>
    );
}

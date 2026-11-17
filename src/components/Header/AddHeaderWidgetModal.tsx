import { useState } from 'react';
import { Button, Modal, Select, Stack } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { PlusIcon } from '@phosphor-icons/react';
import { useQueryClient } from '@tanstack/react-query';

import {
    createHeaderWidget,
    headerWidgetsQueryKey,
} from '#/lib/header-widgets';
import { m } from '#/paraglide/messages';

import WidgetForm from './HeaderWidgets/WidgetForm';
import { getHeaderWidget, headerWidgetOptions } from './HeaderWidgets/registry';

export default function AddHeaderWidgetModal() {
    const [opened, { open, close }] = useDisclosure(false);
    const [type, setType] = useState<string | null>(null);
    const queryClient = useQueryClient();

    const options = headerWidgetOptions();
    const selected = type ? getHeaderWidget(type) : undefined;

    function handleClose() {
        close();
        setType(null);
    }

    return (
        <>
            <Modal
                opened={opened}
                onClose={handleClose}
                title={m['header.add_widget']()}
            >
                <Stack gap="sm">
                    <Select
                        label={m['header.widget_type']()}
                        placeholder={m['header.widget_type_placeholder']()}
                        data={options}
                        value={type}
                        onChange={setType}
                        searchable
                        nothingFoundMessage={m['header.widget_type_empty']()}
                    />
                    {selected ? (
                        <WidgetForm
                            key={selected.type}
                            widget={selected}
                            submitLabel={m['header.add_widget']()}
                            onSubmit={async ({ label, config }) => {
                                await createHeaderWidget({
                                    data: {
                                        type: selected.type,
                                        label,
                                        config,
                                    },
                                });

                                await queryClient.invalidateQueries({
                                    queryKey: headerWidgetsQueryKey,
                                });

                                handleClose();
                            }}
                        />
                    ) : null}
                </Stack>
            </Modal>

            <Button leftSection={<PlusIcon size={14} />} onClick={open}>
                {m['header.add_widget']()}
            </Button>
        </>
    );
}

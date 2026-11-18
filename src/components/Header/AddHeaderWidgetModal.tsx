import { useState } from 'react';
import { Button, Modal, Select, Stack } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { PlusIcon } from '@phosphor-icons/react';
import { useQueryClient } from '@tanstack/react-query';

import FieldsForm from '#/components/Widgets/FieldsForm';
import {
    splitWidgetConfig,
    widgetConfigFields,
    widgetConfigValues,
} from '#/components/Widgets/config';
import {
    createHeaderWidget,
    headerWidgetsQueryKey,
} from '#/lib/header-widgets';
import { m } from '#/paraglide/messages';

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
                        <FieldsForm
                            key={selected.type}
                            fields={widgetConfigFields(selected.fields)}
                            description={selected.description?.()}
                            initialValues={widgetConfigValues(
                                selected.fields,
                                selected.label(),
                                {}
                            )}
                            submitLabel={m['header.add_widget']()}
                            onSubmit={async (values) => {
                                const { label, config } =
                                    splitWidgetConfig(values);

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

import { Button, Divider, Modal, Stack } from '@mantine/core';
import { TrashIcon } from '@phosphor-icons/react';
import { useQueryClient } from '@tanstack/react-query';

import {
    headerWidgetsQueryKey,
    updateHeaderWidget,
} from '#/lib/header-widgets';
import { m } from '#/paraglide/messages';

import WidgetForm from './HeaderWidgets/WidgetForm';
import { getHeaderWidget } from './HeaderWidgets/registry';
import { fromStoredConfig } from './HeaderWidgets/values';

import type { HeaderWidgetInstance } from '#/lib/header-widgets';

export default function EditHeaderWidgetModal({
    instance,
    onClose,
    onRequestDelete,
}: {
    instance: HeaderWidgetInstance | null;
    onClose: () => void;
    onRequestDelete: () => void;
}) {
    const queryClient = useQueryClient();
    const widget = instance ? getHeaderWidget(instance.type) : undefined;

    return (
        <Modal
            opened={Boolean(instance && widget)}
            onClose={onClose}
            title={m['header.edit_widget']()}
        >
            {instance && widget ? (
                <Stack gap="md">
                    <WidgetForm
                        key={instance.id}
                        widget={widget}
                        initialLabel={instance.label}
                        initialConfig={fromStoredConfig(
                            widget.fields,
                            instance.config
                        )}
                        submitLabel={m['header.save_widget']()}
                        onSubmit={async ({ label, config }) => {
                            await updateHeaderWidget({
                                data: { id: instance.id, label, config },
                            });

                            await queryClient.invalidateQueries({
                                queryKey: headerWidgetsQueryKey,
                            });

                            onClose();
                        }}
                    />

                    <Divider />

                    <Button
                        fullWidth
                        variant="subtle"
                        color="red"
                        leftSection={<TrashIcon size={14} />}
                        onClick={onRequestDelete}
                    >
                        {m['header.delete_widget']()}
                    </Button>
                </Stack>
            ) : null}
        </Modal>
    );
}

import { useState } from 'react';
import { Button, Group, Modal, Stack, Text } from '@mantine/core';
import { useQueryClient } from '@tanstack/react-query';

import {
    deleteHeaderWidget,
    headerWidgetsQueryKey,
} from '#/lib/header-widgets';
import { m } from '#/paraglide/messages';

import type { HeaderWidgetInstance } from '#/lib/header-widgets';

export default function DeleteHeaderWidgetModal({
    instance,
    onCancel,
    onDeleted,
}: {
    instance: HeaderWidgetInstance | null;
    onCancel: () => void;
    onDeleted: () => void;
}) {
    const queryClient = useQueryClient();
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleDelete() {
        if (!instance) return;

        setPending(true);
        setError(null);

        try {
            await deleteHeaderWidget({ data: { id: instance.id } });
        } catch {
            setError(m['header.widget_form.delete_failed']());
            setPending(false);
            return;
        }

        await queryClient.invalidateQueries({
            queryKey: headerWidgetsQueryKey,
        });

        setPending(false);
        onDeleted();
    }

    return (
        <Modal
            opened={instance !== null}
            onClose={onCancel}
            title={m['header.delete_widget']()}
        >
            <Stack gap="md">
                <Text size="sm">
                    {m['header.delete_widget_prompt']({
                        label: instance?.label ?? '',
                    })}
                </Text>

                {error ? (
                    <Text size="sm" c="red">
                        {error}
                    </Text>
                ) : null}

                <Group justify="flex-end" gap="xs">
                    <Button
                        variant="default"
                        onClick={onCancel}
                        disabled={pending}
                    >
                        {m['header.cancel']()}
                    </Button>
                    <Button
                        color="red"
                        onClick={() => void handleDelete()}
                        loading={pending}
                    >
                        {m['header.delete_widget_submit']()}
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
}

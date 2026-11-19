import { useState } from 'react';
import { Button, Group, Modal, Stack, Text } from '@mantine/core';
import { useQueryClient } from '@tanstack/react-query';

import {
    dashboardWidgetsQueryKey,
    deleteDashboardWidget,
} from '#/lib/dashboard-widgets';
import { m } from '#/paraglide/messages';

import type { DashboardWidgetInstance } from '#/lib/dashboard-widgets';

export default function DeleteWidgetModal({
    pageId,
    instance,
    onClose,
}: {
    pageId: string | null;
    instance: DashboardWidgetInstance | null;
    onClose: () => void;
}) {
    const queryClient = useQueryClient();
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleDelete() {
        if (!instance) return;

        setPending(true);
        setError(null);

        try {
            await deleteDashboardWidget({ data: { id: instance.id } });
        } catch {
            setError(m['widget.form.delete_failed']());
            setPending(false);
            return;
        }

        await queryClient.invalidateQueries({
            queryKey: dashboardWidgetsQueryKey(pageId),
        });

        setPending(false);
        onClose();
    }

    return (
        <Modal
            opened={instance !== null}
            onClose={onClose}
            title={m['dashboard.delete_widget']()}
        >
            <Stack gap="md">
                <Text size="sm">
                    {m['dashboard.delete_widget_prompt']({
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
                        onClick={onClose}
                        disabled={pending}
                    >
                        {m['dashboard.cancel']()}
                    </Button>
                    <Button
                        color="red"
                        onClick={() => void handleDelete()}
                        loading={pending}
                    >
                        {m['dashboard.delete_widget_submit']()}
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
}

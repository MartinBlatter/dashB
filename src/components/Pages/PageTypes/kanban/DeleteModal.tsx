import { useState } from 'react';
import { Button, Group, Modal, Stack, Text } from '@mantine/core';

import { t } from './i18n';

import type { ReactElement } from 'react';

export default function DeleteModal({
    opened,
    title,
    prompt,
    detail,
    onConfirm,
    onClose,
}: {
    opened: boolean;
    title: string;
    prompt: string;
    detail?: string;
    onConfirm: () => Promise<void>;
    onClose: () => void;
}): ReactElement {
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleConfirm() {
        setPending(true);
        setError(null);

        try {
            await onConfirm();
        } catch {
            setError(t('delete_failed'));
            setPending(false);
            return;
        }

        setPending(false);
        onClose();
    }

    function handleClose() {
        setError(null);
        onClose();
    }

    return (
        <Modal opened={opened} onClose={handleClose} title={title}>
            <Stack gap="md">
                <Text size="sm">{prompt}</Text>

                {detail ? (
                    <Text size="sm" fw={500}>
                        {detail}
                    </Text>
                ) : null}

                {error ? (
                    <Text size="sm" c="red">
                        {error}
                    </Text>
                ) : null}

                <Group justify="flex-end" gap="xs">
                    <Button
                        variant="default"
                        onClick={handleClose}
                        disabled={pending}
                    >
                        {t('cancel')}
                    </Button>

                    <Button
                        color="red"
                        onClick={() => void handleConfirm()}
                        loading={pending}
                    >
                        {t('delete_submit')}
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
}

import { useState } from 'react';
import { Button, Group, Modal, Stack, Text } from '@mantine/core';

import { t } from './i18n';

import type { DocumentNode } from '#/lib/page-documents';

export default function DeleteDocumentModal({
    node,
    onConfirm,
    onClose,
}: {
    node: DocumentNode | null;
    onConfirm: (id: string) => Promise<void>;
    onClose: () => void;
}) {
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const folder = node?.kind === 'folder';

    async function handleConfirm() {
        if (!node) return;

        setPending(true);
        setError(null);

        try {
            await onConfirm(node.id);
        } catch {
            setError(t('delete_failed'));
            setPending(false);
            return;
        }

        setPending(false);
        handleClose();
    }

    function handleClose() {
        setError(null);
        onClose();
    }

    return (
        <Modal
            opened={node !== null}
            onClose={handleClose}
            title={folder ? t('delete_folder') : t('delete_file')}
        >
            <Stack gap="md">
                <Text size="sm">
                    {folder
                        ? t('delete_folder_prompt')
                        : t('delete_file_prompt')}
                </Text>

                <Text size="sm" fw={500}>
                    {node?.name}
                </Text>

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
                        loading={pending}
                        onClick={() => void handleConfirm()}
                    >
                        {t('delete_submit')}
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
}

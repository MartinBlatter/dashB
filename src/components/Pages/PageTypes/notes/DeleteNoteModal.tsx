import { useState } from 'react';
import { Button, Group, Modal, Stack, Text } from '@mantine/core';
import { useQueryClient } from '@tanstack/react-query';

import { deleteNote, notesQueryKey } from '#/lib/notes';

import { t } from './i18n';

import type { Note } from '#/lib/notes';

export default function DeleteNoteModal({
    note,
    pageId,
    onClose,
}: {
    note: Note | null;
    pageId: string;
    onClose: () => void;
}) {
    const queryClient = useQueryClient();
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleDelete() {
        if (!note) return;

        setPending(true);
        setError(null);

        try {
            await deleteNote({ data: { id: note.id } });
        } catch {
            setError(t('delete_failed'));
            setPending(false);
            return;
        }

        await queryClient.invalidateQueries({
            queryKey: notesQueryKey(pageId),
        });

        setPending(false);
        onClose();
    }

    return (
        <Modal opened={note !== null} onClose={onClose} title={t('delete')}>
            <Stack gap="md">
                <Text size="sm">{t('delete_prompt')}</Text>

                {note?.title ? (
                    <Text size="sm" fw={500}>
                        {note.title}
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
                        onClick={onClose}
                        disabled={pending}
                    >
                        {t('cancel')}
                    </Button>
                    <Button
                        color="red"
                        onClick={() => void handleDelete()}
                        loading={pending}
                    >
                        {t('delete_submit')}
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
}

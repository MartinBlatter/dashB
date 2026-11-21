import { useState } from 'react';
import { Button, Group, Modal, Stack, TextInput } from '@mantine/core';

import {
    maxDocumentNameLength,
    normalizeDocumentName,
} from '#/lib/page-documents';

import { t } from './i18n';

import type { ReactElement } from 'react';

export default function AlbumFormModal({
    opened,
    taken,
    onClose,
    onSubmit,
}: {
    opened: boolean;
    taken: ReadonlySet<string>;
    onClose: () => void;
    onSubmit: (name: string) => Promise<void>;
}): ReactElement {
    const [value, setValue] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [pending, setPending] = useState(false);

    async function handleSubmit() {
        const name = normalizeDocumentName(value);

        if (name === null) {
            setError(t('name_invalid'));
            return;
        }

        if (taken.has(name)) {
            setError(t('name_taken'));
            return;
        }

        setPending(true);
        setError(null);

        try {
            await onSubmit(name);
        } catch {
            setError(t('save_failed'));
            setPending(false);
            return;
        }

        setPending(false);
        setValue('');
        onClose();
    }

    return (
        <Modal opened={opened} onClose={onClose} title={t('new_album')}>
            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    void handleSubmit();
                }}
            >
                <Stack gap="md">
                    <TextInput
                        label={t('album_name')}
                        placeholder={t('name_placeholder')}
                        value={value}
                        error={error}
                        maxLength={maxDocumentNameLength}
                        data-autofocus
                        onChange={(event) => {
                            setValue(event.currentTarget.value);
                            setError(null);
                        }}
                    />

                    <Group justify="flex-end" gap="xs">
                        <Button
                            variant="default"
                            onClick={onClose}
                            disabled={pending}
                        >
                            {t('cancel')}
                        </Button>

                        <Button type="submit" loading={pending}>
                            {t('create')}
                        </Button>
                    </Group>
                </Stack>
            </form>
        </Modal>
    );
}

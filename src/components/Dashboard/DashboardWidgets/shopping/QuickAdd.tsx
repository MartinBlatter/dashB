import { useState } from 'react';
import { ActionIcon, Group, TextInput, Tooltip } from '@mantine/core';
import { PlusIcon, SlidersHorizontalIcon } from '@phosphor-icons/react';

import { t } from './shopping';

export default function QuickAdd({
    onAdd,
    onDetails,
}: {
    onAdd: (name: string) => Promise<void>;
    onDetails: () => void;
}) {
    const [name, setName] = useState('');
    const [busy, setBusy] = useState(false);

    const trimmed = name.trim();

    async function submit() {
        if (trimmed === '' || busy) return;

        setBusy(true);

        try {
            await onAdd(trimmed);
            setName('');
        } finally {
            setBusy(false);
        }
    }

    return (
        <form
            onSubmit={(event) => {
                event.preventDefault();
                void submit();
            }}
        >
            <Group gap="xs" wrap="nowrap">
                <TextInput
                    size="xs"
                    style={{ flex: 1, minWidth: 0 }}
                    placeholder={t('quick_add')}
                    aria-label={t('add_item')}
                    maxLength={120}
                    value={name}
                    onChange={(event) => setName(event.currentTarget.value)}
                />

                <ActionIcon
                    type="submit"
                    size="md"
                    variant="light"
                    loading={busy}
                    disabled={trimmed === ''}
                    aria-label={t('add_item')}
                >
                    <PlusIcon size={14} />
                </ActionIcon>

                <Tooltip label={t('with_details')}>
                    <ActionIcon
                        size="md"
                        variant="subtle"
                        color="gray"
                        aria-label={t('with_details')}
                        onClick={onDetails}
                    >
                        <SlidersHorizontalIcon size={14} />
                    </ActionIcon>
                </Tooltip>
            </Group>
        </form>
    );
}

import { useState } from 'react';
import { Button, Group, Modal, Stack, Text } from '@mantine/core';
import { useQueryClient } from '@tanstack/react-query';

import {
    deletePage,
    descendantIds,
    pagesQueryKey,
    usePageList,
} from '#/lib/pages';
import { m } from '#/paraglide/messages';

import type { PageNode } from '#/lib/pages';
import type { ReactElement } from 'react';

export default function DeletePageModal({
    page,
    onCancel,
    onDeleted,
}: {
    page: PageNode | null;
    onCancel: () => void;
    onDeleted: () => void;
}): ReactElement {
    const queryClient = useQueryClient();
    const pages = usePageList();
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const childCount = page ? descendantIds(pages, page.id).length : 0;

    async function handleDelete() {
        if (!page) return;

        setPending(true);
        setError(null);

        let next;

        try {
            next = await deletePage({ data: { id: page.id } });
        } catch {
            setError(m['navbar.delete_page_failed']());
            setPending(false);
            return;
        }

        queryClient.setQueryData(pagesQueryKey, next);

        await queryClient.invalidateQueries({ queryKey: pagesQueryKey });

        setPending(false);
        onDeleted();
    }

    return (
        <Modal
            opened={page !== null}
            onClose={onCancel}
            title={m['navbar.delete_page']()}
        >
            <Stack gap="md">
                <Text size="sm">
                    {m['navbar.delete_page_prompt']({
                        title: page?.title ?? '',
                    })}
                </Text>

                {childCount > 0 ? (
                    <Text size="sm" c="red">
                        {m['navbar.delete_page_children']({
                            count: childCount,
                        })}
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
                        onClick={onCancel}
                        disabled={pending}
                    >
                        {m['navbar.cancel']()}
                    </Button>
                    <Button
                        color="red"
                        onClick={() => void handleDelete()}
                        loading={pending}
                    >
                        {m['navbar.delete_page_submit']()}
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
}

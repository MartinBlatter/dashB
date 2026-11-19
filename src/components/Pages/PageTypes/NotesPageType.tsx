import { useState } from 'react';
import { Button, Group, Stack, Text } from '@mantine/core';
import { NoteIcon, PlusIcon } from '@phosphor-icons/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import DashboardGrid, {
    changedPlacements,
} from '#/components/Dashboard/DashboardGrid';
import DashboardSkeleton from '#/components/Dashboard/DashboardSkeleton';
import {
    createNote,
    notesQueryKey,
    saveNotesLayout,
    useNotes,
    useNotesPending,
} from '#/lib/notes';

import DeleteNoteModal from './notes/DeleteNoteModal';
import NoteCard from './notes/NoteCard';
import { t } from './notes/i18n';

import type { PageTypeMeta, PageTypeProps } from './types';
import type { DashboardGridPlacement } from '#/components/Dashboard/DashboardGrid';
import type { Note } from '#/lib/notes';

export const widgetMeta = {
    type: 'notes',
    label: () => t('label'),
    description: () => t('description'),
    icon: NoteIcon,
} satisfies PageTypeMeta;

const minW = 2;
const minH = 3;

export default function NotesPageType({ pageId }: PageTypeProps) {
    const notes = useNotes(pageId);
    const pending = useNotesPending(pageId);
    const queryClient = useQueryClient();
    const [deleting, setDeleting] = useState<string | null>(null);

    const saveLayout = useMutation({
        mutationFn: (items: Array<DashboardGridPlacement>) =>
            saveNotesLayout({ data: { items } }),
    });

    const add = useMutation({
        mutationFn: () =>
            createNote({ data: { pageId, title: t('new_title') } }),
        onSuccess: (created) => {
            queryClient.setQueryData<Array<Note>>(
                notesQueryKey(pageId),
                (current) => [...(current ?? []), created]
            );
        },
    });

    function handlePlacementChange(placements: Array<DashboardGridPlacement>) {
        const changed = changedPlacements(notes, placements);

        if (changed.length === 0) return;

        const applied = new Map(
            changed.map((placement) => [placement.id, placement])
        );

        queryClient.setQueryData<Array<Note>>(
            notesQueryKey(pageId),
            (current) =>
                (current ?? []).map((note) => {
                    const placement = applied.get(note.id);

                    return placement ? { ...note, ...placement } : note;
                })
        );

        saveLayout.mutate(changed);
    }

    const items = notes.map((note) => ({
        id: note.id,
        x: note.x,
        y: note.y,
        w: note.w,
        h: note.h,
        minW,
        minH,
        content: (
            <NoteCard
                note={note}
                pageId={pageId}
                onDelete={() => setDeleting(note.id)}
            />
        ),
    }));

    return (
        <Stack gap="md">
            <Group justify="space-between" align="flex-start" wrap="nowrap">
                <Text size="sm" c="dimmed">
                    {t('description')}
                </Text>

                <Button
                    leftSection={<PlusIcon size={14} />}
                    variant="filled"
                    onClick={() => add.mutate()}
                    loading={add.isPending}
                    style={{ flexShrink: 0 }}
                >
                    {t('add')}
                </Button>
            </Group>

            {pending ? (
                <DashboardSkeleton />
            ) : items.length > 0 ? (
                <DashboardGrid
                    items={items}
                    onPlacementChange={handlePlacementChange}
                />
            ) : (
                <Text size="sm" c="dimmed">
                    {t('empty')}
                </Text>
            )}

            <DeleteNoteModal
                note={notes.find((note) => note.id === deleting) ?? null}
                pageId={pageId}
                onClose={() => setDeleting(null)}
            />
        </Stack>
    );
}

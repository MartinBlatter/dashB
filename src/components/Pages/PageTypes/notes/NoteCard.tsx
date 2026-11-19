import { useRef, useState } from 'react';
import {
    ActionIcon,
    Box,
    Group,
    Menu,
    Paper,
    TextInput,
    Tooltip,
} from '@mantine/core';
import { useDebouncedCallback } from '@mantine/hooks';
import {
    DotsSixVerticalIcon,
    DotsThreeVerticalIcon,
    TrashIcon,
    WarningIcon,
} from '@phosphor-icons/react';
import { useQueryClient } from '@tanstack/react-query';

import { dragHandleClass } from '#/components/Dashboard/DashboardGrid';
import { notesQueryKey, updateNote } from '#/lib/notes';

import NoteEditor from './NoteEditor';
import { t } from './i18n';

import type { Note } from '#/lib/notes';

export default function NoteCard({
    note,
    pageId,
    onDelete,
}: {
    note: Note;
    pageId: string;
    onDelete: () => void;
}) {
    const queryClient = useQueryClient();
    const [title, setTitle] = useState(note.title);
    const [failed, setFailed] = useState(false);

    const titleRef = useRef(note.title);
    const contentRef = useRef(note.content);
    const dirtyRef = useRef(false);

    async function persist() {
        if (!dirtyRef.current) return;

        dirtyRef.current = false;

        const saved = { title: titleRef.current, content: contentRef.current };

        try {
            await updateNote({ data: { id: note.id, ...saved } });
        } catch {
            dirtyRef.current = true;
            setFailed(true);
            return;
        }

        setFailed(false);

        queryClient.setQueryData<Array<Note>>(
            notesQueryKey(pageId),
            (current) =>
                (current ?? []).map((item) =>
                    item.id === note.id ? { ...item, ...saved } : item
                )
        );
    }

    const save = useDebouncedCallback(
        () => {
            void persist();
        },
        { delay: 800, flushOnUnmount: true }
    );

    function handleTitleChange(next: string) {
        setTitle(next);
        titleRef.current = next;
        dirtyRef.current = true;
        save();
    }

    function handleContentChange(next: string) {
        contentRef.current = next;
        dirtyRef.current = true;
        save();
    }

    return (
        <Paper
            withBorder
            radius="md"
            h="100%"
            style={{
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0,
                overflow: 'hidden',
            }}
        >
            <Group
                gap={4}
                wrap="nowrap"
                px="xs"
                py={6}
                bg="var(--mantine-color-blue-filled)"
                className={dragHandleClass}
                style={{
                    cursor: 'grab',
                    touchAction: 'none',
                    borderBottom:
                        '1px solid var(--mantine-color-default-border)',
                }}
                aria-label={t('drag')}
            >
                <DotsSixVerticalIcon size={14} opacity={0.5} />

                <TextInput
                    variant="unstyled"
                    size="xs"
                    style={{ flex: 1 }}
                    styles={{ input: { fontWeight: 500, minHeight: 0 } }}
                    aria-label={t('title_label')}
                    placeholder={t('title_placeholder')}
                    value={title}
                    onPointerDown={(event) => event.stopPropagation()}
                    onChange={(event) =>
                        handleTitleChange(event.currentTarget.value)
                    }
                    onBlur={() => save.flush()}
                />

                {failed ? (
                    <Tooltip label={t('save_failed')}>
                        <Box component="span" style={{ display: 'flex' }}>
                            <WarningIcon
                                size={14}
                                color="var(--mantine-color-red-7)"
                            />
                        </Box>
                    </Tooltip>
                ) : null}

                <Menu position="bottom-end" withinPortal>
                    <Menu.Target>
                        <ActionIcon
                            variant="subtle"
                            color="gray"
                            size="sm"
                            aria-label={t('menu')}
                            onPointerDown={(event) => event.stopPropagation()}
                        >
                            <DotsThreeVerticalIcon size={14} />
                        </ActionIcon>
                    </Menu.Target>

                    <Menu.Dropdown>
                        <Menu.Item
                            color="red"
                            leftSection={<TrashIcon size={14} />}
                            onClick={onDelete}
                        >
                            {t('delete')}
                        </Menu.Item>
                    </Menu.Dropdown>
                </Menu>
            </Group>

            <NoteEditor
                initialContent={note.content}
                onChange={handleContentChange}
                onBlur={() => save.flush()}
            />
        </Paper>
    );
}

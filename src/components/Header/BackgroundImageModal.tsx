import { useEffect, useState } from 'react';
import {
    Alert,
    Box,
    Group,
    Loader,
    Modal,
    SimpleGrid,
    Skeleton,
    Stack,
    Text,
} from '@mantine/core';
import { useIntersection } from '@mantine/hooks';
import {
    CheckIcon,
    ImageBrokenIcon,
    ProhibitIcon,
    WarningIcon,
} from '@phosphor-icons/react';
import { useQuery } from '@tanstack/react-query';

import {
    backgroundImagesQueryOptions,
    useDocumentFile,
} from '#/lib/page-documents';
import { m } from '#/paraglide/messages';

import classes from './BackgroundImageModal.module.css';

import type { BackgroundImageOption } from '#/lib/page-documents';
import type { ReactElement, ReactNode } from 'react';

function Tile({
    label,
    selected,
    disabled,
    onSelect,
    children,
}: {
    label: string;
    selected: boolean;
    disabled: boolean;
    onSelect: () => void;
    children: ReactNode;
}): ReactElement {
    return (
        <Box
            component="button"
            type="button"
            className={classes.tile}
            data-selected={selected ? true : undefined}
            disabled={disabled}
            aria-pressed={selected}
            aria-label={label}
            onClick={onSelect}
        >
            <Box className={classes.frame}>{children}</Box>

            <Box className={classes.caption}>
                <Text size="xs" c="dimmed" truncate>
                    {label}
                </Text>
            </Box>

            {selected ? (
                <Box className={classes.check} aria-hidden>
                    <CheckIcon size={12} weight="bold" />
                </Box>
            ) : null}
        </Box>
    );
}

function ImageTile({
    option,
    selected,
    disabled,
    onSelect,
}: {
    option: BackgroundImageOption;
    selected: boolean;
    disabled: boolean;
    onSelect: () => void;
}): ReactElement {
    const { ref, entry } = useIntersection<HTMLDivElement>({ threshold: 0.01 });
    const [seen, setSeen] = useState(false);
    const visible = entry?.isIntersecting ?? false;

    useEffect(() => {
        if (visible) setSeen(true);
    }, [visible]);

    const file = useDocumentFile(seen ? option.id : null);

    return (
        <Box ref={ref}>
            <Tile
                label={option.name}
                selected={selected}
                disabled={disabled}
                onSelect={onSelect}
            >
                {file.status === 'ready' ? (
                    <img src={file.url} alt="" className={classes.thumb} />
                ) : null}

                {file.status === 'error' ? (
                    <ImageBrokenIcon
                        size={24}
                        opacity={0.5}
                        role="img"
                        aria-label={m['header.background_image_load_failed']()}
                    />
                ) : null}

                {file.status === 'loading' ? (
                    <Skeleton height="100%" width="100%" radius={0} />
                ) : null}
            </Tile>
        </Box>
    );
}

export default function BackgroundImageModal({
    opened,
    selectedId,
    onClose,
    onSelect,
}: {
    opened: boolean;
    selectedId: string | null;
    onClose: () => void;
    onSelect: (id: string | null) => Promise<void>;
}): ReactElement {
    const { data, isPending } = useQuery({
        ...backgroundImagesQueryOptions(),
        enabled: opened,
    });
    const [saving, setSaving] = useState(false);
    const [failed, setFailed] = useState(false);

    const options = data ?? [];
    const pageIds = [...new Set(options.map((option) => option.pageId))];

    async function choose(id: string | null): Promise<void> {
        setFailed(false);
        setSaving(true);

        try {
            await onSelect(id);
            onClose();
        } catch {
            setFailed(true);
        } finally {
            setSaving(false);
        }
    }

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={m['header.background_image_pick']()}
            size="lg"
        >
            <Stack gap="md">
                <Text size="sm" c="dimmed">
                    {m['header.background_image_hint']()}
                </Text>

                {failed ? (
                    <Alert
                        color="red"
                        variant="light"
                        icon={<WarningIcon size={16} />}
                        withCloseButton
                        onClose={() => setFailed(false)}
                    >
                        {m['header.background_image_save_failed']()}
                    </Alert>
                ) : null}

                {isPending ? (
                    <Group justify="center" py="xl">
                        <Loader size="sm" />
                    </Group>
                ) : (
                    <>
                        <SimpleGrid
                            cols={{ base: 2, sm: 3, md: 4 }}
                            spacing="sm"
                        >
                            <Tile
                                label={m['header.background_image_none']()}
                                selected={selectedId === null}
                                disabled={saving}
                                onSelect={() => void choose(null)}
                            >
                                <ProhibitIcon size={24} opacity={0.5} />
                            </Tile>
                        </SimpleGrid>

                        {options.length === 0 ? (
                            <Alert variant="light">
                                <Text size="sm">
                                    {m['header.background_image_empty']()}
                                </Text>
                            </Alert>
                        ) : null}

                        {pageIds.map((pageId) => {
                            const pageOptions = options.filter(
                                (option) => option.pageId === pageId
                            );

                            return (
                                <Stack key={pageId} gap="xs">
                                    <Text size="sm" fw={500}>
                                        {pageOptions.at(0)?.pageTitle ?? ''}
                                    </Text>

                                    <SimpleGrid
                                        cols={{ base: 2, sm: 3, md: 4 }}
                                        spacing="sm"
                                    >
                                        {pageOptions.map((option) => (
                                            <ImageTile
                                                key={option.id}
                                                option={option}
                                                selected={
                                                    option.id === selectedId
                                                }
                                                disabled={saving}
                                                onSelect={() =>
                                                    void choose(option.id)
                                                }
                                            />
                                        ))}
                                    </SimpleGrid>
                                </Stack>
                            );
                        })}
                    </>
                )}
            </Stack>
        </Modal>
    );
}

import {
    ActionIcon,
    Anchor,
    Box,
    Button,
    Group,
    Image,
    Loader,
    Modal,
    Stack,
    Text,
} from '@mantine/core';
import {
    CaretLeftIcon,
    CaretRightIcon,
    DownloadSimpleIcon,
    ImageBrokenIcon,
    TrashIcon,
} from '@phosphor-icons/react';

import { documentDownloadUrl, useDocumentFile } from '#/lib/page-documents';

import { t } from './i18n';

import classes from './gallery.module.css';

import type { DocumentNode } from '#/lib/page-documents';
import type { ReactElement } from 'react';

export default function Lightbox({
    node,
    index,
    total,
    onPrevious,
    onNext,
    onDelete,
    onClose,
}: {
    node: DocumentNode | null;
    index: number;
    total: number;
    onPrevious: () => void;
    onNext: () => void;
    onDelete: () => void;
    onClose: () => void;
}): ReactElement {
    const file = useDocumentFile(node?.id ?? null);

    return (
        <Modal
            opened={node !== null}
            onClose={onClose}
            title={node?.name ?? ''}
            size="xl"
            onKeyDown={(event) => {
                if (event.key === 'ArrowLeft') onPrevious();
                if (event.key === 'ArrowRight') onNext();
            }}
        >
            <Stack gap="sm">
                <Box className={classes.stage}>
                    {file.status === 'loading' ? <Loader size="sm" /> : null}

                    {file.status === 'error' ? (
                        <Stack gap="xs" align="center">
                            <ImageBrokenIcon
                                size={32}
                                opacity={0.5}
                                aria-hidden
                            />

                            <Text size="sm" c="dimmed">
                                {t('load_failed')}
                            </Text>
                        </Stack>
                    ) : null}

                    {file.status === 'ready' && node ? (
                        <Image
                            src={file.url}
                            alt={node.name}
                            fit="contain"
                            w="auto"
                            maw="100%"
                            mah="70vh"
                        />
                    ) : null}
                </Box>

                <Group justify="space-between" wrap="nowrap">
                    <Group gap="xs" wrap="nowrap">
                        <ActionIcon
                            variant="default"
                            aria-label={t('previous')}
                            disabled={total < 2}
                            onClick={onPrevious}
                        >
                            <CaretLeftIcon size={16} />
                        </ActionIcon>

                        <Text size="sm" c="dimmed">
                            {t('position')
                                .replace('{index}', String(index + 1))
                                .replace('{total}', String(total))}
                        </Text>

                        <ActionIcon
                            variant="default"
                            aria-label={t('next')}
                            disabled={total < 2}
                            onClick={onNext}
                        >
                            <CaretRightIcon size={16} />
                        </ActionIcon>
                    </Group>

                    <Group gap="xs" wrap="nowrap">
                        {node ? (
                            <Anchor
                                href={documentDownloadUrl(node.id)}
                                download={node.name}
                                underline="never"
                            >
                                <Button
                                    component="span"
                                    variant="default"
                                    leftSection={
                                        <DownloadSimpleIcon size={14} />
                                    }
                                >
                                    {t('download')}
                                </Button>
                            </Anchor>
                        ) : null}

                        <Button
                            color="red"
                            variant="light"
                            leftSection={<TrashIcon size={14} />}
                            onClick={onDelete}
                        >
                            {t('delete_image')}
                        </Button>
                    </Group>
                </Group>
            </Stack>
        </Modal>
    );
}

import { useRef, useState } from 'react';
import {
    Alert,
    Button,
    Group,
    SegmentedControl,
    SimpleGrid,
    Skeleton,
    Stack,
    Text,
} from '@mantine/core';
import {
    FolderPlusIcon,
    ImagesIcon,
    UploadSimpleIcon,
    WarningIcon,
} from '@phosphor-icons/react';

import { valueText } from '#/components/Widgets/values';
import {
    documentPreviewKind,
    maxDocumentFileSize,
    useDocuments,
} from '#/lib/page-documents';

import AlbumFormModal from './gallery/AlbumFormModal';
import DeleteImageModal from './gallery/DeleteImageModal';
import GalleryTile from './gallery/GalleryTile';
import Lightbox from './gallery/Lightbox';
import { t } from './gallery/i18n';

import type { PageTypeMeta, PageTypeProps } from './types';
import type { DocumentNode } from '#/lib/page-documents';
import type { ReactElement } from 'react';

const rootValue = 'root';

export const widgetMeta = {
    type: 'gallery',
    label: () => t('label'),
    description: () => t('description'),
    icon: ImagesIcon,
    fields: [
        {
            kind: 'select',
            name: 'columns',
            label: () => t('columns'),
            defaultValue: '4',
            options: () => [
                { value: '2', label: '2' },
                { value: '3', label: '3' },
                { value: '4', label: '4' },
                { value: '6', label: '6' },
            ],
        },
        {
            kind: 'switch',
            name: 'showNames',
            label: () => t('show_names'),
            defaultValue: false,
        },
    ],
} satisfies PageTypeMeta;

function isImage(node: DocumentNode): boolean {
    return (
        node.kind === 'file' && documentPreviewKind(node.mimeType) === 'image'
    );
}

export default function GalleryPageType({
    pageId,
    config,
}: PageTypeProps): ReactElement {
    const store = useDocuments(pageId);

    const [albumId, setAlbumId] = useState<string | null>(null);
    const [openId, setOpenId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [naming, setNaming] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fileInput = useRef<HTMLInputElement>(null);

    const { nodes } = store;

    const columns = Number(valueText(config, 'columns')) || 4;
    const showNames = config.showNames === true;

    const albums = nodes
        .filter((node) => node.kind === 'folder' && node.parentId === null)
        .sort((left, right) => left.name.localeCompare(right.name));

    const albumExists =
        albumId === null || albums.some((album) => album.id === albumId);
    const currentAlbum = albumExists ? albumId : null;

    const images = nodes
        .filter((node) => isImage(node) && node.parentId === currentAlbum)
        .sort((left, right) => left.name.localeCompare(right.name));

    const otherFiles = nodes.filter(
        (node) => node.kind === 'file' && !isImage(node)
    ).length;

    const openIndex = images.findIndex((node) => node.id === openId);
    const open = openIndex === -1 ? null : (images.at(openIndex) ?? null);

    function step(offset: number) {
        if (images.length === 0 || openIndex === -1) return;

        const next = (openIndex + offset + images.length) % images.length;

        setOpenId(images.at(next)?.id ?? null);
    }

    async function handleUpload(files: Array<File>): Promise<void> {
        setError(null);

        if (files.some((file) => file.size > maxDocumentFileSize)) {
            setError(t('too_large'));
            return;
        }

        try {
            await store.upload(currentAlbum, files);
        } catch {
            setError(t('upload_failed'));
        }
    }

    if (store.isPending) {
        return (
            <Stack gap="md">
                <Skeleton height={36} />

                <SimpleGrid cols={{ base: 2, sm: 3, lg: columns }} spacing="sm">
                    {[0, 1, 2, 3].map((key) => (
                        <Skeleton key={key} height={160} radius="md" />
                    ))}
                </SimpleGrid>
            </Stack>
        );
    }

    return (
        <Stack gap="md">
            <Group justify="space-between" align="flex-end" wrap="wrap">
                {albums.length > 0 ? (
                    <SegmentedControl
                        value={currentAlbum ?? rootValue}
                        onChange={(value) =>
                            setAlbumId(value === rootValue ? null : value)
                        }
                        data={[
                            { value: rootValue, label: t('album_root') },
                            ...albums.map((album) => ({
                                value: album.id,
                                label: album.name,
                            })),
                        ]}
                    />
                ) : (
                    <Text size="sm" c="dimmed">
                        {t('description')}
                    </Text>
                )}

                <Group gap="xs" wrap="nowrap">
                    <Button
                        variant="default"
                        leftSection={<FolderPlusIcon size={14} />}
                        onClick={() => setNaming(true)}
                    >
                        {t('new_album')}
                    </Button>

                    <Button
                        leftSection={<UploadSimpleIcon size={14} />}
                        loading={store.uploading}
                        onClick={() => fileInput.current?.click()}
                    >
                        {store.uploading ? t('uploading') : t('upload')}
                    </Button>
                </Group>
            </Group>

            {error ? (
                <Alert
                    color="red"
                    variant="light"
                    icon={<WarningIcon size={16} />}
                    withCloseButton
                    onClose={() => setError(null)}
                >
                    {error}
                </Alert>
            ) : null}

            {images.length === 0 ? (
                <Alert variant="light" title={t('empty_title')}>
                    <Text size="sm">
                        {currentAlbum === null
                            ? t('empty_hint')
                            : t('empty_album')}
                    </Text>
                </Alert>
            ) : (
                <SimpleGrid cols={{ base: 2, sm: 3, lg: columns }} spacing="sm">
                    {images.map((node) => (
                        <GalleryTile
                            key={node.id}
                            node={node}
                            showName={showNames}
                            onOpen={() => setOpenId(node.id)}
                        />
                    ))}
                </SimpleGrid>
            )}

            {otherFiles > 0 ? (
                <Text size="xs" c="dimmed">
                    {t('not_images').replace('{count}', String(otherFiles))}
                </Text>
            ) : null}

            <input
                ref={fileInput}
                type="file"
                multiple
                accept="image/*"
                tabIndex={-1}
                aria-hidden
                style={{ display: 'none' }}
                onChange={(event) => {
                    const picked = Array.from(event.currentTarget.files ?? []);

                    event.currentTarget.value = '';

                    if (picked.length > 0) void handleUpload(picked);
                }}
            />

            <AlbumFormModal
                opened={naming}
                taken={new Set(albums.map((album) => album.name))}
                onClose={() => setNaming(false)}
                onSubmit={async (name) => {
                    const created = await store.createFolder(null, name);

                    setAlbumId(created.id);
                }}
            />

            <Lightbox
                node={open}
                index={openIndex === -1 ? 0 : openIndex}
                total={images.length}
                onPrevious={() => step(-1)}
                onNext={() => step(1)}
                onDelete={() => setDeletingId(openId)}
                onClose={() => setOpenId(null)}
            />

            <DeleteImageModal
                node={nodes.find((node) => node.id === deletingId) ?? null}
                onConfirm={async (id) => {
                    await store.remove(id);

                    if (openId === id) setOpenId(null);
                }}
                onClose={() => setDeletingId(null)}
            />
        </Stack>
    );
}

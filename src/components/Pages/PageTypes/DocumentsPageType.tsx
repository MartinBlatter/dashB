import { useMemo, useRef, useState } from 'react';
import {
    Alert,
    Button,
    Grid,
    Group,
    Paper,
    Skeleton,
    Stack,
    Text,
    useTree,
} from '@mantine/core';
import {
    FolderPlusIcon,
    FoldersIcon,
    UploadSimpleIcon,
    WarningIcon,
} from '@phosphor-icons/react';

import { maxDocumentFileSize, useDocuments } from '#/lib/page-documents';

import DeleteDocumentModal from './documents/DeleteDocumentModal';
import DocumentPreview from './documents/DocumentPreview';
import DocumentsTree from './documents/DocumentsTree';
import NameFormModal from './documents/NameFormModal';
import { t } from './documents/i18n';
import {
    buildTreeData,
    childCounts,
    destinationFolderId,
    findNode,
    siblingNames,
} from './documents/tree';

import type { PageTypeMeta, PageTypeProps } from './types';

export const widgetMeta = {
    type: 'documents',
    label: () => t('label'),
    description: () => t('description'),
    icon: FoldersIcon,
} satisfies PageTypeMeta;

type NamingTarget =
    | { mode: 'create'; parentId: string | null }
    | { mode: 'rename'; id: string };

export default function DocumentsPageType({ pageId }: PageTypeProps) {
    const store = useDocuments(pageId);

    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [naming, setNaming] = useState<NamingTarget | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const fileInput = useRef<HTMLInputElement>(null);
    const uploadTarget = useRef<string | null>(null);

    const tree = useTree({
        selectedState: selectedId === null ? [] : [selectedId],
        onSelectedStateChange: (state) => setSelectedId(state.at(-1) ?? null),
    });

    const { nodes } = store;
    const data = useMemo(() => buildTreeData(nodes), [nodes]);
    const counts = childCounts(nodes);

    const selected = findNode(nodes, selectedId);
    const destination = destinationFolderId(nodes, selectedId);
    const destinationName =
        findNode(nodes, destination)?.name ?? t('destination_root');

    const renaming =
        naming?.mode === 'rename' ? findNode(nodes, naming.id) : null;

    function pickFiles(parentId: string | null) {
        uploadTarget.current = parentId;
        fileInput.current?.click();
    }

    async function handleUpload(
        parentId: string | null,
        files: Array<File>
    ): Promise<void> {
        setError(null);

        if (files.some((file) => file.size > maxDocumentFileSize)) {
            setError(t('too_large'));
            return;
        }

        try {
            await store.upload(parentId, files);
        } catch {
            setError(t('upload_failed'));
            return;
        }

        if (parentId !== null) tree.expand(parentId);
    }

    async function handleMove(
        id: string,
        parentId: string | null
    ): Promise<void> {
        setError(null);

        try {
            await store.move(id, parentId);
        } catch {
            setError(t('move_failed'));
            return;
        }

        if (parentId !== null) tree.expand(parentId);
    }

    async function handleName(name: string): Promise<void> {
        if (!naming) return;

        if (naming.mode === 'rename') {
            await store.rename(naming.id, name);
            return;
        }

        const created = await store.createFolder(naming.parentId, name);

        if (naming.parentId !== null) tree.expand(naming.parentId);

        setSelectedId(created.id);
    }

    if (store.isPending) {
        return (
            <Stack gap="xs">
                <Skeleton height={36} />
                <Skeleton height={240} />
            </Stack>
        );
    }

    return (
        <Stack gap="md">
            <Group justify="space-between" align="flex-end" wrap="wrap">
                <Stack gap={2}>
                    <Text size="sm" c="dimmed">
                        {t('description')}
                    </Text>

                    <Text size="xs" c="dimmed">
                        {t('destination')}{' '}
                        <Text span size="xs" fw={600}>
                            {destinationName}
                        </Text>
                    </Text>
                </Stack>

                <Group gap="xs" wrap="nowrap">
                    <Button
                        variant="default"
                        leftSection={<FolderPlusIcon size={14} />}
                        onClick={() =>
                            setNaming({ mode: 'create', parentId: destination })
                        }
                    >
                        {t('new_folder')}
                    </Button>

                    <Button
                        leftSection={<UploadSimpleIcon size={14} />}
                        loading={store.uploading}
                        onClick={() => pickFiles(destination)}
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

            <Grid gap="md">
                <Grid.Col span={{ base: 12, md: 5 }}>
                    <Paper withBorder radius="md" p="sm" h="100%">
                        {nodes.length === 0 ? (
                            <Stack gap={4}>
                                <Text size="sm" fw={600}>
                                    {t('empty_title')}
                                </Text>

                                <Text size="sm" c="dimmed">
                                    {t('empty_hint')}
                                </Text>
                            </Stack>
                        ) : (
                            <Stack gap="sm">
                                <DocumentsTree
                                    nodes={nodes}
                                    data={data}
                                    counts={counts}
                                    tree={tree}
                                    onNewFolder={(parentId) =>
                                        setNaming({ mode: 'create', parentId })
                                    }
                                    onUploadInto={(parentId) =>
                                        pickFiles(parentId)
                                    }
                                    onRename={(node) =>
                                        setNaming({
                                            mode: 'rename',
                                            id: node.id,
                                        })
                                    }
                                    onDelete={(node) => setDeletingId(node.id)}
                                    onMove={(id, parentId) =>
                                        void handleMove(id, parentId)
                                    }
                                />

                                <Text size="xs" c="dimmed">
                                    {t('drag_hint')}
                                </Text>
                            </Stack>
                        )}
                    </Paper>
                </Grid.Col>

                <Grid.Col span={{ base: 12, md: 7 }}>
                    <Paper withBorder radius="md" p="md" h="100%">
                        <DocumentPreview
                            node={selected}
                            childCount={
                                selected ? (counts.get(selected.id) ?? 0) : 0
                            }
                        />
                    </Paper>
                </Grid.Col>
            </Grid>

            <input
                ref={fileInput}
                type="file"
                multiple
                tabIndex={-1}
                aria-hidden
                style={{ display: 'none' }}
                onChange={(event) => {
                    const picked = Array.from(event.currentTarget.files ?? []);

                    event.currentTarget.value = '';

                    if (picked.length > 0) {
                        void handleUpload(uploadTarget.current, picked);
                    }
                }}
            />

            {naming ? (
                <NameFormModal
                    key={
                        naming.mode === 'rename'
                            ? `rename-${naming.id}`
                            : `create-${naming.parentId ?? 'root'}`
                    }
                    opened
                    title={
                        naming.mode === 'create'
                            ? t('new_folder')
                            : renaming?.kind === 'folder'
                              ? t('rename_folder')
                              : t('rename_file')
                    }
                    label={
                        naming.mode === 'create' ? t('folder_name') : t('name')
                    }
                    initialName={
                        naming.mode === 'create' ? '' : (renaming?.name ?? '')
                    }
                    submitLabel={
                        naming.mode === 'create' ? t('create') : t('save')
                    }
                    taken={
                        naming.mode === 'create'
                            ? siblingNames(nodes, naming.parentId)
                            : siblingNames(
                                  nodes,
                                  renaming?.parentId ?? null,
                                  naming.id
                              )
                    }
                    onClose={() => setNaming(null)}
                    onSubmit={handleName}
                />
            ) : null}

            <DeleteDocumentModal
                node={findNode(nodes, deletingId)}
                onConfirm={async (id) => {
                    await store.remove(id);

                    if (selectedId === id) setSelectedId(null);
                }}
                onClose={() => setDeletingId(null)}
            />
        </Stack>
    );
}

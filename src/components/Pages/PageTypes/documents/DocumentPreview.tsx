import { Button, Group, Loader, Stack, Text } from '@mantine/core';
import { useMounted } from '@mantine/hooks';
import { ArrowSquareOutIcon, DownloadSimpleIcon } from '@phosphor-icons/react';

import {
    documentDownloadUrl,
    documentFileUrl,
    documentPreviewKind,
    useDocumentFile,
} from '#/lib/page-documents';
import { getLocale } from '#/paraglide/runtime';

import FilePreviewBody from './FilePreviewBody';
import PreviewStage from './PreviewStage';
import { documentIcon, documentTypeLabel, formatSize } from './format';
import { t } from './i18n';

import type { ReactElement } from 'react';
import type { DocumentNode } from '#/lib/page-documents';

function DetailRow({ label, value }: { label: string; value: string }) {
    return (
        <Group gap="xs" justify="space-between" wrap="nowrap">
            <Text size="xs" c="dimmed">
                {label}
            </Text>

            <Text size="xs" ta="right">
                {value}
            </Text>
        </Group>
    );
}

function FilePreview({ node }: { node: DocumentNode }): ReactElement {
    const kind = documentPreviewKind(node.mimeType);
    const file = useDocumentFile(kind === null ? null : node.id);

    if (kind === null) {
        return (
            <Text size="sm" c="dimmed">
                {t('preview_none')}
            </Text>
        );
    }

    if (file.status === 'error') {
        return (
            <PreviewStage>
                <Text size="sm" c="dimmed">
                    {t('preview_failed')}
                </Text>
            </PreviewStage>
        );
    }

    if (file.status === 'loading') {
        return (
            <PreviewStage>
                <Loader size="sm" />
            </PreviewStage>
        );
    }

    return <FilePreviewBody node={node} kind={kind} url={file.url} />;
}

export default function DocumentPreview({
    node,
    childCount,
}: {
    node: DocumentNode | null;
    childCount: number;
}) {
    const mounted = useMounted();

    if (!node) {
        return (
            <Text size="sm" c="dimmed">
                {t('preview_select')}
            </Text>
        );
    }

    const NodeIcon = documentIcon(node);
    const previewable = documentPreviewKind(node.mimeType) !== null;

    return (
        <Stack gap="md">
            <Group gap="xs" wrap="nowrap">
                <NodeIcon size={20} aria-hidden style={{ flexShrink: 0 }} />

                <Text fw={600} style={{ wordBreak: 'break-word' }}>
                    {node.name}
                </Text>
            </Group>

            {node.kind === 'folder' ? (
                <Text size="sm" c="dimmed">
                    {t('preview_folder')}
                </Text>
            ) : (
                <>
                    <FilePreview node={node} />

                    <Group gap="xs">
                        <Button
                            component="a"
                            href={documentDownloadUrl(node.id)}
                            leftSection={<DownloadSimpleIcon size={14} />}
                        >
                            {t('download')}
                        </Button>

                        {previewable ? (
                            <Button
                                component="a"
                                variant="default"
                                href={documentFileUrl(node.id)}
                                target="_blank"
                                rel="noreferrer"
                                leftSection={<ArrowSquareOutIcon size={14} />}
                            >
                                {t('open_tab')}
                            </Button>
                        ) : null}
                    </Group>
                </>
            )}

            <Stack gap={2}>
                {node.kind === 'file' ? (
                    <>
                        <DetailRow
                            label={t('type')}
                            value={documentTypeLabel(node)}
                        />
                        <DetailRow
                            label={t('size')}
                            value={formatSize(node.size)}
                        />
                    </>
                ) : (
                    <DetailRow
                        label={t('contents')}
                        value={
                            childCount === 0
                                ? t('folder_empty_count')
                                : childCount === 1
                                  ? t('folder_counts_one')
                                  : `${childCount} ${t('folder_counts_many')}`
                        }
                    />
                )}

                {mounted ? (
                    <DetailRow
                        label={t('modified')}
                        value={new Date(node.updatedAt).toLocaleString(
                            getLocale(),
                            { dateStyle: 'short', timeStyle: 'short' }
                        )}
                    />
                ) : null}
            </Stack>
        </Stack>
    );
}

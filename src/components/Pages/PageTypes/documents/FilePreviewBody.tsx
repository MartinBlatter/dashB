import { Image } from '@mantine/core';

import { solidBodyColor } from '#/lib/theme';

import PreviewStage from './PreviewStage';
import { t } from './i18n';

import type { ReactElement } from 'react';
import type { DocumentNode, DocumentPreviewKind } from '#/lib/page-documents';

export default function FilePreviewBody({
    node,
    kind,
    url,
}: {
    node: DocumentNode;
    kind: DocumentPreviewKind;
    url: string;
}): ReactElement {
    switch (kind) {
        case 'image':
            return (
                <PreviewStage>
                    <Image
                        src={url}
                        alt={node.name}
                        w="auto"
                        h="auto"
                        maw="100%"
                        mah={420}
                        radius="sm"
                    />
                </PreviewStage>
            );

        case 'pdf':
        case 'text':
            return (
                <iframe
                    src={url}
                    title={t('preview_frame')}
                    style={{
                        width: '100%',
                        height: kind === 'pdf' ? 540 : 360,
                        border: 0,
                        borderRadius: 'var(--mantine-radius-sm)',
                        background: solidBodyColor,
                    }}
                />
            );

        case 'audio':
            return (
                <PreviewStage>
                    <audio controls src={url} style={{ width: '100%' }} />
                </PreviewStage>
            );

        case 'video':
            return (
                <PreviewStage>
                    <video
                        controls
                        src={url}
                        style={{
                            maxWidth: '100%',
                            maxHeight: 420,
                            borderRadius: 'var(--mantine-radius-sm)',
                        }}
                    />
                </PreviewStage>
            );
    }
}

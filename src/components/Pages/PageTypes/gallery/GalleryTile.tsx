import { Box, Skeleton, Text } from '@mantine/core';
import { ImageBrokenIcon } from '@phosphor-icons/react';

import { useDocumentFile } from '#/lib/page-documents';

import { t } from './i18n';

import classes from './gallery.module.css';

import type { DocumentNode } from '#/lib/page-documents';
import type { ReactElement } from 'react';

export default function GalleryTile({
    node,
    showName,
    onOpen,
}: {
    node: DocumentNode;
    showName: boolean;
    onOpen: () => void;
}): ReactElement {
    const file = useDocumentFile(node.id);

    return (
        <Box
            component="button"
            type="button"
            className={classes.tile}
            onClick={onOpen}
            aria-label={node.name}
        >
            <Box className={classes.frame}>
                {file.status === 'loading' ? (
                    <Skeleton height="100%" width="100%" radius={0} />
                ) : null}

                {file.status === 'error' ? (
                    <ImageBrokenIcon
                        size={28}
                        opacity={0.5}
                        role="img"
                        aria-label={t('load_failed')}
                    />
                ) : null}

                {file.status === 'ready' ? (
                    <img
                        src={file.url}
                        alt={node.name}
                        className={classes.thumb}
                    />
                ) : null}
            </Box>

            {showName ? (
                <Box className={classes.name}>
                    <Text size="xs" c="dimmed" truncate>
                        {node.name}
                    </Text>
                </Box>
            ) : null}
        </Box>
    );
}

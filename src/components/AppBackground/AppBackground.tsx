import { Box } from '@mantine/core';

import { useDocumentFile } from '#/lib/page-documents';

import classes from './AppBackground.module.css';

import type { ReactElement } from 'react';

export const glassSectionClass = classes.glass;

export default function AppBackground({
    imageId,
}: {
    imageId: string | null;
}): ReactElement {
    const file = useDocumentFile(imageId);
    const url = file.status === 'ready' ? file.url : null;

    return (
        <Box className={classes.layer} aria-hidden>
            <Box
                className={classes.image}
                data-loaded={url === null ? undefined : true}
                style={
                    url === null
                        ? undefined
                        : { backgroundImage: `url("${url}")` }
                }
            />
        </Box>
    );
}

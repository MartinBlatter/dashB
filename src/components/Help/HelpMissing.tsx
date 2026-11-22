import { Alert, Stack } from '@mantine/core';
import { WarningIcon } from '@phosphor-icons/react';

import { AnchorLink } from '#/components/AnchorLink/AnchorLink';
import { m } from '#/paraglide/messages';

export default function HelpMissing() {
    return (
        <Stack gap="sm" align="flex-start" maw="35rem">
            <Alert
                color="yellow"
                variant="light"
                icon={<WarningIcon size={16} />}
                title={m['help.title']()}
            >
                {m['help.not_found']()}
            </Alert>

            <AnchorLink to="/help" size="sm">
                {m['help.back']()}
            </AnchorLink>
        </Stack>
    );
}

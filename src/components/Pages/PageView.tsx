import { useState } from 'react';
import { Alert, Button, Stack, Text } from '@mantine/core';
import { PlusIcon, WarningIcon } from '@phosphor-icons/react';

import { fromStoredValues } from '#/components/Widgets/values';
import { resolvePagePath, usePageList, usePagesPending } from '#/lib/pages';
import { m } from '#/paraglide/messages';

import PageBreadcrumbs from './PageBreadcrumbs';
import { getPageType } from './PageTypes/registry';
import PageSkeleton from './PageSkeleton';
import SetPageTypeModal from './SetPageTypeModal';

import type { ReactElement } from 'react';

export default function PageView({
    segments,
}: {
    segments: Array<string>;
}): ReactElement {
    const pages = usePageList();
    const pending = usePagesPending();
    const [settingType, setSettingType] = useState(false);

    if (pending) return <PageSkeleton />;

    const page = resolvePagePath(pages, segments);

    if (!page) {
        return (
            <Alert
                color="yellow"
                variant="light"
                icon={<WarningIcon size={16} />}
            >
                {m['page.not_found']()}
            </Alert>
        );
    }

    const definition = page.type ? getPageType(page.type) : undefined;

    return (
        <Stack gap="md">
            <PageBreadcrumbs pages={pages} page={page} />

            {page.type === null ? (
                <Alert variant="light" title={m['page.no_type_title']()}>
                    <Stack gap="sm" align="flex-start">
                        <Text size="sm">{m['page.no_type_hint']()}</Text>

                        <Button
                            leftSection={<PlusIcon size={14} />}
                            variant="filled"
                            onClick={() => setSettingType(true)}
                        >
                            {m['page.set_type']()}
                        </Button>
                    </Stack>
                </Alert>
            ) : definition ? (
                <definition.Component
                    pageId={page.id}
                    title={page.title}
                    config={fromStoredValues(definition.fields, page.config)}
                />
            ) : (
                <Alert
                    color="yellow"
                    variant="light"
                    icon={<WarningIcon size={16} />}
                >
                    {m['page.unknown_type']({ type: page.type })}
                </Alert>
            )}

            <SetPageTypeModal
                page={settingType ? page : null}
                onClose={() => setSettingType(false)}
            />
        </Stack>
    );
}

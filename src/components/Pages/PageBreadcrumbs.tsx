import { Anchor, Breadcrumbs, Title } from '@mantine/core';
import { Link } from '@tanstack/react-router';

import { pagePath, pageTrail } from '#/lib/pages';
import { m } from '#/paraglide/messages';

import type { PageNode } from '#/lib/pages';
import type { ReactElement } from 'react';

export default function PageBreadcrumbs({
    pages,
    page,
}: {
    pages: Array<PageNode>;
    page: PageNode;
}): ReactElement {
    const trail = pageTrail(pages, page.id);
    const ancestors = trail.slice(0, -1);

    return (
        <nav aria-label={m['page.breadcrumbs']()}>
            <Breadcrumbs separator="/" separatorMargin="sm" fz="h3">
                {[
                    ...ancestors.map((ancestor) => (
                        <Anchor
                            key={ancestor.id}
                            fz="h3"
                            fw={500}
                            c="dimmed"
                            underline="hover"
                            renderRoot={(props) => (
                                <Link
                                    to="/$"
                                    params={{
                                        _splat: pagePath(
                                            pages,
                                            ancestor.id
                                        ).slice(1),
                                    }}
                                    activeOptions={{ exact: true }}
                                    {...props}
                                />
                            )}
                        >
                            {ancestor.title}
                        </Anchor>
                    )),
                    <Title key={page.id} order={2}>
                        {page.title}
                    </Title>,
                ]}
            </Breadcrumbs>
        </nav>
    );
}

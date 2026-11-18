import type { PageTreeNode } from '#/lib/pages';
import type { ReactElement } from 'react';
import { NavLink } from '@mantine/core';

export default function NavTreeNode({
    page,
}: {
    page: PageTreeNode;
}): ReactElement {
    return (
        <NavLink href={`/${page.slug}`} label={page.title} key={page.id}>
            {page.children.length &&
                page.children.map((child) => (
                    <NavTreeNode key={child.id} page={child} />
                ))}
        </NavLink>
    );
}

import { Box, NavLink } from '@mantine/core';
import { SquaresFourIcon } from '@phosphor-icons/react';
import { m } from '#/paraglide/messages';
import { usePages } from '#/lib/pages';
import type { ReactElement } from 'react';
import NavTreeNode from './NavTreeNode';

export default function Navbar(): ReactElement {
    const pages = usePages();

    return (
        <Box component="nav" aria-label={m['navbar.label']()}>
            <NavLink
                href="/"
                label={m['navbar.dashboard']()}
                leftSection={<SquaresFourIcon size={16} />}
            />
            {pages.map((page) => (
                <NavTreeNode key={page.id} page={page} />
            ))}
        </Box>
    );
}

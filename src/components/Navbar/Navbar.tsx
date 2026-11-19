import { useState } from 'react';
import { Box, NavLink } from '@mantine/core';
import { SquaresFourIcon } from '@phosphor-icons/react';
import { Link } from '@tanstack/react-router';

import { usePageList, usePages, usePagesPending } from '#/lib/pages';
import { m } from '#/paraglide/messages';

import DeletePageModal from './DeletePageModal';
import EditPageModal from './EditPageModal';
import NavSkeleton from './NavSkeleton';
import NavTreeNode from './NavTreeNode';

import type { ReactElement } from 'react';

export default function Navbar(): ReactElement {
    const pages = usePages();
    const flatPages = usePageList();
    const pending = usePagesPending();
    const [editing, setEditing] = useState<string | null>(null);
    const [deleting, setDeleting] = useState<string | null>(null);

    function pageById(id: string | null) {
        return flatPages.find((page) => page.id === id) ?? null;
    }

    return (
        <Box
            component="nav"
            aria-label={m['navbar.label']()}
            aria-busy={pending}
        >
            <NavLink
                renderRoot={(props) => <Link to="/" {...props} />}
                label={m['navbar.dashboard']()}
                leftSection={<SquaresFourIcon size={16} />}
            />
            {pending ? (
                <NavSkeleton />
            ) : (
                pages.map((page) => (
                    <NavTreeNode
                        key={page.id}
                        page={page}
                        pages={flatPages}
                        onEdit={(target) => setEditing(target.id)}
                    />
                ))
            )}

            <EditPageModal
                page={pageById(editing)}
                onClose={() => setEditing(null)}
                onRequestDelete={() => {
                    setDeleting(editing);
                    setEditing(null);
                }}
            />

            <DeletePageModal
                page={pageById(deleting)}
                onCancel={() => {
                    setEditing(deleting);
                    setDeleting(null);
                }}
                onDeleted={() => setDeleting(null)}
            />
        </Box>
    );
}

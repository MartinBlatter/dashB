import { NavLink } from '@mantine/core';
import { HouseIcon } from '@phosphor-icons/react';
import { m } from '#/paraglide/messages';
import type { ReactElement } from 'react';

export default function Navbar(): ReactElement {
    return (
        <NavLink
            href="#required-for-focus"
            label={m['navbar.home']()}
            leftSection={<HouseIcon size={16} />}
        />
    );
}

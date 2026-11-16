import { Anchor } from '@mantine/core';
import { createLink } from '@tanstack/react-router';
import type { AnchorProps } from '@mantine/core';
import type { ComponentPropsWithoutRef, Ref } from 'react';

type MantineAnchorProps = AnchorProps &
    Omit<ComponentPropsWithoutRef<'a'>, keyof AnchorProps> & {
        ref?: Ref<HTMLAnchorElement>;
    };

function MantineAnchor(props: MantineAnchorProps) {
    return <Anchor {...props} />;
}

/**
 * Mantine `Anchor` wired up as a TanStack Router link, so `to` and `search`
 * stay type-checked. Using `<Anchor component={Link} />` instead loses those
 * types, because the polymorphic `component` prop erases the router generics.
 */
export const AnchorLink = createLink(MantineAnchor);

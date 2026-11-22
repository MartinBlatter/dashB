import { Card, Group, Stack, Text, Title } from '@mantine/core';
import { CaretRightIcon } from '@phosphor-icons/react';
import { Link } from '@tanstack/react-router';

import { helpDocs } from '#/lib/help-docs';
import { m } from '#/paraglide/messages';

import classes from './help.module.css';

export default function HelpIndex() {
    return (
        <Stack gap="md">
            <Stack gap={4}>
                <Title order={2}>{m['help.title']()}</Title>
                <Text size="sm" c="dimmed" maw="45rem">
                    {m['help.intro']()}
                </Text>
            </Stack>

            <Stack gap="sm" maw="45rem">
                {helpDocs.map((doc) => (
                    <Card
                        key={doc.slug}
                        withBorder
                        radius="md"
                        padding="md"
                        className={classes.docCard}
                        renderRoot={(props) => (
                            <Link
                                to="/help/$doc"
                                params={{ doc: doc.slug }}
                                {...props}
                            />
                        )}
                    >
                        <Group justify="space-between" wrap="nowrap" gap="md">
                            <Stack gap={2}>
                                <Text fw={600}>{doc.title}</Text>
                                <Text size="sm" c="dimmed">
                                    {doc.description}
                                </Text>
                            </Stack>

                            <CaretRightIcon size={16} />
                        </Group>
                    </Card>
                ))}
            </Stack>
        </Stack>
    );
}

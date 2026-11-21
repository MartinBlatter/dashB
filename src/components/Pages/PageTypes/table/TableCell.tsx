import { Badge, Table, Text } from '@mantine/core';
import { CheckIcon, MinusIcon } from '@phosphor-icons/react';

import { cellText, isEmptyValue } from './format';

import type { StoredWidgetValue } from '#/components/Widgets/types';
import type { TableColumn } from '#/lib/page-tables';

export default function TableCell({
    column,
    value,
    mounted,
}: {
    column: TableColumn;
    value: StoredWidgetValue;
    mounted: boolean;
}) {
    if (column.kind === 'switch') {
        return (
            <Table.Td aria-label={cellText(column, value)}>
                {value === true ? (
                    <CheckIcon size={16} aria-hidden />
                ) : (
                    <MinusIcon
                        size={16}
                        color="var(--mantine-color-dimmed)"
                        aria-hidden
                    />
                )}
            </Table.Td>
        );
    }

    if (isEmptyValue(value)) {
        return (
            <Table.Td>
                <Text size="sm" c="dimmed">
                    —
                </Text>
            </Table.Td>
        );
    }

    if (column.kind === 'datetime') {
        return (
            <Table.Td style={{ whiteSpace: 'nowrap' }}>
                {mounted ? (
                    <Text size="sm">{cellText(column, value)}</Text>
                ) : null}
            </Table.Td>
        );
    }

    if (column.kind === 'select') {
        return (
            <Table.Td>
                <Badge variant="light" size="sm">
                    {cellText(column, value)}
                </Badge>
            </Table.Td>
        );
    }

    if (column.kind === 'number') {
        return (
            <Table.Td ta="right" style={{ whiteSpace: 'nowrap' }}>
                <Text size="sm">{cellText(column, value)}</Text>
            </Table.Td>
        );
    }

    if (column.kind === 'textarea') {
        return (
            <Table.Td style={{ maxWidth: 320 }}>
                <Text
                    size="sm"
                    lineClamp={2}
                    style={{ whiteSpace: 'pre-wrap' }}
                >
                    {cellText(column, value)}
                </Text>
            </Table.Td>
        );
    }

    if (column.kind === 'date') {
        return (
            <Table.Td style={{ whiteSpace: 'nowrap' }}>
                <Text size="sm">{cellText(column, value)}</Text>
            </Table.Td>
        );
    }

    return (
        <Table.Td>
            <Text size="sm">{cellText(column, value)}</Text>
        </Table.Td>
    );
}

import { Badge, Table, Text } from '@mantine/core';
import { CheckIcon, MinusIcon } from '@phosphor-icons/react';

import { cellText, isEmptyValue } from './format';

import type { StoredWidgetValue } from '#/components/Widgets/types';
import type { DateFormat } from '#/lib/date-format';
import type { TableColumn } from '#/lib/table-schema';

export default function TableCell({
    column,
    value,
    mounted,
    dateFormat,
}: {
    column: TableColumn;
    value: StoredWidgetValue;
    mounted: boolean;
    dateFormat: DateFormat;
}) {
    const text = cellText(column, value, dateFormat);

    if (column.kind === 'switch') {
        return (
            <Table.Td aria-label={text}>
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
                {mounted ? <Text size="sm">{text}</Text> : null}
            </Table.Td>
        );
    }

    if (column.kind === 'select') {
        return (
            <Table.Td>
                <Badge variant="light" size="sm">
                    {text}
                </Badge>
            </Table.Td>
        );
    }

    if (column.kind === 'number') {
        return (
            <Table.Td ta="right" style={{ whiteSpace: 'nowrap' }}>
                <Text size="sm">{text}</Text>
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
                    {text}
                </Text>
            </Table.Td>
        );
    }

    if (column.kind === 'date') {
        return (
            <Table.Td style={{ whiteSpace: 'nowrap' }}>
                <Text size="sm">{text}</Text>
            </Table.Td>
        );
    }

    return (
        <Table.Td>
            <Text size="sm">{text}</Text>
        </Table.Td>
    );
}

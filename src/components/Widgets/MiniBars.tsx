import { useState } from 'react';
import { Box, Text } from '@mantine/core';

import { chartBarHeight, chartMax } from './charts';

import classes from './charts.module.css';

export interface MiniBarsDatum {
    key: string;
    label: string;
    value: number;
}

export interface MiniBarsProps {
    data: ReadonlyArray<MiniBarsDatum>;
    height?: number;
    emphasizeLast?: boolean;
    formatValue: (value: number) => string;
    emptyLabel: string;
}

export default function MiniBars({
    data,
    height = 48,
    emphasizeLast = false,
    formatValue,
    emptyLabel,
}: MiniBarsProps) {
    const [hovered, setHovered] = useState<number | null>(null);

    if (data.length === 0) {
        return (
            <Text size="sm" c="dimmed">
                {emptyLabel}
            </Text>
        );
    }

    const max = chartMax(data.map((datum) => datum.value));
    const activeIndex = hovered ?? data.length - 1;
    const active = data[activeIndex];
    const lastIndex = data.length - 1;

    return (
        <Box className={classes.chart}>
            <div className={classes.bars} style={{ height }}>
                {data.map((datum, index) => {
                    const barHeight = chartBarHeight(datum.value, max);

                    return (
                        <button
                            key={datum.key}
                            type="button"
                            className={classes.column}
                            data-active={index === hovered}
                            aria-label={`${datum.label}: ${formatValue(datum.value)}`}
                            onMouseEnter={() => setHovered(index)}
                            onMouseLeave={() => setHovered(null)}
                            onFocus={() => setHovered(index)}
                            onBlur={() => setHovered(null)}
                        >
                            {barHeight === null ? null : (
                                <div
                                    className={classes.bar}
                                    data-emphasis={
                                        emphasizeLast && index === lastIndex
                                    }
                                    style={{ height: barHeight }}
                                />
                            )}
                        </button>
                    );
                })}
            </div>

            <div className={classes.axis} />

            <Text size="xs" c="dimmed" mt={4} truncate>
                {`${active.label} · ${formatValue(active.value)}`}
            </Text>
        </Box>
    );
}

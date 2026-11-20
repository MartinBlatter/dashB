import {
    ActionIcon,
    Badge,
    Box,
    Checkbox,
    Group,
    Menu,
    Text,
} from '@mantine/core';
import {
    DotsThreeVerticalIcon,
    PencilSimpleIcon,
    TrashIcon,
} from '@phosphor-icons/react';

import CellStrip from '#/components/Widgets/CellStrip';
import { brandColor } from '#/lib/theme';

import { t } from './habits';

import type { CellStripDatum } from '#/components/Widgets/CellStrip';
import type { Habit } from './habits';

export default function HabitRow({
    habit,
    days,
    done,
    today,
    streak,
    best,
    weekCount,
    showStreaks,
    busy,
    onToggle,
    onEdit,
    onDelete,
}: {
    habit: Habit;
    days: ReadonlyArray<string>;
    done: ReadonlySet<string>;
    today: string;
    streak: number;
    best: number;
    weekCount: number;
    showStreaks: boolean;
    busy: boolean;
    onToggle: () => void;
    onEdit: () => void;
    onDelete: () => void;
}) {
    const checkedToday = done.has(today);

    const cells: Array<CellStripDatum> = days.map((day) => ({
        key: day,
        label: day,
        level: done.has(day) ? 1 : 0,
        detail: done.has(day) ? t('done') : t('missed'),
    }));

    return (
        <Box>
            <Group gap="xs" wrap="nowrap">
                <Checkbox
                    size="sm"
                    checked={checkedToday}
                    disabled={busy}
                    aria-label={`${
                        checkedToday ? t('done_today') : t('not_done_today')
                    }: ${habit.name}`}
                    onChange={onToggle}
                />

                <Box style={{ flex: 1, minWidth: 0 }}>
                    <Text size="sm" truncate>
                        {habit.name}
                    </Text>
                    <Text size="xs" c="dimmed" truncate>
                        {`${weekCount}/${habit.targetPerWeek} ${t('this_week')}`}
                    </Text>
                </Box>

                {showStreaks && streak > 0 ? (
                    <Badge
                        size="sm"
                        variant="light"
                        color={checkedToday ? brandColor : 'gray'}
                        title={`${t('best')} ${best}${t('days')}`}
                    >
                        {`${streak}${t('days')}`}
                    </Badge>
                ) : null}

                <Menu position="bottom-end" withinPortal>
                    <Menu.Target>
                        <ActionIcon
                            variant="subtle"
                            color="gray"
                            size="sm"
                            aria-label={t('options')}
                        >
                            <DotsThreeVerticalIcon size={14} />
                        </ActionIcon>
                    </Menu.Target>

                    <Menu.Dropdown>
                        <Menu.Item
                            leftSection={<PencilSimpleIcon size={14} />}
                            onClick={onEdit}
                        >
                            {t('edit_habit')}
                        </Menu.Item>
                        <Menu.Item
                            color="red"
                            leftSection={<TrashIcon size={14} />}
                            onClick={onDelete}
                        >
                            {t('delete_habit')}
                        </Menu.Item>
                    </Menu.Dropdown>
                </Menu>
            </Group>

            <Box mt={4} pl={28}>
                <CellStrip
                    data={cells}
                    columns={days.length}
                    emptyLabel={t('empty')}
                />
            </Box>
        </Box>
    );
}

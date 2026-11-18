import 'dayjs/locale/de';

import { Box } from '@mantine/core';
import { MonthView } from '@mantine/schedule';

import { getLocale } from '#/paraglide/runtime';

import { canDragScheduleEvent, t } from './schedule';

import type {
    ScheduleEventData,
    ScheduleLabelsOverride,
} from '@mantine/schedule';

export interface MonthCalendarProps {
    date: string;
    events: Array<ScheduleEventData>;
    firstDayOfWeek: 0 | 1 | 6;
    maxEventsPerDay: number;
    withWeekNumbers: boolean;
    highlightToday: boolean;
    withAgenda: boolean;
    onDateChange: (value: string) => void;
    onDayClick: (date: string) => void;
    onEventClick: (event: ScheduleEventData) => void;
    onEventDrop: (data: {
        eventId: string | number;
        newStart: string;
        newEnd: string;
    }) => void;
}

function labels(): ScheduleLabelsOverride {
    return {
        today: t('lbl_today'),
        next: t('lbl_next'),
        previous: t('lbl_previous'),
        more: t('lbl_more'),
        noEvents: t('lbl_no_events'),
        allDay: t('all_day'),
        agenda: t('lbl_agenda'),
        selectMonth: t('lbl_select_month'),
        selectYear: t('lbl_select_year'),
        weekday: t('lbl_weekday'),
        moreLabel: (count) => `+${count} ${t('lbl_more')}`,
    };
}

export default function MonthCalendar({
    date,
    events,
    firstDayOfWeek,
    maxEventsPerDay,
    withWeekNumbers,
    highlightToday,
    withAgenda,
    onDateChange,
    onDayClick,
    onEventClick,
    onEventDrop,
}: MonthCalendarProps) {
    return (
        <Box mih={340} style={{ flex: 1, minHeight: 0 }}>
            <MonthView
                date={date}
                events={events}
                locale={getLocale()}
                labels={labels()}
                firstDayOfWeek={firstDayOfWeek}
                maxEventsPerDay={maxEventsPerDay}
                withWeekNumbers={withWeekNumbers}
                highlightToday={highlightToday}
                withAgenda={withAgenda}
                consistentWeeks={false}
                withEventsDragAndDrop
                canDragEvent={canDragScheduleEvent}
                canDropEvent={(data) => canDragScheduleEvent(data.event)}
                onDateChange={onDateChange}
                onDayClick={onDayClick}
                onEventClick={onEventClick}
                onEventDrop={onEventDrop}
                h="100%"
            />
        </Box>
    );
}

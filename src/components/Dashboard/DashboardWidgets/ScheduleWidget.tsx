import { Suspense, lazy, useState } from 'react';
import dayjs from 'dayjs';
import {
    ActionIcon,
    Button,
    Divider,
    Group,
    Loader,
    Modal,
    Stack,
    Text,
    Tooltip,
} from '@mantine/core';
import { useQueryClient } from '@tanstack/react-query';
import { GearSixIcon, PlusIcon } from '@phosphor-icons/react';

import {
    calendarCollection,
    decodeCalendarRow,
    deleteCalendarSource,
    importedEventsQueryKey,
    saveIcsText,
    useImportedEvents,
} from '#/lib/calendar-feeds';
import {
    createWidgetRecord,
    useWidgetRecords,
    widgetRecordsQueryKey,
} from '#/lib/widget-records';
import { PICKER_DATE_FORMAT } from '#/components/Widgets/values';
import { useNow } from '#/components/Widgets/useNow';

import AddCalendarModal from './schedule/AddCalendarModal';
import CalendarsPanel from './schedule/CalendarsPanel';
import EventDetail from './schedule/EventDetail';
import EventFormModal from './schedule/EventFormModal';
import {
    decodeEvent,
    eventCollection,
    eventSortKey,
    firstDayOfWeekValue,
    isNativeId,
    maxEventsPerDayValue,
    nativeRecordId,
    normalizeEventValues,
    refreshMinutesValue,
    t,
    toScheduleEvents,
} from './schedule/schedule';

import type { DashboardWidgetMeta, DashboardWidgetProps } from './types';
import type { StoredWidgetValues } from '#/components/Widgets/types';
import type { CalendarSource } from '#/lib/calendar-feeds';
import type { NativeEvent } from './schedule/schedule';
import type { ScheduleEventData } from '@mantine/schedule';

const MonthCalendar = lazy(() => import('./schedule/MonthCalendar'));

export const widgetMeta = {
    type: 'schedule',
    label: () => t('label'),
    description: () => t('description'),
    defaultSize: { w: 6, h: 9, minW: 1, minH: 6 },
    fields: [
        {
            kind: 'select',
            name: 'firstDayOfWeek',
            label: () => t('first_day'),
            defaultValue: 'monday',
            options: () => [
                { value: 'monday', label: t('monday') },
                { value: 'sunday', label: t('sunday') },
                { value: 'saturday', label: t('saturday') },
            ],
        },
        {
            kind: 'number',
            name: 'maxEventsPerDay',
            label: () => t('max_events'),
            description: () => t('max_events_hint'),
            defaultValue: 3,
            min: 1,
            max: 10,
            step: 1,
            required: true,
        },
        {
            kind: 'switch',
            name: 'withWeekNumbers',
            label: () => t('week_numbers'),
            defaultValue: false,
        },
        {
            kind: 'switch',
            name: 'highlightToday',
            label: () => t('highlight_today'),
            defaultValue: true,
        },
        {
            kind: 'switch',
            name: 'withAgenda',
            label: () => t('with_agenda'),
            defaultValue: false,
        },
        {
            kind: 'number',
            name: 'refreshMinutes',
            label: () => t('refresh'),
            description: () => t('refresh_hint'),
            defaultValue: 15,
            min: 1,
            max: 1440,
            step: 5,
            required: true,
        },
    ],
} satisfies DashboardWidgetMeta;

export default function ScheduleWidget({ id, config }: DashboardWidgetProps) {
    const queryClient = useQueryClient();
    const now = useNow(60_000);

    const eventStore = useWidgetRecords(id, eventCollection, 'sortKey');
    const calendarStore = useWidgetRecords(id, calendarCollection, 'position');

    const refreshMinutes = refreshMinutesValue(config);
    const { payload } = useImportedEvents(id, refreshMinutes);

    const [viewDate, setViewDate] = useState<string | null>(null);
    const [addingAt, setAddingAt] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [detail, setDetail] = useState<ScheduleEventData | null>(null);
    const [showCalendars, setShowCalendars] = useState(false);
    const [addingCalendar, setAddingCalendar] = useState(false);
    const [removing, setRemoving] = useState<CalendarSource | null>(null);

    const events = eventStore.records.map(decodeEvent);
    const calendars = calendarStore.records.map((record) =>
        decodeCalendarRow(record.id, record.data)
    );

    const scheduleEvents = toScheduleEvents(
        events,
        payload?.events ?? [],
        calendars
    );

    const editing = events.find((event) => event.id === editingId) ?? null;

    function invalidateFeeds() {
        return queryClient.invalidateQueries({
            queryKey: importedEventsQueryKey(id),
        });
    }

    async function handleCreateEvent(values: StoredWidgetValues) {
        const data = normalizeEventValues(values);

        await eventStore.create({ data, sortKey: eventSortKey(data) });
        setAddingAt(null);
    }

    async function handleEditEvent(
        event: NativeEvent,
        values: StoredWidgetValues
    ) {
        const data = normalizeEventValues(values);

        await eventStore.update({
            id: event.id,
            data,
            sortKey: eventSortKey(data),
        });
        setEditingId(null);
    }

    async function handleDeleteEvent(event: NativeEvent) {
        await eventStore.remove(event.id);
        setEditingId(null);
    }

    function handleEventClick(event: ScheduleEventData) {
        const recordId = nativeRecordId(String(event.id));

        if (recordId !== null && isNativeId(String(event.id))) {
            setEditingId(recordId);
            return;
        }

        setDetail(event);
    }

    async function handleEventDrop(data: {
        eventId: string | number;
        newStart: string;
        newEnd: string;
    }) {
        const recordId = nativeRecordId(String(data.eventId));
        const event = events.find((entry) => entry.id === recordId);

        if (!event) return;

        const moved: NativeEvent = event.allDay
            ? {
                  ...event,
                  start: dayjs(data.newStart).format(PICKER_DATE_FORMAT),
                  end: dayjs(data.newEnd)
                      .subtract(1, 'day')
                      .format(PICKER_DATE_FORMAT),
              }
            : {
                  ...event,
                  start: dayjs(data.newStart).toDate().toISOString(),
                  end: dayjs(data.newEnd).toDate().toISOString(),
              };

        const encoded = normalizeEventValues({
            title: moved.title,
            allDay: moved.allDay,
            start: moved.start,
            end: moved.end,
            repeat: moved.repeat,
            color: moved.color,
            location: moved.location,
            notes: moved.notes,
        });

        await eventStore.update({
            id: event.id,
            data: encoded,
            sortKey: eventSortKey(encoded),
        });
    }

    async function handleAddUrlCalendar(values: StoredWidgetValues) {
        await createWidgetRecord({
            data: {
                widgetId: id,
                collection: calendarCollection,
                data: { ...values, kind: 'url', fileName: '', enabled: true },
            },
        });

        await queryClient.invalidateQueries({
            queryKey: widgetRecordsQueryKey(id, calendarCollection),
        });
        await invalidateFeeds();
    }

    async function handleAddFileCalendar(
        values: StoredWidgetValues,
        fileName: string,
        text: string
    ) {
        const record = await createWidgetRecord({
            data: {
                widgetId: id,
                collection: calendarCollection,
                data: {
                    ...values,
                    kind: 'file',
                    url: '',
                    fileName,
                    enabled: true,
                },
            },
        });

        await saveIcsText({
            data: { widgetId: id, calendarId: record.id, text },
        });

        await queryClient.invalidateQueries({
            queryKey: widgetRecordsQueryKey(id, calendarCollection),
        });
        await invalidateFeeds();
    }

    async function handleToggleCalendar(calendar: CalendarSource) {
        await calendarStore.update({
            id: calendar.id,
            data: {
                name: calendar.name,
                color: calendar.color,
                kind: calendar.kind,
                url: calendar.url,
                fileName: calendar.fileName,
                enabled: !calendar.enabled,
            },
        });
    }

    async function handleRemoveCalendar(calendar: CalendarSource) {
        await deleteCalendarSource({
            data: { widgetId: id, calendarId: calendar.id },
        });

        setRemoving(null);
        await queryClient.invalidateQueries({
            queryKey: widgetRecordsQueryKey(id, calendarCollection),
        });
        await invalidateFeeds();
    }

    const today = now ? dayjs(now) : null;
    const date = viewDate ?? today?.format(`${PICKER_DATE_FORMAT} 00:00:00`);

    return (
        <Stack gap="xs" h="100%">
            <Group justify="space-between" gap="xs">
                <Tooltip label={t('manage_calendars')}>
                    <ActionIcon
                        size="sm"
                        variant="subtle"
                        aria-label={t('manage_calendars')}
                        onClick={() => setShowCalendars((open) => !open)}
                    >
                        <GearSixIcon size={14} />
                    </ActionIcon>
                </Tooltip>

                <Button
                    size="compact-xs"
                    variant="light"
                    leftSection={<PlusIcon size={12} />}
                    onClick={() =>
                        setAddingAt(
                            today?.format(`${PICKER_DATE_FORMAT} HH:mm:00`) ??
                                null
                        )
                    }
                >
                    {t('add_event')}
                </Button>
            </Group>

            {showCalendars ? (
                <>
                    <CalendarsPanel
                        calendars={calendars}
                        statuses={payload?.calendars ?? []}
                        onAdd={() => setAddingCalendar(true)}
                        onToggle={(calendar) =>
                            void handleToggleCalendar(calendar)
                        }
                        onDelete={setRemoving}
                        onRefresh={() => void invalidateFeeds()}
                    />
                    <Divider />
                </>
            ) : null}

            {date === undefined ? (
                <Group justify="center" py="sm">
                    <Loader size="xs" />
                </Group>
            ) : (
                <Suspense
                    fallback={
                        <Group justify="center" py="sm">
                            <Loader size="xs" />
                        </Group>
                    }
                >
                    <MonthCalendar
                        date={date}
                        events={scheduleEvents}
                        firstDayOfWeek={firstDayOfWeekValue(config)}
                        maxEventsPerDay={maxEventsPerDayValue(config)}
                        withWeekNumbers={config.withWeekNumbers === true}
                        highlightToday={config.highlightToday !== false}
                        withAgenda={config.withAgenda === true}
                        onDateChange={(value) =>
                            setViewDate(
                                dayjs(value).format(
                                    `${PICKER_DATE_FORMAT} 00:00:00`
                                )
                            )
                        }
                        onDayClick={(value) => setAddingAt(`${value} 09:00:00`)}
                        onEventClick={handleEventClick}
                        onEventDrop={(data) => void handleEventDrop(data)}
                    />
                </Suspense>
            )}

            <EventFormModal
                opened={addingAt !== null}
                event={null}
                defaultStart={addingAt}
                onClose={() => setAddingAt(null)}
                onSubmit={handleCreateEvent}
            />

            <EventFormModal
                opened={editing !== null}
                event={editing}
                defaultStart={null}
                onClose={() => setEditingId(null)}
                onSubmit={(values) =>
                    editing
                        ? handleEditEvent(editing, values)
                        : Promise.resolve()
                }
                onDelete={
                    editing ? () => handleDeleteEvent(editing) : undefined
                }
            />

            <EventDetail event={detail} onClose={() => setDetail(null)} />

            <AddCalendarModal
                opened={addingCalendar}
                onClose={() => setAddingCalendar(false)}
                onSubmitUrl={handleAddUrlCalendar}
                onSubmitFile={handleAddFileCalendar}
            />

            <Modal
                opened={removing !== null}
                onClose={() => setRemoving(null)}
                title={t('delete_calendar')}
            >
                <Stack gap="sm">
                    <Text size="sm">{t('delete_calendar_prompt')}</Text>

                    <Button
                        color="red"
                        onClick={() =>
                            removing
                                ? void handleRemoveCalendar(removing)
                                : undefined
                        }
                    >
                        {t('delete_calendar')}
                    </Button>
                </Stack>
            </Modal>
        </Stack>
    );
}

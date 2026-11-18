# Creating a dashboard widget

Dashboard widgets are the cards on the dashboard grid — a to-do list, a chart, a
notes pad. Unlike [header widgets](HeaderWidgets.md) they get real space, they
may be interactive, and they can store rows of their own data.

Adding one means **adding one file**. There is no registration list to update, no
entry in `messages/*.json`, no form to build, and — the important part — **no
database change, however much data your widget stores**.

## The shortest working widget

Create `src/components/Dashboard/DashboardWidgets/HelloWidget.tsx`:

```tsx
import { Text } from '@mantine/core';

import { createWidgetMessages } from '#/components/Widgets/i18n';

import type { DashboardWidgetMeta, DashboardWidgetProps } from './types';

const t = createWidgetMessages({
    en: { label: 'Hello' },
    de: { label: 'Hallo' },
});

export const widgetMeta = {
    type: 'hello',
    label: () => t('label'),
} satisfies DashboardWidgetMeta;

export default function HelloWidget({ label }: DashboardWidgetProps) {
    return <Text size="sm">{label}</Text>;
}
```

It now appears in the **Add a widget** dropdown.

## The two required exports

| Export       | What it is                                                                                                              |
| ------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `widgetMeta` | A `DashboardWidgetMeta` object. Always write it with `satisfies DashboardWidgetMeta` so field kinds stay literal types. |
| `default`    | The React component, receiving `DashboardWidgetProps`.                                                                  |

### File name and location

The registry globs `./*Widget.tsx`, so the file **must end in `Widget.tsx`** and
sit **directly** in `src/components/Dashboard/DashboardWidgets/`. A file named
`Chart.tsx` is ignored, and so is `charts/BarWidget.tsx`.

That last point is useful: a subfolder is where a widget's helpers belong. The
shipped to-do widget is `TodoWidget.tsx` plus `todo/tasks.ts`,
`todo/TaskRow.tsx` and `todo/TaskFormModal.tsx` — none of which the glob picks
up.

### `widgetMeta`

```ts
interface DashboardWidgetMeta {
    type: string; // stable id, persisted
    label: () => string; // name in the picker
    description?: () => string; // one-liner under the picker
    fields?: ReadonlyArray<WidgetField>; // settings the user fills in
    defaultSize?: { w: number; h: number; minW?: number; minH?: number };
}
```

`type` is written into the `dashboard_widget.type` column for every instance a
user creates. **Never rename it once rows exist** — those widgets render as
"widget type not installed" instead. Rename the file and the label instead.

`label` and `description` are **functions, not strings**, because the active
locale is only known at render time.

The picker sorts alphabetically by localized label; you cannot choose your
position in the list.

### `defaultSize`

Grid units, not pixels: 12 columns across, each row 60px with a 12px gutter.

| Key    | Meaning                             | Default |
| ------ | ----------------------------------- | ------- |
| `w`    | Width in columns (1–12)             | `4`     |
| `h`    | Height in rows                      | `4`     |
| `minW` | Smallest width the user may drag to | `2`     |
| `minH` | Smallest height                     | `2`     |

`w`/`h` apply only when the widget is created; after that the user's own size is
stored per instance. `minW`/`minH` apply forever, so set them to the point where
your widget stops being readable.

## Translations live in your file

Widget strings come from `createWidgetMessages`, so a widget file is
self-contained and copy-pasteable between projects:

```ts
const t = createWidgetMessages({
    en: { label: 'To-do list', add: 'Add task' },
    de: { label: 'Aufgabenliste', add: 'Aufgabe hinzufügen' },
});

t('label');
```

Every locale in `project.inlang` is **required** by the type, so adding a
language turns into a compile error in each untranslated widget rather than a
silent fallback. A key present in one locale but missing in another is also a
compile error.

Call `t()` during render, never at module scope — it reads the active locale at
call time. These strings are invisible to the inlang tooling; that is the
deliberate trade for self-containment. Strings shared across widgets, like
validation messages, stay in `messages/*.json` under `widget.*`.

## Settings fields

Anything your widget needs from the user goes in `fields`. The **Add a widget**
form is built from this list — you never write form code.

```ts
fields: [
    {
        kind: 'switch',
        name: 'showDone',
        label: () => t('showDone'),
        defaultValue: true,
    },
],
```

Every field accepts `name`, `label`, optional `description` and optional
`required`. Beyond that:

| `kind`     | Input             | Extra options                                                        |
| ---------- | ----------------- | -------------------------------------------------------------------- |
| `text`     | `TextInput`       | `placeholder?`, `maxLength?`, `defaultValue?`                        |
| `textarea` | `Textarea`        | `placeholder?`, `maxLength?`, `rows?`, `defaultValue?`               |
| `number`   | `NumberInput`     | `min?`, `max?`, `step?`, `defaultValue?`                             |
| `date`     | `DatePickerInput` | `defaultValue?`                                                      |
| `datetime` | `DateTimePicker`  | `withSeconds?`, `defaultValue?`                                      |
| `select`   | `Select`          | `options: () => Array<{ value, label }>` (required), `defaultValue?` |
| `switch`   | `Switch`          | `defaultValue?`                                                      |

This field system is shared with header widgets and lives in
[src/components/Widgets/](../src/components/Widgets/). `options` is a function
for the same reason labels are. `required` has no effect on a `switch`.

Validation is derived from what you declare — `required`, `min`, `max` and
`maxLength` are enforced at submit with messages from `messages/*.json`. You do
not write a schema.

### `name` is a storage key

Each field's `name` becomes a key in the `dashboard_widget.config` JSON column.
**Never rename a field once instances exist** — the old key stops being read and
the field falls back to its default. Adding a field later is safe: instances
saved before it appeared get its `defaultValue`.

`label` is **reserved** — it is the instance name every widget gets, so the
registry rejects a field called `label`.

## Reading the config in your component

```tsx
export default function TodoWidget({ id, config }: DashboardWidgetProps) {
    const showDone = config.showDone !== false;
    // ...
}
```

Your component receives:

| Prop     | What it is                                                                                                                             |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `id`     | The `dashboard_widget` row id. **This is the key to your stored records** — pass it to `useWidgetRecords`.                             |
| `label`  | The name the **user** typed for this instance. The frame already renders it in the header bar, so you normally do not render it again. |
| `config` | Values for your `fields`, keyed by field `name`.                                                                                       |

`config` values arrive in the shape the input produces, not the shape the
database holds:

| `kind`                       | Type in `config` | Note                                                  |
| ---------------------------- | ---------------- | ----------------------------------------------------- |
| `text`, `textarea`, `select` | `string`         | `''` when empty                                       |
| `number`                     | `number \| ''`   | `''` when empty — check before doing maths            |
| `switch`                     | `boolean`        | compare with `=== true`, or `!== false` to default on |
| `date`                       | `string`         | `YYYY-MM-DD`; `valueDate()` gives a `Date`            |
| `datetime`                   | `string`         | `YYYY-MM-DD HH:mm:ss`; `valueDate()` gives a `Date`   |

Because `config` is typed `Record<string, string | number | boolean>`, narrow
before use — or use `valueText`, `valueNumber`, `valueDate` from
`#/components/Widgets/values`. A missing or corrupt stored value falls back to
the field's default rather than reaching your component as `undefined`.

## Storing data: the record store

A widget that holds data — tasks, bookmarks, log entries — does **not** get a
table. Every widget shares one generic store:

| Table              | Holds                                                           |
| ------------------ | --------------------------------------------------------------- |
| `dashboard_widget` | One row per placed widget: `type`, `label`, `config`, `x/y/w/h` |
| `widget_record`    | One row per thing a widget stores                               |

A `widget_record` row looks like this:

| Column                   | Use                                                              |
| ------------------------ | ---------------------------------------------------------------- |
| `widgetId`               | Owner. Records are deleted with the widget.                      |
| `collection`             | Which of your record kinds this is. One widget may keep several. |
| `data`                   | Your record, as a **flat map of scalars** (JSON column).         |
| `sortKey`                | Indexed string you compute; order reads by it.                   |
| `position`               | Indexed integer for a user-ordered list.                         |
| `createdAt`, `updatedAt` | Maintained for you; ISO strings on the client.                   |

### `useWidgetRecords`

```tsx
import { useWidgetRecords } from '#/lib/widget-records';

const store = useWidgetRecords(id, 'tasks', 'sortKey');
```

| Argument     | Meaning                                                                   |
| ------------ | ------------------------------------------------------------------------- |
| `widgetId`   | The `id` prop. Scopes everything to this instance.                        |
| `collection` | Your name for this kind of record, e.g. `'tasks'`.                        |
| `order`      | `'sortKey'` or `'position'` (default). Picks which index orders the read. |

It returns:

| Member      | Signature                                                     |
| ----------- | ------------------------------------------------------------- |
| `records`   | `Array<WidgetRecord>`, ordered as requested                   |
| `isLoading` | First load only                                               |
| `create`    | `({ data, sortKey? }) => Promise<void>` — appends             |
| `update`    | `({ id, data, sortKey? }) => Promise<void>` — replaces `data` |
| `remove`    | `(id) => Promise<void>`                                       |

`update` and `remove` apply optimistically, so a checkbox feels instant, then
reconcile against the server. `update` **replaces** `data` wholesale: read the
record, change your copy, write it back.

### The flat-scalar rule

`data` must be a flat `Record<string, string | number | boolean | null>`. No
nested objects, no arrays.

This is what keeps one table serving every widget: the same encoders, the same
generated form and the same validators work on a config object and on a record.
If you need a list, make each item its own record; if you need nesting, flatten
the keys (`due_date`, `due_scope`).

### Validate on the way in

The server validates `data` **shape only** — it checks that the values are flat
scalars, not that they are _your_ fields. Your field declarations are the schema
and they are enforced in the form, which means a row written by an older version
of your widget, or by hand, can still be wrong.

So decode defensively, exactly once, and work with the decoded type after that:

```ts
export function decodeTask(record: WidgetRecord): Task {
    const { data } = record;

    return {
        id: record.id,
        title: typeof data.title === 'string' ? data.title : '',
        scope: asScope(data.scope), // falls back to 'day'
        timesRequired:
            typeof data.timesRequired === 'number' && data.timesRequired >= 1
                ? Math.floor(data.timesRequired)
                : 1,
    };
}
```

`todo/tasks.ts` is the pattern to copy: a `decodeTask`/`encodeTask` pair and a
`Task` type, so nothing downstream touches raw `data`.

### Reusing the generated form for records

Record forms are not built in — but the same machinery that generates your
settings form will generate one. Declare fields for a record and hand them to
`FieldsForm`:

```tsx
import FieldsForm from '#/components/Widgets/FieldsForm';

<FieldsForm
    fields={taskFields}
    initialValues={fromStoredValues(taskFields, existing ?? {})}
    submitLabel={t('add')}
    onSubmit={async (values) => {
        await store.create({ data: values, sortKey: taskSortKey(values) });
    }}
/>;
```

`onSubmit` receives values already encoded for storage, so they can go straight
into `create` or `update`. Runtime state your form does not collect (progress
counters, timestamps) gets merged in at that point:

```tsx
await store.create({ data: { ...values, timesDone: 0, doneAt: null } });
```

### Ownership

Every record call resolves the session on the server and joins through
`dashboard_widget.userId`, so a request for another user's `widgetId` returns an
empty list, and writes to someone else's record fail. You do not pass a user id
and cannot widen this from a widget.

## The frame around your widget

`WidgetFrame` wraps every widget and supplies the shaded header bar — drag
handle, the instance label, and a menu with **Edit widget** and **Delete
widget**. Your component renders the body only.

Two consequences:

- **Dragging only starts on the header bar.** Buttons, inputs, scrolling and
  selection inside the body are yours — unlike a header widget, a dashboard
  widget is expected to be interactive.
- **The body scrolls.** It is a flex child with `overflow: auto`, so a long list
  scrolls inside the card instead of stretching the grid. Lay out for a narrow
  column; the user may shrink you to `minW`.

Do not render the instance label again — the frame already shows it.

## Server rendering

The dashboard is server-rendered for signed-in users, and the grid itself only
mounts after it has measured its container, so your widget's first client render
happens after mount.

`useNow` from `#/components/Widgets/useNow` returns `null` until mounted so that
clock output cannot cause a hydration mismatch. Handle it:

```tsx
const now = useNow(30_000);

if (!now) return null;
```

Pass an interval that matches what you show — the default is one second, which a
list of deadlines does not need. Never call `new Date()` in render for displayed
output.

## Helpers you can use

| Helper                                  | From                              | What it does                                            |
| --------------------------------------- | --------------------------------- | ------------------------------------------------------- |
| `createWidgetMessages`                  | `#/components/Widgets/i18n`       | Your widget's own translations                          |
| `useNow(intervalMs?)`                   | `#/components/Widgets/useNow`     | Ticking `Date`, `null` until mounted                    |
| `valueText`, `valueNumber`, `valueDate` | `#/components/Widgets/values`     | Narrow one `config` value                               |
| `fromStoredValues`, `toStoredValues`    | `#/components/Widgets/values`     | Convert between stored and form shapes for a field list |
| `widgetValueDefaults(fields)`           | `#/components/Widgets/values`     | Default form values for a field list                    |
| `FieldsForm`                            | `#/components/Widgets/FieldsForm` | A validated form for any field list                     |
| `useWidgetRecords`                      | `#/lib/widget-records`            | Your widget's rows                                      |

## What happens automatically

- **Discovery** — the registry globs your file at build time.
- **The picker** — your widget appears in **Add a widget**, sorted
  alphabetically by localized label, searchable.
- **The form** — built from `fields`, with the shared **Name** input on top,
  pre-filled with your `widgetMeta.label`.
- **Validation** — derived from your field declarations.
- **Storage** — one `dashboard_widget` row; `date` is stored as `YYYY-MM-DD`,
  `datetime` normalised to UTC ISO, an empty optional field as `null`.
- **Placement** — new widgets are appended below the lowest one. Dragging and
  resizing persist per instance; you have no say after `defaultSize`.
- **Editing and deleting** — the frame menu reopens your generated form
  prefilled, or deletes the row and every record it owns.

## When you get it wrong

The registry validates every discovered module. In development it **throws** so
you see it immediately; in production it logs and skips the widget rather than
taking the dashboard down. Messages are prefixed `[DashboardWidgets]` and name
the file:

- no default-exported component, or no `widgetMeta` with a non-empty `type`
- `label` that is not a function
- a `type` already used by another widget file
- a field with no `name`, a duplicate `name`, or an unknown `kind`
- a field named `label`, which is reserved

A widget whose `type` is in the database but no longer in the code is not an
error: that instance renders a "not installed" notice and keeps its row and its
records, so restoring the file restores the widget.

## Editing an existing widget

The frame menu reopens the form your `fields` generate, prefilled from saved
values. Two consequences for your component:

- **Values change under you.** After an edit, `config` arrives with new values
  and your component re-renders. Derive from `config` on every render rather
  than copying it into state on mount.
- **Field `name`s are the migration surface.** An edit writes the whole config
  object from the current field list, so a field you have since renamed is
  dropped at that point rather than merely ignored.

Editing cannot change a widget's `type`.

## Worked example

A bookmarks widget: settings decide whether links open in a new tab, and each
bookmark is a record. Save as
`src/components/Dashboard/DashboardWidgets/BookmarksWidget.tsx`:

```tsx
import { useState } from 'react';
import {
    ActionIcon,
    Anchor,
    Button,
    Group,
    Modal,
    Stack,
    Text,
} from '@mantine/core';
import { PlusIcon, TrashIcon } from '@phosphor-icons/react';

import FieldsForm from '#/components/Widgets/FieldsForm';
import { createWidgetMessages } from '#/components/Widgets/i18n';
import { useWidgetRecords } from '#/lib/widget-records';

import type { DashboardWidgetMeta, DashboardWidgetProps } from './types';
import type { WidgetField } from '#/components/Widgets/types';

const t = createWidgetMessages({
    en: {
        label: 'Bookmarks',
        description: 'A short list of links',
        newTab: 'Open in a new tab',
        title: 'Title',
        url: 'Address',
        add: 'Add bookmark',
        remove: 'Remove',
        empty: 'No bookmarks yet.',
    },
    de: {
        label: 'Lesezeichen',
        description: 'Eine kurze Liste von Links',
        newTab: 'In neuem Tab öffnen',
        title: 'Titel',
        url: 'Adresse',
        add: 'Lesezeichen hinzufügen',
        remove: 'Entfernen',
        empty: 'Noch keine Lesezeichen.',
    },
});

const bookmarkFields: ReadonlyArray<WidgetField> = [
    {
        kind: 'text',
        name: 'title',
        label: () => t('title'),
        required: true,
        maxLength: 80,
    },
    { kind: 'text', name: 'url', label: () => t('url'), required: true },
];

export const widgetMeta = {
    type: 'bookmarks',
    label: () => t('label'),
    description: () => t('description'),
    defaultSize: { w: 3, h: 5, minW: 2, minH: 3 },
    fields: [
        {
            kind: 'switch',
            name: 'newTab',
            label: () => t('newTab'),
            defaultValue: true,
        },
    ],
} satisfies DashboardWidgetMeta;

export default function BookmarksWidget({ id, config }: DashboardWidgetProps) {
    const store = useWidgetRecords(id, 'bookmarks');
    const [adding, setAdding] = useState(false);

    const newTab = config.newTab !== false;

    return (
        <Stack gap="xs">
            <Group justify="flex-end">
                <Button
                    size="compact-xs"
                    variant="light"
                    leftSection={<PlusIcon size={12} />}
                    onClick={() => setAdding(true)}
                >
                    {t('add')}
                </Button>
            </Group>

            {store.records.length === 0 ? (
                <Text size="sm" c="dimmed">
                    {t('empty')}
                </Text>
            ) : (
                store.records.map((record) => (
                    <Group key={record.id} gap="xs" wrap="nowrap">
                        <Anchor
                            href={String(record.data.url ?? '')}
                            target={newTab ? '_blank' : undefined}
                            rel="noreferrer"
                            size="sm"
                            truncate
                            style={{ flex: 1 }}
                        >
                            {String(record.data.title ?? '')}
                        </Anchor>
                        <ActionIcon
                            variant="subtle"
                            color="red"
                            size="sm"
                            aria-label={t('remove')}
                            onClick={() => void store.remove(record.id)}
                        >
                            <TrashIcon size={14} />
                        </ActionIcon>
                    </Group>
                ))
            )}

            <Modal
                opened={adding}
                onClose={() => setAdding(false)}
                title={t('add')}
            >
                <FieldsForm
                    fields={bookmarkFields}
                    submitLabel={t('add')}
                    onSubmit={async (values) => {
                        await store.create({ data: values });
                        setAdding(false);
                    }}
                />
            </Modal>
        </Stack>
    );
}
```

Note what is absent: no migration, no server function, no query key, no
validation schema, no drag handling, no delete confirmation.

The shipped to-do widget is the fuller version of the same shape — read
`TodoWidget.tsx` with `todo/tasks.ts` next to it for deadline buckets, repeats
and a `sortKey`.

## When a widget needs more than one file

Everything above holds for a widget whose data the user types in. A widget that
has to reach outside the browser needs more, and the schedule widget is the
first one that does. Reach for this only when one of these applies:

| Reason                                             | Why the record store is not enough                                                                                                                                                     |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| It talks to the network                            | Fetching a third-party URL from the browser is blocked by CORS, and the URL may be a secret (a calendar feed link grants read access to the whole calendar). It belongs on the server. |
| It needs a library the browser should not download | `ical.js` only ever runs on the server, so it must not be reachable from a component.                                                                                                  |
| It stores a payload too big to ship to the client  | `fetchWidgetRecords` returns the whole `data` blob, so an uploaded file of a few hundred KB would land in every page load.                                                             |

What that looks like, using `#/lib/calendar-feeds.ts` as the example:

- **Put the server function in `src/lib/`, not in the widget folder.** It is a
  server function like any other: `createServerFn`, a Zod validator, and the
  same ownership check the record store uses — resolve the session with
  `getRequest()`, then confirm the `dashboard_widget` row belongs to that user.
  Never accept a user id from the client.
- **Keep the heavy imports unexported.** Handler bodies are replaced by RPC
  stubs in the client build, so anything only reachable from a handler is
  removed with them — `prisma`, `node:` imports and the parser included. A
  widget may import that module directly for its types and server functions;
  `TodoWidget.tsx` already imports `#/lib/widget-records.ts`, which imports
  `prisma`. Verify after a build:
  `grep -ril "better-sqlite3\|PrismaClient" .output/public` must print nothing.
- **A server-only collection is just a collection you never read from the
  client.** The raw `.ics` text lives in a `widget_record` row that no
  `useWidgetRecords` call ever asks for; only the server function reads it, via
  `prisma`.
- **You now own a second query key, and nothing invalidates it for you.**
  `useWidgetRecords` only invalidates its own key, so a mutation that changes
  what the server function would return has to invalidate that key explicitly.
- **There is no cascade between records.** Deleting a row that another
  collection points at orphans the other row. Delete both in one
  `prisma.$transaction` in a server function rather than from the component.
- **Keep timezone conversion on the client.** `dayjs` on the server uses the
  server's timezone, so a server function must return UTC instants (or
  date-only strings for all-day values) and let the component format them.

A widget that needs its own stylesheet adds it to the root route's `head()`
links beside the Mantine ones, so the order is deterministic in dev and in a
production build. A side-effect `import` of a CSS file inside the widget works
by accident in dev and becomes chunk-order-dependent in prod.

Finally, if the widget pulls in a large library, keep that library out of the
eager glob. `registry.ts` imports every `*Widget.tsx` eagerly, so a bare import
lands in the main chunk and every page pays for it. Put the component that
touches the library in the subfolder and load it with `lazy()`; `widgetMeta`
stays in the eager file. `ScheduleWidget.tsx` does this for
`@mantine/schedule`.

## Checklist

- [ ] File is directly in `src/components/Dashboard/DashboardWidgets/` and named `*Widget.tsx`
- [ ] Exports `widgetMeta` with `satisfies DashboardWidgetMeta`
- [ ] Exports a default component taking `DashboardWidgetProps`
- [ ] `type` is unique and one you will never rename
- [ ] `label`, `description`, field `label`s and `options` are all functions
- [ ] Every locale is covered in `createWidgetMessages`
- [ ] No field named `label`; field `name`s are unique and ones you will never rename
- [ ] `config` values are narrowed before use
- [ ] Stored records are flat scalars, decoded through one defensive decoder
- [ ] `useWidgetRecords` is keyed by the `id` prop
- [ ] Handles `useNow()` returning `null`, if it uses the clock
- [ ] Readable at `minW`/`minH`, and scrolls rather than stretching

## Reference

| File                                                               | Role                                                                                                        |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| `DashboardWidgets/registry.ts`                                     | Globs and validates widget files; `getDashboardWidget`, `dashboardWidgetOptions`                            |
| `DashboardWidgets/types.ts`                                        | `DashboardWidgetMeta`, `DashboardWidgetProps`, `DashboardWidgetSize`                                        |
| `DashboardWidgets/TodoWidget.tsx`, `todo/`                         | The shipped to-do widget and its helpers                                                                    |
| `DashboardWidgets/ScheduleWidget.tsx`, `schedule/`                 | The shipped schedule widget; the example of a widget with its own server function and a lazy-loaded library |
| `Dashboard.tsx`                                                    | Loads instances, builds grid items, persists placement                                                      |
| `DashboardGrid.tsx`                                                | The 12-column grid, drag handle wiring, resize handles                                                      |
| `WidgetFrame.tsx`                                                  | Header bar, drag handle, edit/delete menu, scrolling body                                                   |
| `AddWidgetModal.tsx`                                               | The picker and the add form                                                                                 |
| `EditWidgetModal.tsx`, `DeleteWidgetModal.tsx`                     | Editing one instance, and the delete confirmation                                                           |
| `#/components/Widgets/`                                            | The shared field system: types, registry factory, values, validation, `FieldsForm`                          |
| `#/lib/dashboard-widgets.ts`                                       | Server functions for instances and placement                                                                |
| `#/lib/widget-records.ts`                                          | Server functions and `useWidgetRecords` for stored rows                                                     |
| `#/lib/calendar-feeds.ts`, `#/lib/ics.ts`, `#/lib/calendar-url.ts` | Calendar feed fetching with its SSRF guard and cache, the `ical.js` parser, and URL normalisation           |
| `prisma/schema.prisma`                                             | `DashboardWidget` and `WidgetRecord`                                                                        |

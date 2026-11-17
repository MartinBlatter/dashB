# Creating a header widget

Header widgets are the small readouts centred in the app header — a countdown, a
clock, anything that shows a bit of live information.

Adding one means **adding one file**. There is no registration list to update,
no entry in `messages/*.json`, no database change, and no form to build. The
registry discovers your file at build time and everything else follows from what
your file declares.

## The shortest working widget

Create `src/components/Header/HeaderWidgets/HelloWidget.tsx`:

```tsx
import { Text } from '@mantine/core';

import { createWidgetMessages } from './i18n';

import type { HeaderWidgetMeta, HeaderWidgetProps } from './types';

const t = createWidgetMessages({
    en: { label: 'Hello' },
    de: { label: 'Hallo' },
});

export const widgetMeta = {
    type: 'hello',
    label: () => t('label'),
} satisfies HeaderWidgetMeta;

export default function HelloWidget({ label }: HeaderWidgetProps) {
    return <Text size="sm">{label}</Text>;
}
```

That is it. Restart nothing, register nothing — the widget now appears in the
**Add widget** dropdown.

## The two required exports

Your file must export exactly these:

| Export       | What it is                                                                                                                              |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| `widgetMeta` | A `HeaderWidgetMeta` object describing the widget. Always write it with `satisfies HeaderWidgetMeta` so field kinds stay literal types. |
| `default`    | The React component, receiving `HeaderWidgetProps`.                                                                                     |

### File name

The registry globs `./*Widget.tsx`, so the file name **must end in `Widget.tsx`**
and live directly in `src/components/Header/HeaderWidgets/`. A file named
`Clock.tsx` or one in a subfolder is silently ignored.

### `widgetMeta`

```ts
interface HeaderWidgetMeta {
    type: string; // stable id, persisted
    label: () => string; // name in the picker
    description?: () => string; // one-liner under the picker
    fields?: ReadonlyArray<WidgetField>; // extra inputs you need
}
```

`type` is written into the `header_widget.type` column for every instance a user
creates. **Never rename it once rows exist** — those widgets would stop
resolving and vanish from the header. Rename the file and the label instead.

`label` and `description` are **functions, not strings**. The active locale is
only known at render time, so a resolved string would freeze the name to
whichever language was loaded first.

There is no `order` property. The picker sorts alphabetically by the localized
label, so you do not get to choose where your widget appears in the list.

## Translations live in your file

Widgets carry their own strings via `createWidgetMessages`, so a widget file is
self-contained and copy-pasteable between projects:

```ts
const t = createWidgetMessages({
    en: { label: 'Countdown', target: 'Target date' },
    de: { label: 'Countdown', target: 'Zieldatum' },
});

t('label');
```

Every locale in `project.inlang` is **required** by the type. Adding a language
to the project turns into a compile error in each widget that has not been
translated, rather than a widget quietly falling back in the UI. A key present
in one locale but missing in another is also a compile error.

Call `t()` during render, never at module scope — it reads the active locale at
call time.

These strings are invisible to the inlang tooling (no extraction, no missing
translation report). That is the deliberate trade for self-containment. Strings
shared across widgets, like validation messages, stay in `messages/*.json`.

## Configuration fields

Anything your widget needs from the user goes in `fields`. The **Add widget**
form is built from this list — you never write form code.

```ts
fields: [
    {
        kind: 'datetime',
        name: 'target',
        label: () => t('target'),
        description: () => t('targetHint'),
        required: true,
    },
    {
        kind: 'switch',
        name: 'showSeconds',
        label: () => t('showSeconds'),
        defaultValue: false,
    },
],
```

Every field accepts `name`, `label`, optional `description`, and optional
`required`. Beyond that:

| `kind`     | Input            | Extra options                                                        |
| ---------- | ---------------- | -------------------------------------------------------------------- |
| `text`     | `TextInput`      | `placeholder?`, `maxLength?`, `defaultValue?`                        |
| `number`   | `NumberInput`    | `min?`, `max?`, `step?`, `defaultValue?`                             |
| `datetime` | `DateTimePicker` | `withSeconds?`, `defaultValue?`                                      |
| `select`   | `Select`         | `options: () => Array<{ value, label }>` (required), `defaultValue?` |
| `switch`   | `Switch`         | `defaultValue?`                                                      |

`options` is a function for the same reason labels are: option labels follow the
active locale.

`required` has no effect on a `switch` — a switch is always either on or off.

Validation is derived from what you declare. `required`, `min`, `max` and
`maxLength` are enforced at submit with messages from `messages/*.json`; you do
not write a schema.

### `name` is a storage key

Each field's `name` becomes a key in the `header_widget.config` JSON column.
**Never rename a field once instances exist** — the old key stops being read and
the field falls back to its default. Adding a new field to an existing widget is
safe: instances saved before it appeared get its `defaultValue`.

## Reading the config in your component

```tsx
export default function CountdownWidget({ label, config }: HeaderWidgetProps) {
    const target = configDate(config, 'target');
    const withSeconds = config.showSeconds === true;
    // ...
}
```

Your component receives:

| Prop     | What it is                                                                                                                  |
| -------- | --------------------------------------------------------------------------------------------------------------------------- |
| `id`     | The `header_widget` row id.                                                                                                 |
| `label`  | The name **the user** typed when adding this instance — not your `widgetMeta.label`. Render this, not the widget kind name. |
| `config` | Values for your `fields`, keyed by field `name`.                                                                            |

`config` values come back in the shape the input produces, not the shape the
database holds:

| `kind`           | Type in `config` | Note                                                      |
| ---------------- | ---------------- | --------------------------------------------------------- |
| `text`, `select` | `string`         | `''` when empty                                           |
| `number`         | `number \| ''`   | `''` when empty — check for it before doing maths         |
| `switch`         | `boolean`        | compare with `=== true`                                   |
| `datetime`       | `string`         | `YYYY-MM-DD HH:mm:ss`; use `configDate()` to get a `Date` |

Because `config` is typed as `Record<string, string | number | boolean>`, narrow
before use:

```ts
const zone = typeof config.zone === 'string' ? config.zone : 'UTC';
```

A missing or corrupt stored value falls back to the field's default rather than
reaching your component as `undefined` or crashing.

## Helpers you can use

| Helper                                           | From         | What it does                                                                  |
| ------------------------------------------------ | ------------ | ----------------------------------------------------------------------------- |
| `createWidgetMessages`                           | `./i18n`     | Your widget's own translations.                                               |
| `configDate(config, name)`                       | `./values`   | Reads a `datetime` field as a `Date`, or `undefined` if unset or unparseable. |
| `useNow(intervalMs?)`                            | `./useNow`   | A ticking `Date`, defaulting to one second. Returns `null` until mounted.     |
| `formatDuration(ms, { withSeconds, daySuffix })` | `./duration` | `3d 04:12:09` style output, clamped at zero.                                  |

### Why `useNow` returns `null` first

The header is server-rendered for signed-in users. Reading the clock during SSR
would hydrate against a different time and trip a React hydration mismatch, so
`useNow` returns `null` on the first render and the real time after mount.
Handle that case — return `null`, or show a placeholder:

```tsx
const now = useNow();

if (!now) return null;
```

Never call `new Date()` directly in render for displayed output, for the same
reason.

## What happens automatically

- **Discovery** — the registry globs your file at build time.
- **The picker** — your widget appears in the **Add widget** dropdown, sorted
  alphabetically by localized label, searchable.
- **The form** — built from `fields`, with the shared **Name** input on top
  (pre-filled with your `widgetMeta.label`).
- **Validation** — derived from your field declarations.
- **Storage** — one `header_widget` row with your values in its `config` JSON
  column. `datetime` is normalised to UTC ISO so a stored value does not depend
  on the timezone it was entered in; an empty optional field stores `null`.
- **Ordering** — new widgets are appended to the right; users drag to reorder.
  You have no say in instance placement.
- **Centring** — the wrapper centres text, so a plain `<div>` of `<Text>` lines
  is already centred.

## Layout constraints

The widget bar sits between the nav toggle and the header buttons, and the
buttons always win the space contest: an oversized widget is **clipped**, not
accommodated. Keep widgets narrow — a label plus a short value.

The bar is hidden below Mantine's `sm` breakpoint, so do not rely on your widget
being visible on phones.

Each widget is flanked by a drag handle and an edit button, both supplied by the
bar. Your component only renders the readout — it is not itself a drag handle,
so a stray pointer gesture inside it will not start a drag. Keep it
non-interactive anyway: a widget sits in a row of other widgets and has no room
for controls of its own, and anything a user should be able to change belongs in
`fields`, where it gets a proper form and is persisted.

## When you get it wrong

The registry validates every discovered module. In development it **throws** so
you see the problem immediately; in production it logs and skips the widget
rather than taking the header down. Messages are prefixed `[HeaderWidgets]` and
name the offending file:

- no default-exported component, or no `widgetMeta` with a non-empty `type`
- `label` that is not a function
- a `type` already used by another widget file
- a field with no `name`, a duplicate `name`, or an unknown `kind`

## Editing an existing widget

The pencil button next to a widget reopens the same form your `fields` generate,
prefilled from the saved values, and writes the changes back to that row. You
get this for free — there is nothing to implement per widget.

Two consequences for how you design a widget:

- **Values can change under your component.** After an edit, `config` arrives
  with new values and your component re-renders. Derive from `config` on each
  render rather than copying it into state on mount.
- **Field `name`s are the migration surface.** An edit writes the whole config
  object from the current field list, so a field you have since renamed is
  dropped at that point rather than merely ignored.

Editing cannot change a widget's `type`. A user who wants a different kind of
widget adds one.

## Deleting a widget

The edit form has a **Delete widget** button, which asks for confirmation before
removing the row. Nothing to implement per widget, and nothing your component
needs to handle: a deleted widget simply stops being rendered.

Deleting leaves a gap in the stored positions — removing the middle of three
widgets leaves `0` and `2`. That is intentional and harmless, since instances
are ordered by `position` ascending rather than by its absolute value. The next
reorder rewrites them contiguously.

## Worked example

A world clock, exercising a `select`, a `switch` and the `useNow` helper. Save as
`src/components/Header/HeaderWidgets/WorldClockWidget.tsx`:

```tsx
import { Text } from '@mantine/core';

import { createWidgetMessages } from './i18n';
import { useNow } from './useNow';

import type { HeaderWidgetMeta, HeaderWidgetProps } from './types';

const t = createWidgetMessages({
    en: {
        label: 'World clock',
        description: 'Current time in another timezone',
        zone: 'Timezone',
        showSeconds: 'Show seconds',
    },
    de: {
        label: 'Weltzeit',
        description: 'Aktuelle Uhrzeit in einer anderen Zeitzone',
        zone: 'Zeitzone',
        showSeconds: 'Sekunden anzeigen',
    },
});

const ZONES = ['UTC', 'Europe/Zurich', 'America/New_York', 'Asia/Tokyo'];

export const widgetMeta = {
    type: 'worldclock',
    label: () => t('label'),
    description: () => t('description'),
    fields: [
        {
            kind: 'select',
            name: 'zone',
            label: () => t('zone'),
            defaultValue: 'UTC',
            options: () => ZONES.map((zone) => ({ value: zone, label: zone })),
        },
        {
            kind: 'switch',
            name: 'showSeconds',
            label: () => t('showSeconds'),
            defaultValue: false,
        },
    ],
} satisfies HeaderWidgetMeta;

export default function WorldClockWidget({ label, config }: HeaderWidgetProps) {
    const now = useNow();
    const zone = typeof config.zone === 'string' ? config.zone : 'UTC';

    if (!now) return null;

    return (
        <div>
            <Text size="sm" fw={500}>
                {label}
            </Text>
            <Text size="xs" c="dimmed">
                {now.toLocaleTimeString(undefined, {
                    timeZone: zone,
                    hour: '2-digit',
                    minute: '2-digit',
                    second: config.showSeconds === true ? '2-digit' : undefined,
                })}
            </Text>
        </div>
    );
}
```

## Checklist

- [ ] File is in `src/components/Header/HeaderWidgets/` and named `*Widget.tsx`
- [ ] Exports `widgetMeta` with `satisfies HeaderWidgetMeta`
- [ ] Exports a default component taking `HeaderWidgetProps`
- [ ] `type` is unique and one you will never rename
- [ ] `label`, `description`, field `label`s and `options` are all functions
- [ ] Every locale is covered in `createWidgetMessages`
- [ ] Field `name`s are unique and ones you will never rename
- [ ] `config` values are narrowed before use
- [ ] Renders the user's `label` prop, not the widget kind name
- [ ] Handles `useNow()` returning `null`
- [ ] Narrow enough to sit in a header

## Reference

| File                             | Role                                                                       |
| -------------------------------- | -------------------------------------------------------------------------- |
| `registry.ts`                    | Globs and validates widget files; `getHeaderWidget`, `headerWidgetOptions` |
| `types.ts`                       | `HeaderWidgetMeta`, `HeaderWidgetProps`, the `WidgetField` union           |
| `i18n.ts`                        | `createWidgetMessages`                                                     |
| `values.ts`                      | Encoding to and from the `config` column; `configDate`                     |
| `validation.ts`                  | Builds the submit validator from field declarations                        |
| `WidgetConfigFields.tsx`         | Maps each field kind to a bound input                                      |
| `WidgetForm.tsx`                 | The form body, shared by the add and edit modals                           |
| `useNow.ts`, `duration.ts`       | Ticking clock and duration formatting helpers                              |
| `HeaderWidgetBar.tsx`            | Renders, reorders and opens the editor for instances                       |
| `../AddHeaderWidgetModal.tsx`    | The picker and the add form                                                |
| `../EditHeaderWidgetModal.tsx`   | The edit form for one instance, and the delete entry point                 |
| `../DeleteHeaderWidgetModal.tsx` | The delete confirmation                                                    |
| `#/lib/header-widgets.ts`        | Server functions, query and mutation                                       |

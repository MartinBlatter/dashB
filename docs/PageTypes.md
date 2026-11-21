# Creating a page type

Every page in the sidebar renders through **one template**. What that template
puts inside itself is decided by the page's **type**.

A page type is one file. The registry globs it at build time, so there is no
registration list to update, no entry in `messages/*.json`, no form to build and
no database change.

This is the same contract as [dashboard widgets](DashboardWidgets.md), down to
the field declarations and the generated settings form. If you have written a
widget you already know this system; the differences are listed at the end.

## The shortest working page type

Create `src/components/Pages/PageTypes/HelloPageType.tsx`:

```tsx
import { Text } from '@mantine/core';

import { createWidgetMessages } from '#/components/Widgets/i18n';

import type { PageTypeMeta, PageTypeProps } from './types';

const t = createWidgetMessages({
    en: { label: 'Hello' },
    de: { label: 'Hallo' },
});

export const widgetMeta = {
    type: 'hello',
    label: () => t('label'),
} satisfies PageTypeMeta;

export default function HelloPageType({ title }: PageTypeProps) {
    return <Text size="sm">{title}</Text>;
}
```

It now appears in the **Set page type** picker on any page that has no type yet.

## The two required exports

| Export       | What it is                                                                                                |
| ------------ | --------------------------------------------------------------------------------------------------------- |
| `widgetMeta` | A `PageTypeMeta` object. Always write it with `satisfies PageTypeMeta` so field kinds stay literal types. |
| `default`    | The React component, receiving `PageTypeProps`.                                                           |

The meta export is called `widgetMeta`, not `pageTypeMeta`. Page types and
widgets share one registry factory
([src/components/Widgets/registry.ts](../src/components/Widgets/registry.ts)),
which reads that key — so a widget and a page type stay copy-pasteable into each
other.

### File name and location

The registry globs `./*PageType.tsx`, so the file **must end in `PageType.tsx`**
and sit **directly** in `src/components/Pages/PageTypes/`. A file named
`Notes.tsx` is ignored, and so is `notes/ListPageType.tsx`.

That last point is useful: a subfolder is where a page type's helpers belong.

### `widgetMeta`

```ts
interface PageTypeMeta {
    type: string; // stable id, persisted
    label: () => string; // name in the picker
    description?: () => string; // one-liner above the settings form
    icon?: Icon; // sidebar icon for pages of this type
    fields?: ReadonlyArray<WidgetField>; // settings the user fills in
}
```

`type` is written into the `page.type` column of every page that uses it.
**Never rename it once pages use it** — those pages render "page type not
installed" instead. Rename the file and the label instead.

`label` and `description` are **functions, not strings**, because the active
locale is only known at render time.

The picker sorts alphabetically by localized label; you cannot choose your
position in the list.

### `icon`

A Phosphor icon **component**, passed by reference and never rendered in the
meta — `icon: NoteIcon`, not `icon: <NoteIcon />`. It is what the sidebar shows
next to every page of your type, so pick one that reads at 16px.

The sidebar falls back on its own when it has to, and you cannot configure
these:

| Page                       | Icon in the sidebar                           |
| -------------------------- | --------------------------------------------- |
| your type, with an `icon`  | your icon                                     |
| your type, no `icon`       | a plain file                                  |
| no type set yet            | a dashed file, dimmed                         |
| type set but not installed | a yellow warning, labelled for screen readers |

The icons are decorative and `aria-hidden`; the page title is already the link
text. Only the warning carries a label, because it is the one that says
something the title does not.

## Translations live in your file

Page type strings come from `createWidgetMessages`, so the file is
self-contained and copy-pasteable between projects:

```ts
const t = createWidgetMessages({
    en: { label: 'Notes', empty: 'Nothing here yet' },
    de: { label: 'Notizen', empty: 'Noch nichts hier' },
});

t('label');
```

Every locale in `project.inlang` is **required** by the type, so adding a
language turns into a compile error in each untranslated page type rather than a
silent fallback. A key present in one locale but missing in another is also a
compile error.

Call `t()` during render, never at module scope — it reads the active locale at
call time. Strings shared across the app, like the not-installed notice, stay in
`messages/*.json` under `page.*`.

When a page type grows helper components, its `t` moves into the subfolder —
see `notes/i18n.ts` — so the page type and its parts share one set of strings
and the page type file still owns them.

## Settings fields

Anything your page type needs from the user goes in `fields`. The **Set page
type** form is built from this list — you never write form code.

```ts
fields: [
    {
        kind: 'select',
        name: 'density',
        label: () => t('density'),
        defaultValue: 'comfortable',
        options: () => [
            { value: 'comfortable', label: t('comfortable') },
            { value: 'compact', label: t('compact') },
        ],
    },
],
```

The available kinds are `text`, `textarea`, `number`, `date`, `datetime`,
`select` and `switch`. They are documented in full, with their per-kind options
and validation behaviour, in
[DashboardWidgets.md](DashboardWidgets.md) — the field system is shared and
behaves identically here.

### `name` is a storage key

Each field's `name` becomes a key in the `page.config` JSON column. **Never
rename a field once pages use the type** — the old key stops being read and the
field falls back to its default. Adding a field later is safe: pages saved
before it appeared get its `defaultValue`.

`label` is **reserved** and the registry rejects a field that uses it. A widget
needs that name for the instance name the user types; a page has no such input,
because it already has its own `title` — but the reservation is enforced by the
shared registry either way, so pick another name.

## Reading the config in your component

```tsx
export default function NotesPageType({
    pageId,
    title,
    config,
}: PageTypeProps) {
    const density = valueText(config, 'density');
    // ...
}
```

Your component receives:

| Prop     | What it is                                                                                          |
| -------- | --------------------------------------------------------------------------------------------------- |
| `pageId` | The `page` row id. Use it to scope anything you store.                                              |
| `title`  | The page title. The template already renders it as the heading, so normally do not render it again. |
| `config` | Values for your `fields`, keyed by field `name`.                                                    |

Because `config` is typed `Record<string, string | number | boolean>`, narrow
before use — or use `valueText`, `valueNumber`, `valueDate` from
[src/components/Widgets/values.ts](../src/components/Widgets/values.ts). A
missing or corrupt stored value falls back to the field's default rather than
reaching your component as `undefined`.

Derive from `config` on every render rather than copying it into state on mount.

## The template around your page type

[src/components/Pages/PageView.tsx](../src/components/Pages/PageView.tsx) wraps
every page. It resolves the page from the URL, renders the heading, and then
renders one of four things:

| State                            | What the user sees                                  |
| -------------------------------- | --------------------------------------------------- |
| no page matches the path         | a not-found notice                                  |
| `page.type` is `null`            | a hint with a **Set page type** button              |
| `page.type` is set but not found | a "page type not installed" notice; the row is kept |
| `page.type` resolves             | your component                                      |

Your component renders the **body only**.

### The heading is a breadcrumb trail

[PageBreadcrumbs.tsx](../src/components/Pages/PageBreadcrumbs.tsx) renders the
page's ancestors as links followed by the page's own title as the `h2`, so a
page four levels deep is headed `Notes / Work / Q1 / **Review**`. A root page
has no ancestors and so renders as a plain title.

The trail comes from `pageTrail(pages, id)` in
[src/lib/pages.ts](../src/lib/pages.ts), which walks `parentId` to the root;
`pagePath` is built from the same walk, so a link and a heading can never
disagree. Nothing here is configurable from a page type.

## URLs

Pages are reachable at their full hierarchy: a page `review` under `q1` under
`work` under `notes` lives at `/notes/work/q1/review`. The route is the splat
[src/routes/$.tsx](../src/routes/$.tsx).

Slugs are unique per user, so the **last segment identifies the page** and the
ancestor segments are validated rather than used for lookup. Any non-canonical
path that still ends in a known slug redirects to the full one, so links survive
a page being renamed or reparented.

You do not need to think about this in a page type — but it means `pageId`, not
the URL, is the thing to key stored data on.

## Storing data

There is **no generic per-page record store**. The `widget_record` table is
foreign-keyed to `dashboard_widget`, so it cannot hold rows for a page.

A page type that needs to persist more than its `config` needs a schema change
first. Keep settings in `fields` until then.

Five page types have already needed one, and all five scope their rows the
same way:

- `dashboard_widget.pageId` is **nullable** — a `null` row belongs to the main
  dashboard, a row with a page id to that page's own grid.
- `note.pageId` is **required**, because a note only ever lives on a page.
- `article.pageId` is **required and unique**, because a page has at most one
  article. The handler `upsert`s on it, so the row appears on the first save
  rather than when the type is set.
- `table_column.pageId` and `table_entry.pageId` are **required**, with many
  rows of each per page. The table page type keeps the user's own column
  definitions in one and the entries in the other.
- `document.pageId` is **required** and carried on every node of the tree, the
  nested ones included, so one indexed query loads a whole page's tree; the
  nesting itself is a second, self-referencing `parentId`.

Either way the column carries `onDelete: Cascade`, so a page's rows go with it,
and the handler checks the page belongs to the caller before writing. Scope a
new table the same way rather than inventing a second ownership model.

### Ordering rows the user can rearrange

Both table tables carry a plain `position Int` and **no unique constraint on
it**. That is deliberate. `page` does have `@@unique([parentId, position])`, and
the price is the `stagedPosition` / `stagingOffset` / two-pass `applyOrder()`
machinery in [src/lib/pages.ts](../src/lib/pages.ts) — forty lines whose only
job is to dodge the constraint, because swapping two rows transiently collides.

Without the constraint, a reorder is one pass:

```ts
await prisma.$transaction(
    data.ids.map((id, index) =>
        prisma.tableEntry.updateMany({
            where: { id, userId, pageId: data.pageId },
            data: { position: index },
        })
    )
);
```

`header_widget` already does it this way. Read with
`orderBy: [{ position: 'asc' }, { createdAt: 'asc' }]` so that rows which somehow
share a position still come back in a stable order.

### Rows whose shape the user decides

The table page type is the one that does not know its own fields at build time:
the user adds the columns. It stores each column as a row declaring a field
`kind`, and `table_entry.data` is the same flat map of scalars a widget record
uses — keyed by **column id**, so renaming a column keeps its values.

The payoff is that the shared field system does the rest. One function turns a
stored column into a `WidgetField`, and `FieldsForm` then generates the
add-entry form, its inputs and its validation with no form code at all:

```ts
export function fieldFromColumn(column: TableColumn): WidgetField {
    return {
        kind: column.kind,
        name: column.id,
        label: () => column.label,
        required: column.required,
    };
}
```

Reach for this shape when the user, not the developer, decides what a row holds.
See [table/columns.ts](../src/components/Pages/PageTypes/table/columns.ts), and
note that the registry's build-time field validation does **not** cover fields
built this way — `sanitizeEntryData` in the same file is what keeps a stale
stored value from reaching the form.

## Reusing the dashboard

A page type is a plain component, so it can mount an existing feature whole. The
dashboard page type is the entire `Dashboard` component with one prop:

```tsx
export default function DashboardPageType({ pageId }: PageTypeProps) {
    return <Dashboard pageId={pageId} />;
}
```

`Dashboard` takes `pageId` (default `null`, the main dashboard) and threads it
through its query key, its server calls and its three modals, so each grid loads
and saves only its own widgets. It also drops its own `Dashboard` title when a
`pageId` is set, because the page template already renders the breadcrumb
heading — the same courtesy any page type owes the template.

## Reusing the grid without reusing the widgets

The notes page type wants the dashboard's **grid** but its own items. It takes
only the two pieces it needs from
[DashboardGrid.tsx](../src/components/Dashboard/DashboardGrid.tsx):

| Export              | What it gives you                                                         |
| ------------------- | ------------------------------------------------------------------------- |
| `DashboardGrid`     | The grid itself — drag, resize, 12 columns, client-only mount             |
| `changedPlacements` | The placements that actually moved, so an idle layout event saves nothing |
| `dragHandleClass`   | Put it on your card's header, and only that header starts a drag          |

Your card supplies the frame. A control inside the drag handle — notes put the
title input there — needs
`onPointerDown={(event) => event.stopPropagation()}`, or the pointer starts a
drag instead of reaching the control.

The grid only renders after mount, so anything inside it, an editor included,
never runs on the server. Keep the grid stylesheets on the route (they are
already in [$.tsx](../src/routes/$.tsx)).

## One document instead of a grid

The article page type is the other shape a page can take: no grid, one long
document in one row, autosaved on a debounce. Three parts of it are worth
copying.

**Keep one storage format.** The row holds the editor's HTML. The Markdown mode
is a view over that same HTML — `article/markdown.ts` converts with `marked` on
the way in and `turndown` on the way out — so nothing downstream has to know
which mode the text was typed in.

**Parse it without a DOM.** `article/outline.ts` pulls the headings and the word
count out of the HTML with plain string work, no `DOMParser`, so the same
function runs on the server and in the browser and the two agree.

**Re-mount, don't re-sync.** Tiptap takes its content once, at creation. To push
externally changed text into it — here, Markdown typed in the other tab — bump a
counter and pass it as `key` rather than reaching for `setContent`.

## A tree of rows

The documents page type stores one row per node, folders and files alike, told
apart by a `kind` column, and nests them with a self-referencing `parentId` that
is null at the page's root. Both foreign keys cascade, so deleting a folder — or
the page — takes its whole subtree with it and no orphan rows are possible.

It has **no `position` column**. The tree sorts folders before files and then by
name, the way a file manager does, so there is no order to persist and dragging a
node only ever changes its `parentId`. Reach for a `position` only when the user
genuinely needs to arrange rows by hand.

A self-referencing table needs two checks a flat one does not, both in
[src/lib/page-documents.ts](../src/lib/page-documents.ts):

- a node may not move into its own subtree — `isDescendant` walks the parent map
  rather than issuing recursive queries, and the same function runs in the
  browser so the drag's drop indicator agrees with the server;
- names are unique **per folder**, not per page, so the check is scoped to
  `parentId`.

The uniqueness check runs on the client too, against the tree already in the
query cache, and that is what produces the "already exists" message. The server
re-checks and throws, but a thrown handler message is not worth plumbing to the
UI — do the check twice instead.

## Files a user uploads

Notes and articles keep images as inline data URLs, which is self-contained but
only works because those images are small and already in the HTML. Real uploads
are different, and the documents page type is the pattern for them.

**Bytes go in a `Bytes` column, never base64.** `document.content` is a BLOB and
`document.size` is the byte count. The tree query uses an explicit `select` that
leaves `content` out, so listing a page never reads a single file body.

**Uploads and downloads are a route, not a server function.** Server functions
serialize their payload, so a 25 MB file would travel as a ~34 MB JSON string.
[src/routes/api/documents/$.ts](../src/routes/api/documents/$.ts) is a splat
route whose `server.handlers` hand the request to
[src/lib/document-files.ts](../src/lib/document-files.ts):

| Request                            | What it does                                          |
| ---------------------------------- | ----------------------------------------------------- |
| `POST /api/documents/upload`       | `multipart/form-data`, read with `request.formData()` |
| `GET /api/documents/<id>`          | serves the file inline, for a preview                 |
| `GET /api/documents/<id>/download` | serves it as an attachment                            |

That split is why `document-files.ts` is its own module. A route's `server`
block is stripped from the client bundle, so the route may import Prisma; a
plain exported function in a module that client code also imports may **not**,
because only server function handler bodies are removed. Keep request handlers
out of the feature's lib module.

**Serving user files inline is an XSS vector.** A file served from the app's own
origin with its own content type can run script in that origin and reach the
session cookie, so `documentPreviewKind` is an allowlist — raster images, PDF,
plain text, audio, video — and it decides both what the preview renders and what
the route is willing to serve inline. Everything else, uploaded HTML and SVG
included, is served as `application/octet-stream` with
`Content-Disposition: attachment`, and every response carries
`X-Content-Type-Options: nosniff`. The uploaded `mimeType` is normalised to a
bare `type/subtype` before it is stored, so a crafted header cannot smuggle
parameters back out through the `Content-Type`.

### A server route cannot be an `<img src>`

This one costs an afternoon if you meet it cold. Point an `<img>` at a server
route and you get a **404 with an HTML body** — a broken-image icon — while the
exact same URL returns the file perfectly from `curl`, `fetch` or the address
bar.

The cause is Nitro's asset-first dispatch, in dev
(`nitro/dist/_build/vite.dev.mjs`) and in the built server alike:

```js
const isAsset =
    typeof fetchDest === 'string' && fetchDest !== 'empty'
        ? !/^(?:document|iframe|frame)$/.test(fetchDest)
        : isAssetByExt;
if (isAsset) req._nitroHandled = true; // → static serving, never your handler
```

TanStack Start registers one catch-all `/**` with Nitro rather than a route per
file, so Nitro falls back to guessing from the request's `Sec-Fetch-Dest`
header. Anything that is not `document`, `iframe` or `frame` is assumed to be a
static file:

| Element                       | `Sec-Fetch-Dest` | Reaches a server route |
| ----------------------------- | ---------------- | ---------------------- |
| `<img>`, `<video>`, `<audio>` | `image` etc.     | **no — 404**           |
| `fetch()`                     | `empty`          | yes                    |
| `<iframe>`                    | `iframe`         | yes                    |
| link, download, new tab       | `document`       | yes                    |

So media cannot be pointed straight at the route, and
[useDocumentFile.ts](../src/components/Pages/PageTypes/documents/useDocumentFile.ts)
`fetch`es the bytes — `Sec-Fetch-Dest: empty`, which is allowed — and hands the
element an object URL instead, revoking it on cleanup. The iframe previews and
both download buttons keep the real URL, because their dest is on the allowed
list.

The payoff of knowing which column a dest falls in: do **not** reach for a blob
when a plain URL already works, and never debug this by changing the path. No
URL shape helps, because for `dest: image` the extension check is not even
consulted.

**Clashing names get a suffix, they don't fail.** `uniqueDocumentName` turns a
second `report.pdf` into `report (2).pdf`, inserting before the extension. An
upload the user did not name is not the place for an error.

## Server rendering

Pages are server-rendered for signed-in users, so your component renders on the
server first. The same rules as widgets apply:

- Never call `new Date()` in render for displayed output. Use `useNow` from
  [src/components/Widgets/useNow.ts](../src/components/Widgets/useNow.ts), which
  returns `null` until mounted, and handle that `null`.
- No side-effect CSS imports. A route-level stylesheet goes in the route's
  `head()` links; otherwise use Mantine props or a CSS module. Every page type
  shares one route, so a stylesheet added there loads on all of them —
  [src/routes/$.tsx](../src/routes/$.tsx) already carries the grid styles the
  dashboard page type needs.

## Helpers you can use

| Helper                                  | From                               | What it does                                            |
| --------------------------------------- | ---------------------------------- | ------------------------------------------------------- |
| `createWidgetMessages`                  | `#/components/Widgets/i18n`        | Your page type's own translations                       |
| `useNow(intervalMs?)`                   | `#/components/Widgets/useNow`      | Ticking `Date`, `null` until mounted                    |
| `valueText`, `valueNumber`, `valueDate` | `#/components/Widgets/values`      | Narrow one `config` value                               |
| `fromStoredValues`, `toStoredValues`    | `#/components/Widgets/values`      | Convert between stored and form shapes for a field list |
| `FieldsForm`                            | `#/components/Widgets/FieldsForm`  | A validated form for any field list                     |
| `toInlineImageUrl`                      | `#/components/Widgets/inlineImage` | Downscale a picked image to a data URL you can store    |
| `useDocuments(pageId)`                  | `#/lib/page-documents`             | A page's document tree, with create/rename/move/upload  |

## What happens automatically

- **Discovery** — the registry globs your file at build time.
- **The picker** — your page type appears in **Set page type**, sorted
  alphabetically by localized label, searchable.
- **The sidebar icon** — every page of your type shows your `icon`, with a
  fallback when you declare none.
- **The form** — built from `fields`, with no extra name input.
- **Validation** — derived from your field declarations.
- **Storage** — `page.type` and `page.config`; `date` is stored as
  `YYYY-MM-DD`, `datetime` normalised to UTC ISO, an empty optional field as
  `null`.

## When you get it wrong

The registry validates every discovered module. In development it **throws** so
you see it immediately; in production it logs and skips the page type rather
than taking the app down. Messages are prefixed `[PageTypes]` and name the file:

- no default-exported component, or no `widgetMeta` with a non-empty `type`
- `label` that is not a function
- a `type` already used by another page type file
- a field with no `name`, a duplicate `name`, or an unknown `kind`

A page type that is in the database but no longer in the code is not an error:
that page renders a "not installed" notice and keeps its row and its config, so
restoring the file restores the page.

## Differences from a dashboard widget

|                     | Dashboard widget                     | Page type                       |
| ------------------- | ------------------------------------ | ------------------------------- |
| File glob           | `*Widget.tsx` in `DashboardWidgets/` | `*PageType.tsx` in `PageTypes/` |
| Props               | `id`, `label`, `config`              | `pageId`, `title`, `config`     |
| `defaultSize`       | yes, grid units                      | no, a page fills the main area  |
| Field named `label` | reserved                             | reserved                        |
| Instance name       | the user types one                   | the page's own `title`          |
| Row storage         | `widget_record`                      | its own table, keyed by page    |
| Instances per type  | many                                 | one per page                    |

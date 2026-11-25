# How the project is built

This is the contributor's view of DashB: the stack, where things live, and the
parts of the app that have a deliberate design behind them. For what the app
does, see the [user guide](UserGuide.md); for packaging it, see
[the desktop app](Desktop.md).

## Getting started

```bash
pnpm install
pnpm db:push        # create dev.db from prisma/schema.prisma
pnpm dev            # http://localhost:3000
```

`.env.local` holds the local configuration:

| Variable             | Purpose                                             |
| -------------------- | --------------------------------------------------- |
| `DATABASE_URL`       | SQLite file URL, e.g. `file:./dev.db`               |
| `BETTER_AUTH_URL`    | Base URL of the app, e.g. `http://localhost:3000`   |
| `BETTER_AUTH_SECRET` | Signing secret — `pnpm dlx @better-auth/cli secret` |

Typed, validated access to environment variables lives in [src/env.ts](../src/env.ts)
(`@t3-oss/env-core`): server variables under `server`, client variables under
`client` with a `VITE_` prefix.

## Scripts

```bash
pnpm dev          # dev server on port 3000
pnpm build        # production build (Nitro server output)
pnpm preview      # serve the build locally
pnpm lint         # eslint
pnpm format       # prettier --write + eslint --fix
pnpm check        # prettier --check
pnpm db:generate  # regenerate the Prisma client into src/generated/prisma
pnpm db:push      # push the schema to the dev database
pnpm db:migrate   # create and apply a migration
pnpm db:studio    # Prisma Studio
```

The `db:*` scripts load `.env.local` through `dotenv-cli`.

## Stack

- **TanStack Start** on Vite 8, with Nitro as the server adapter.
- **React 19** with the React Compiler enabled (`babel-plugin-react-compiler`
  in [vite.config.ts](../vite.config.ts)) — do not add manual `useMemo`/
  `useCallback` for render-cost reasons.
- **TanStack Router** with file-based routes, **TanStack Query** (SSR-integrated
  via `setupRouterSsrQueryIntegration` in [src/router.tsx](../src/router.tsx)),
  **TanStack Form**, plus **TanStack Table** and **TanStack Store** available
  for widgets.
- **Mantine 9** for components and theming, `postcss-preset-mantine` for the
  mixins and breakpoints, **Phosphor** for icons. There is no global
  stylesheet: styling goes through Mantine props, its theme, and CSS modules
  next to a component when needed. The primary color is per-user, see
  [Theming](#theming).
- **Prisma 7** with the `better-sqlite3` driver adapter. The client is
  generated into `src/generated/prisma` (gitignored), so run `pnpm db:generate`
  after pulling a schema change.
- **Better Auth** for email/password sessions.
- **Paraglide JS** for i18n.
- **ESLint** (`@tanstack/eslint-config`) and **Prettier**.

## Layout

```
src/
  routes/            file-based routes (__root.tsx holds the app shell)
    api/auth/$.ts    Better Auth request handler
    api/documents/   upload and download of a documents page's files
  components/        one folder per component
    Form/            Mantine inputs bound to TanStack Form
  lib/               auth, session and shared helpers
  integrations/      TanStack Query client + devtools wiring
  db.ts              Prisma client singleton
  env.ts             validated environment variables
  generated/         generated Prisma client (gitignored)
  paraglide/         generated i18n runtime (regenerated on dev/build)
messages/            translation sources: en.json, de.json
prisma/schema.prisma database schema
docs/                the user guide and how to extend the app
```

## Widgets

Both widget systems are extended by **adding one file** — the registry globs it
at build time, and the picker, the settings form, validation and storage all
follow from what the file declares:

- [Creating a dashboard widget](DashboardWidgets.md) — cards on the dashboard
  grid. These may store rows of their own data, which all widgets share through
  the generic `widget_record` table, so a new widget type never needs a schema
  change.
- [Creating a header widget](HeaderWidgets.md) — the small readouts in the
  header.

The field declarations, generated form, validation and i18n helper they share
live in [src/components/Widgets/](../src/components/Widgets/).

## Pages

Every page except the dashboard renders through one template, and what it shows
is decided by the page's **type**. Page types are added the same way as widgets
— one file, globbed at build time, reusing the same field declarations:

- [Creating a page type](PageTypes.md) — the page template, the type registry
  and how to write a type.

A page type that needs rows of its own uses the generic `page_record` table
through `usePageRecords` in [src/lib/page-records.ts](../src/lib/page-records.ts),
the per-page counterpart of `widget_record`, so it needs no schema change
either.

## Routes

Adding a file under [src/routes/](../src/routes/) adds a route;
[src/routeTree.gen.ts](../src/routeTree.gen.ts) is regenerated by the dev server
and the build. Navigate with `Link` from `@tanstack/react-router`, or with
[AnchorLink](../src/components/AnchorLink/AnchorLink.tsx) for a Mantine `Anchor`
that keeps the router's type-checked `to`/`search` props.

## Help

The footer links to `/help`, which renders the user guide in
[docs/UserGuide.md](UserGuide.md), the README and the contributor guides in
[docs/](../docs/) as HTML inside the app. The registry of rendered documents is
[src/lib/help-docs.ts](../src/lib/help-docs.ts) — add a file there to add a help
page. The Markdown is inlined at build time through `import.meta.glob` with
`?raw`, because the packaged desktop app ships no `docs/` folder on disk.

[src/lib/help-markdown.ts](../src/lib/help-markdown.ts) converts it with `marked`:
it gives headings ids for the table of contents, turns links between documents
into `/help/...` routes and rewrites links to source files into GitHub links.
Raw HTML in the Markdown is dropped, so the only thing
[HelpBody](../src/components/Help/HelpBody.tsx) injects with
`dangerouslySetInnerHTML` is markup `marked` generated from repository files.
This is the one place in the app that injects HTML; keep it that way, and add a
sanitizer before pointing `renderHelpDoc` at anything a user can write.

## Auth

Routes are **private by default**: the `beforeLoad` in
[src/routes/\_\_root.tsx](../src/routes/__root.tsx) resolves the session and
redirects to `/login` unless the path is listed in `publicPaths` in
[src/lib/auth-routes.ts](../src/lib/auth-routes.ts). The session itself is read
once per request on the server and shared with the client through the query
cache — read it in components with `useSession()` from
[src/lib/session.ts](../src/lib/session.ts).

Signed-in routes render inside the Mantine `AppShell` (header, navbar, footer);
`/login` and `/register` render standalone inside
[AuthCard](../src/components/AuthCard/AuthCard.tsx).

## Theming

The Mantine primary color is generated from a single hue the user picks with the
`HueSlider` in [UserMenu](../src/components/Header/UserMenu.tsx).
[src/lib/theme.ts](../src/lib/theme.ts) turns that hue into the ten-shade tuple
Mantine needs (`themeForHue`), always under the color name `brand`, so
components keep using `color="brand"` or the default primary color and nothing
references a fixed hue.

All three appearance settings live per user on `user_settings` — `themeHue`,
`surfaceOpacity` and `backgroundImageId` — read and written by the two server
functions in [src/lib/user-settings.ts](../src/lib/user-settings.ts):
`fetchUserSettings` and `updateUserSettings`, which takes a partial patch so one
control never overwrites another's value. The root route resolves them in
`beforeLoad`, so the server already renders the right CSS variables and nothing
flashes on load. Dragging a slider writes the previewed value straight into the
query cache — the whole app re-themes live — and releasing it persists.

### Semi-transparent surfaces

`surfaceOpacity` is a percentage, and anything under 100 is the glass mode;
`surfaceVariables(opacity)` returns the `cssVariablesResolver` that
`MantineProvider` is given. It overrides exactly one Mantine variable,
`--mantine-color-body`, with an `rgba()` value — which is all it takes, because
that one variable is what `body`, the `AppShell` header, navbar and footer, and
every `Paper` and `Card` paint themselves with. Dropdowns, popovers, tooltips
and inputs read `--mantine-color-white` / `--mantine-color-dark-6` instead, so
they stay opaque for free.

The resolver also always publishes `--dashb-body-solid`, the opaque body color
for the current scheme. That is what the surfaces which must **not** go
see-through are pinned to: `Modal` and `Drawer` content (via `theme.components`
in `themeForHue`), a sticky `Table` header and the article editor's sticky
toolbar — a translucent sticky element lets the content scroll visibly through
it. Reach for `solidBodyColor` whenever you add another sticky or overlapping
surface.

At 100% none of this is emitted, no inline style is set and the rendered output
is what it was before the feature existed.

### The background image

`backgroundImageId` points at one of the user's own uploaded image files — the
`document` rows that documents and gallery pages share — picked in
[BackgroundImageModal](../src/components/Header/BackgroundImageModal.tsx), which
lists them grouped by page and loads each thumbnail only once it scrolls into
view. The column is a real foreign key with `onDelete: SetNull`, so deleting the
picture on its own page clears the preference instead of leaving a dangling id.

[AppBackground](../src/components/AppBackground/AppBackground.tsx) paints it: a
`position: fixed` layer at `z-index: -1`, which is why `body` is set to
`transparent` in glass mode — body's own background would otherwise paint over
it. The image cannot be a plain CSS `url()` pointing at the file route, for the
`Sec-Fetch-Dest` reason in [PageTypes.md](PageTypes.md); it goes through
`useDocumentFile`, the same `fetch`-to-object-URL hook the gallery uses.
Picking an image while the slider still sits at 100% also nudges the opacity
down, so the choice is visible straight away.

## Forms

[src/components/Form/Form.ts](../src/components/Form/Form.ts) exports `useAppForm`,
a TanStack Form hook pre-bound to Mantine inputs:

```tsx
const form = useAppForm({
    defaultValues: { email: '' },
    validators: { onSubmit: schema },
    onSubmit: async ({ value }) => { ... },
});

<form.AppForm>
    <form.FormRoot>
        <form.AppField name="email">
            {(field) => <field.TextField label="Email" type="email" />}
        </form.AppField>
        <form.SubmitButton fullWidth>Sign in</form.SubmitButton>
    </form.FormRoot>
</form.AppForm>;
```

A new input type is a new file in that folder, registered in `fieldComponents`.

## i18n

Messages live in [messages/](../messages/) as `{locale}.json`, configured by
[project.inlang/settings.json](../project.inlang/settings.json) (`en` base, `de`
secondary). The Paraglide Vite plugin regenerates `src/paraglide` on dev and
build. Use them through the message object:

```tsx
import { m } from '#/paraglide/messages';

<Button>{m['header.add_widget']()}</Button>;
```

Locale lives in the URL (`/de/...`), switched from
[UserMenu](../src/components/Header/UserMenu.tsx) alongside the color scheme and
the theme color.

## Deployment

`pnpm build` produces a self-contained Node server via Nitro. Deploy the build
output and start it with `node dist/server/index.mjs`. For host-specific
presets (Vercel, Netlify, Cloudflare, AWS Lambda) see
<https://v3.nitro.build/deploy>.

## Reference

- TanStack Start — <https://tanstack.com/start>
- Mantine — <https://mantine.dev>
- Prisma — <https://www.prisma.io/docs>
- Better Auth — <https://www.better-auth.com>
- Paraglide JS — <https://inlang.com/m/gerre34r/library-inlang-paraglideJs>

# The desktop app

DashB packages as a standalone Windows/Linux desktop app. The app is not
rewritten as a client-side SPA — Electron starts the **existing Nitro build** on
`127.0.0.1` and shows it in a window, so every server function, Prisma query and
Better Auth session keeps working unchanged. Nothing under [src/](../src/) is
desktop-specific.

```bash
pnpm desktop:dev          # run the shell against the built server
pnpm desktop:pack         # Windows installer -> release/
pnpm desktop:pack:linux   # AppImage + deb (must run on Linux, see below)
```

`pnpm desktop:dev` uses the last `pnpm build` output. Set `DASHB_DEV_URL=http://localhost:3000`
to point the window at the Vite dev server instead, which is handy for UI work
but writes a local user into whichever database that server is using.

## Layout

```
electron/            the desktop shell: plain Node ESM, no npm dependencies
  main.mjs           lifecycle, window, server supervision
  server.mjs         port choice, utilityProcess fork, readiness probe
  session.mjs        auto sign-in + cookie transplant
  database.mjs       migration runner
  secrets.mjs        per-install secret, derived local password
  paths.mjs          userData and resource paths
migrations/          schema history shipped with the app (see below)
scripts/
  emit-migration.mjs  generates migrations/ from schema.prisma
  native-electron.mjs swaps better-sqlite3 to Electron's ABI
electron-builder.yml  packaging config
```

## How a launch works

1. Read-or-create `<userData>/secret`; the local user's password is derived from
   it with HKDF, so no password is ever stored.
2. Apply any unapplied migration from `migrations/` to `<userData>/dashb.db`.
   This happens in the main process, **before** the server starts, because
   [src/db.ts](../src/db.ts) builds its adapter at import time and the root route
   queries immediately.
3. Fork the Nitro server as a `utilityProcess` on port 37591, with
   `HOST=127.0.0.1` so it never binds the LAN, and `DATABASE_URL`,
   `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` in its environment.
4. Poll `GET /api/auth/ok`, then sign the local user in over the app's own HTTP
   API — signing them up on first run — and copy the returned session cookie
   into Electron's cookie jar.
5. Open the window. The root route's `beforeLoad` already sees a session, so the
   dashboard renders with no login screen and no redirect.

All user state lives in `<userData>/dashb.db` (`%APPDATA%/DashB` on Windows) —
uploads included, since documents are BLOBs and note images are inline data
URLs. Backing up the app is copying that one file. `server.log` and, if startup
ever fails, `startup-error.log` land next to it.

## Why Electron 42 is pinned

`better-sqlite3` is a raw V8 addon, so it is locked to an exact
`NODE_MODULE_VERSION` and must be rebuilt for Electron's ABI — this is true in a
`utilityProcess`, under `ELECTRON_RUN_AS_NODE`, and in the main process alike.
better-sqlite3 12.x publishes ready-made Electron binaries only up to **ABI 146,
which is Electron 42**, so `desktop:native` can simply download one and no C++
toolchain is needed. Moving to a newer Electron means either building from
source (Visual Studio Build Tools + Python) or waiting for better-sqlite3 13.x,
which is N-API based and would retire this constraint — but it is a direct
dependency of `@prisma/adapter-better-sqlite3`, so it needs an override.

`desktop:native` copies better-sqlite3 out of the pnpm store before downloading,
so the plain-Node binary that `pnpm dev` relies on is never overwritten.

## Schema changes

The desktop app ships `migrations/` and applies pending ones at startup; a
`db:push`-only workflow would leave every installed copy stale after a schema
change. It deliberately lives outside `prisma/migrations/` so that Prisma's own
tooling does not treat the `db:push`-created [dev.db](../dev.db) as drifted and
offer to reset it.

After changing [prisma/schema.prisma](../prisma/schema.prisma), add a migration:

```bash
pnpm prisma migrate diff --from-migrations migrations     --to-schema prisma/schema.prisma --script     --shadow-database-url "file:./shadow.db"     -o migrations/1_<name>/migration.sql
```

## Linux builds

AppImage and deb cannot be cross-built from Windows — the packaging tools need a
Linux host. Run `pnpm desktop:pack:linux` from WSL2 or the
`electronuserland/builder` image, using a separate checkout so the Linux
Electron binary does not clash with the Windows one. The native module itself is
not the blocker: `desktop:native --platform=linux` downloads a Linux binary fine
from anywhere.

## Releases

[.github/workflows/release.yml](../.github/workflows/release.yml) builds both
platforms on GitHub's runners and attaches the results to a release:

```bash
# bump the version in electron/package.json first, then
git tag v0.2.0
git push --tags
```

The tag must match that `version` — the workflow checks it and stops early if it
does not, because electron-builder names the release after the app version and
not after the tag. A bare `0.2.0` works as well as `v0.2.0`. Each platform job
repeats what a local pack does (`prisma generate`, `pnpm build`,
`pnpm desktop:native`, electron-builder) and publishes into a **draft** release,
so the notes can be written before anything is visible. The two jobs run one
after the other because they write to the same release.

Starting the workflow by hand from the Actions tab skips publishing and uploads
the installers as build artifacts instead — that is how to get a build without
cutting a release.

The `publish:` block in [electron-builder.yml](../electron-builder.yml) names the
repository and makes electron-builder emit the `latest.yml` manifests an
auto-updater would read. Release assets inherit the repository's visibility, so
while the repo is private every download needs a token.

`artifactName` keeps the version out of the file names — `DashB-Setup-x64.exe`,
not `DashB Setup 0.1.0.exe` — which is what lets the
`releases/latest/download/<file>` links in the [README](../README.md) keep
working across releases. Two consequences: the links 404 until the draft release
is actually published, and a downloaded file no longer says which version it is
(the app does, and `latest.yml` records it).

## The app icon

The icon is one hand-authored file, [build/resources/icon.svg](../build/resources/icon.svg):
the Phosphor `SquaresFour` glyph on a rounded square, using the brand blue the
default theme hue (208) generates. electron-builder rasterizes it at 1024px and
emits a 7-size `.ico` (16 through 256) for Windows plus the Linux icon set, so
there is no binary artwork in the repo and no conversion step to run.

To change it, edit that one file — swap the `d` attribute for another Phosphor
path, or the gradient stops for a different hue — then rebuild. The same file is
copied to [public/icon.svg](../public/icon.svg) and linked as the favicon from
[src/routes/\_\_root.tsx](../src/routes/__root.tsx), so keep the two in sync if
you edit it. A `.png` (256px minimum) or `.ico` dropped in as
`build/resources/icon.png` would take precedence over the SVG.

In `pnpm desktop:dev` the window still shows the stock Electron icon, because the
packaged app gets its icon from the executable rather than from `BrowserWindow`.

## Code signing

The installers are unsigned, by choice. The options were weighed and rejected:
Azure Trusted Signing is the cheap one at $9.99/month, but individual developers
are limited to the USA and Canada, and a CA certificate costs a few hundred a
year and — since the CA/Browser Forum's 2023 rules — has to live on a hardware
token, which does not suit unattended CI builds. For a personal app with a small
install base, the _More info → Run anyway_ click is the better trade.

What that costs: SmartScreen warns on first run, the elevation prompt reads
_Publisher: Unknown_, and some browsers flag the download. `description` and
`author` in [electron/package.json](../electron/package.json) at least populate
the installer's Properties → Details (`description` becomes its FileDescription,
`author` the CompanyName on both binaries), so the downloaded file is not
completely anonymous. The app executable keeps `productName` as its
FileDescription.

If this ever changes, electron-builder 26 wires it up through
`win.azureSignOptions` (`publisherName`, `endpoint`, `codeSigningAccountName`,
`certificateProfileName`), with Entra credentials supplied as environment
variables.

## Not done yet

- No auto-update.

# Hosting it on a server

DashB runs as an ordinary web app: the same Nitro build the desktop app wraps,
started directly, behind a reverse proxy that terminates TLS. This is how the
public demo site is deployed.

The public demo runs at `https://demo.mblatter.de`, next to the private
dashboard on the same VPS. That stack's Caddy owns `:80`/`:443` and already has
the site block and network for the demo committed, so this repo only has to
start one container.

## Deploying the demo

First time, on the VPS:

```bash
docker network create dashb-proxy          # skip if it already exists
git clone <this repo> ~/dashb-demo && cd ~/dashb-demo
cp .env.example .env                       # then edit it, see below
docker compose up -d --build
```

`.env` for the demo:

```
DATABASE_URL="file:/app/data/dashb.db"
BETTER_AUTH_SECRET="<openssl rand -base64 32>"
BETTER_AUTH_URL="https://demo.mblatter.de"
BETTER_AUTH_TRUSTED_ORIGINS="https://demo.mblatter.de"
PORT=3000
DEMO_RESET_AT="03:00"
TZ="Europe/Zurich"
```

Every update after that:

```bash
cd ~/dashb-demo && git pull && docker compose up -d --build
```

Check it: `docker compose logs -f app` shows the migration line, then open
`https://demo.mblatter.de`.

```
Dockerfile              two-stage build: pnpm build, then a runtime image
docker-compose.yml      the app container, its volume and the proxy network
docker-entrypoint.sh    migrate, then exec the server
.dockerignore           keeps the build context small
scripts/
  apply-migrations.mjs  the container's migration step
.env.example            template for .env
```

## What actually has to run

Three things, and nothing else:

- **A long-running Node process.** `pnpm build` produces `.output/server/index.mjs`,
  a self-contained Nitro server. There is no static export to fall back on — every
  page is server-rendered and every read goes through a server function.
- **One native binary.** Prisma 7 talks to SQLite through a driver adapter and
  compiles queries in WASM, so there is no query-engine binary to match. The only
  native artifact is `better_sqlite3.node`, and `pnpm build` already traces it into
  `.output/server/node_modules/better-sqlite3/`.
- **A writable directory that survives restarts.** That is the whole of the app's
  state: uploads — gallery images, documents, article images — are stored as BLOBs
  in the database, so the one SQLite file is the entire backup.

This rules out classic PHP webspace, which can host neither a persistent process
nor a native addon, and cannot even proxy to one: `ProxyPass` is a server-config
directive and is rejected in `.htaccess`. Such a webspace is only useful here for
its DNS — point an `A`/`AAAA` record at the machine that runs the container.

**Do not run `pnpm desktop:native` before building the image.** It overwrites
`better_sqlite3.node` with a binary compiled for Electron's ABI, which the plain
`node` in the container cannot load. The Dockerfile only runs `pnpm build`, and
the image is built from a clean context, so this only bites if you build by hand
on a machine where you have packaged the desktop app.

The build also needs **pnpm 11**, which is why `package.json` now pins
`packageManager`. `pnpm-workspace.yaml` uses `allowBuilds` to let
better-sqlite3 run its install script; pnpm 10 spells that key
`onlyBuiltDependencies` and silently ignores this one, which yields an image
whose server dies on its first query with a missing `better_sqlite3.node`.
Corepack reads the pin, so the image gets the right pnpm without a version
literal in the Dockerfile.

## Migrations

The container applies pending migrations at start, not at build time: the build
never sees the production database.

`migrations/` deliberately lives outside `prisma/migrations/` so Prisma's own
tooling leaves it alone (see [Desktop.md](Desktop.md)), which means
`prisma migrate deploy` cannot be used here — it would look in the wrong place.
Instead [scripts/apply-migrations.mjs](../scripts/apply-migrations.mjs) calls the
same runner the desktop app uses, [electron/database.mjs](../electron/database.mjs),
against the database named by `DATABASE_URL`. Server and desktop therefore apply
identical SQL and record identical checksums in `_prisma_migrations`.

The upside is a runtime image with no `node_modules` and no Prisma CLI in it —
`.output` is self-contained. The constraint is that migration directories are
applied in lexicographic order, so keep numbering them `0_`, `1_`, `2_`: a
tenth migration named `10_…` would sort before `2_…`.

## First-time setup

1. **Install Docker** (Debian/Ubuntu):

    ```bash
    curl -fsSL https://get.docker.com | sh
    sudo usermod -aG docker "$USER"   # log out and back in for this to apply
    ```

2. **Create the proxy network**, once per machine:

    ```bash
    docker network create dashb-proxy
    ```

    The app container publishes no ports. It is reachable only on this network,
    under the name `dashb-demo`, by whichever Caddy owns `:80`/`:443`. If you are
    adding this next to an existing stack that already runs Caddy, attach that
    Caddy to the same network — see [Sharing a server](#sharing-a-server).

3. **Clone the repo** onto the server.

4. **Create `.env`** from `.env.example`:

    ```bash
    cp .env.example .env
    ```

    Fill it in:

    - `DATABASE_URL="file:/app/data/dashb.db"` — an absolute path inside the
      mounted volume. A relative path lands in the container's filesystem and is
      gone on the next `docker compose up`.
    - `BETTER_AUTH_SECRET` — `pnpm dlx @better-auth/cli secret`, or
      `openssl rand -base64 32`. Changing it later invalidates every session.
    - `BETTER_AUTH_URL` — the public URL, e.g. `https://demo.example.com`. Better
      Auth derives its callback URLs from this and sets the session cookie
      `Secure` when it begins with `https`, so it must match the browser's address
      bar exactly, including scheme and any port. Get it wrong and the symptom is
      a login that appears to succeed and lands back on the login page.
    - `BETTER_AUTH_TRUSTED_ORIGINS` — the same value.
    - `DEMO_RESET_AT` — leave it empty unless this is a throwaway demo; see
      [the nightly reset](#the-nightly-reset).

5. **Build and start**:

    ```bash
    docker compose up -d --build
    ```

    This build is heavy — Vite, Mantine, TipTap and the React compiler. On a
    single-vCPU, low-RAM VPS it can take a long time or get OOM-killed. If that
    happens, build elsewhere and ship the image:

    ```bash
    # on your dev machine
    docker build -t dashb:latest .
    docker save dashb:latest | gzip > dashb.tar.gz
    scp dashb.tar.gz user@server:~/

    # on the server
    docker load < dashb.tar.gz
    docker compose up -d        # no --build, the image already exists
    ```

    A container registry works too: push from the dev machine, `docker compose pull`
    on the server.

6. **Verify**: open the public URL. You should land on the login page; register an
   account and you are on an empty dashboard. `docker compose logs -f app` shows
   the migration line from the entrypoint at every start.

## Sharing a server

Only one process can hold `:80`/`:443`. If another stack on the same machine
already runs Caddy, do not start a second one — let the existing Caddy proxy to
this app over the shared network. For `demo.mblatter.de` this is already done
in the `dashB_private` repo; for another host, make the same two changes in
whichever stack owns the Caddy.

Put its Caddy on both networks:

```yaml
services:
    caddy:
        networks:
            - default
            - dashb-proxy

networks:
    dashb-proxy:
        name: dashb-proxy
        external: true
```

Naming any network on a service drops the implicit default, so `default` has to
be listed explicitly or that Caddy stops reaching its own app.

Then add a site block to its `Caddyfile` and run `docker compose up -d` there:

```
demo.example.com {
	request_body {
		max_size 10MB
	}
	reverse_proxy dashb-demo:3000
}
```

## Running it as a public demo

Registration is open: anyone who can reach the site can create an account. For a
demo that is the point — each visitor gets their own dashboard, since every table
is scoped by `userId`. Two consequences worth deciding about before you publish
the URL:

- **Uploads are unbounded.** Nothing in the app caps the size of a document or
  gallery image, and they all land in the one SQLite file. Cap it at the proxy:

    ```
    demo.example.com {
    	request_body {
    		max_size 10MB
    	}
    	reverse_proxy dashb-demo:3000
    }
    ```

- **The file only grows**, unless you let it clear itself out — see the nightly
  reset below. SQLite does not hand space back on its own when rows are deleted.

## The nightly reset

`DEMO_RESET_AT="03:00"` in `.env` wipes every account each night at that time
and `VACUUM`s the file afterwards, so the demo starts each day empty and the
database stops growing without bound.

**It is off unless set, and it is not reversible.** Leave `DEMO_RESET_AT` unset
on any instance holding data you care about; on a demo, set it. There is no
confirmation and no backup step — it deletes every row in every table.

The time is `HH:MM` on a 24-hour clock in the container's timezone, which is UTC
unless you set `TZ` in `.env` as well. Anything unparseable is treated as "off",
so a typo silently disables the reset rather than firing at some other hour —
the server logs `demo-reset: next reset at …` when it arms, which is how you
confirm it took.

The whole of it is [src/lib/demo-reset.ts](../src/lib/demo-reset.ts), armed from
[src/server.ts](../src/server.ts). It deletes accounts rather than the database
file, because the running server holds the file open: unlinking it on Linux
leaves the server writing happily to an inode nobody can reach any more, and the
site looks fine until the next restart reveals an empty database. Deleting
`user` rows cascades through every other table, which is also what makes the
reset safe to run while people are using the site — no restart, no downtime.
Anyone signed in at that moment has their session row deleted along with
everything else, so their next click lands them back on the login page.

One wrinkle worth knowing: TanStack Start's server entry is evaluated on the
**first request** after a restart, not at process start, so the timer arms when
the first visitor arrives. On a site that is idle for a whole day the nightly
reset would therefore be skipped. To cover that, arming also checks for an
account created before the most recent scheduled time and resets immediately if
it finds one — so a missed window (an idle day, or a restart that straddles
03:00) is cleaned up by the next visit instead of waiting another day.

To reset by hand instead, stop the app and delete the file:

```bash
docker compose stop app
docker compose run --rm --entrypoint sh app -c 'rm -f /app/data/dashb.db*'
docker compose up -d app
```

The `*` matters: it removes the `-wal` and `-shm` files alongside the database.

## Backing up

```bash
docker compose exec app sh -c 'cat /app/data/dashb.db' > backup-$(date +%Y%m%d).db
```

With WAL enabled a live copy can miss the most recent committed writes. For a
guaranteed-consistent snapshot, `docker compose stop app` first; for a personal
dashboard that is rarely worth the downtime.

## Deploying updates

```bash
git pull
docker compose up -d --build
```

Migrations run on container start against whatever is already in the volume.

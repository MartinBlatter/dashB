# DashB

A personal dashboard you run yourself. The things you check every day go on a
widget grid — tasks, shopping, habits, spending, the weather — and everything
else lives on pages you create: notes, articles, tables, boards, galleries,
files. It all stays in one database file on your own machine.

There is no account to sign up for, no cloud and no sync. DashB ships as a
desktop app for Windows and Linux that carries its own server and database, so
installing it is the whole setup. It also runs as an ordinary web app if you
would rather host it.

## What you get

**A dashboard of widgets.** Drag them around the grid, resize them from the
corner, and the layout saves itself.

| Widget        | What it shows                                                |
| ------------- | ------------------------------------------------------------ |
| To-do list    | Tasks with deadlines, grouped by when they are due           |
| Shopping list | Things to buy, grouped by aisle                              |
| Habits        | A daily check-off with streaks                               |
| Expenses      | What you spent, this month against the ones before           |
| Schedule      | A month calendar, including calendar feeds you subscribe to  |
| Weather       | Current conditions and a short forecast for a place you name |
| Bookmarks     | Quick links to the places you keep going back to             |
| Table         | A small table of your own columns, one row per entry         |

Smaller one-line readouts — date and time, a world clock, the temperature, your
next event, a countdown or countup — sit in the header and stay visible
wherever you are.

**Pages for everything else.** Each page has a type that decides what it does,
and pages nest as deeply as you like.

| Page type | What it is for                                                  |
| --------- | --------------------------------------------------------------- |
| Dashboard | A second widget grid, separate from the main one                |
| Notes     | A board of notes you drag, resize and write in                  |
| Article   | One long document with headings, rich text and images           |
| Table     | A table whose columns you define yourself                       |
| Board     | Lanes of cards you drag along as work moves through stages      |
| Gallery   | Pictures as thumbnails, with albums and a large view            |
| Documents | Folders and uploaded files in a tree, with preview and download |
| Embed     | Another site or tool shown inside the page                      |
| Section   | An index of the pages below this one, as cards                  |

**Made to look the way you want.** Pick a hue and the entire app recolors live;
there is a dark mode, a surface-opacity slider that turns the panels to glass,
and any picture you have uploaded can become the background behind them. Dates
follow a format you choose, and the interface is available in English and
German.

**Your data is yours.** Everything, uploads included, lives in a single SQLite
file. Backing up the app is copying that one file.

## Download

| Platform              | Download                                                                                                       |
| --------------------- | -------------------------------------------------------------------------------------------------------------- |
| Windows (x64)         | [DashB-Setup-x64.exe](https://github.com/MartinBlatter/dashB/releases/latest/download/DashB-Setup-x64.exe)     |
| Linux (x64, AppImage) | [dashb-x86_64.AppImage](https://github.com/MartinBlatter/dashB/releases/latest/download/dashb-x86_64.AppImage) |
| Debian, Ubuntu (x64)  | [dashb-amd64.deb](https://github.com/MartinBlatter/dashB/releases/latest/download/dashb-amd64.deb)             |

Those links always point at the newest
[release](https://github.com/MartinBlatter/dashB/releases). The app signs you in
on first launch and opens straight on the dashboard — there is nothing to
configure.

**Windows warns on first run.** The installer is not code-signed, so SmartScreen
shows _"Windows protected your PC"_ and the elevation prompt reads _Publisher:
Unknown_. Click _More info_, then _Run anyway_. To check you downloaded the real
file, compare its hash with the `sha512` in `latest.yml` on the release page:

```powershell
[Convert]::ToBase64String([Security.Cryptography.SHA512]::Create().ComputeHash([IO.File]::ReadAllBytes((Resolve-Path .\DashB-Setup-x64.exe))))
```

New to the app? The [user guide](docs/UserGuide.md) walks through all of it, and
it is in the app itself behind the help link in the footer.

## Running it yourself

DashB is a TanStack Start app with a Nitro server, Mantine for the interface,
Prisma on SQLite for storage and Better Auth for sign-in.

```bash
pnpm install
pnpm db:push        # create dev.db from prisma/schema.prisma
pnpm dev            # http://localhost:3000
```

`.env.local` holds the configuration:

| Variable             | Purpose                                             |
| -------------------- | --------------------------------------------------- |
| `DATABASE_URL`       | SQLite file URL, e.g. `file:./dev.db`               |
| `BETTER_AUTH_URL`    | Base URL of the app, e.g. `http://localhost:3000`   |
| `BETTER_AUTH_SECRET` | Signing secret — `pnpm dlx @better-auth/cli secret` |

`pnpm build` produces a self-contained Node server; start it with
`node dist/server/index.mjs`. The desktop app runs that same build behind an
Electron window, so nothing in the application code is desktop-specific.

## Making it your own

Both widget systems and the page types are extended by **adding one file**. A
registry picks it up at build time, and the picker, the settings form, its
validation and its storage all follow from what that file declares — a new
widget or page type never needs a database change.

- [Creating a dashboard widget](docs/DashboardWidgets.md)
- [Creating a header widget](docs/HeaderWidgets.md)
- [Creating a page type](docs/PageTypes.md)
- [How the project is built](docs/Architecture.md) — layout, scripts, theming,
  auth, forms and i18n
- [The desktop app](docs/Desktop.md) — how a launch works, packaging and releases

## AI disclosure

Much of this project — application code, the guides in [docs/](docs/) and this
README — was written with [Claude Code](https://claude.com/claude-code). There is
no automated test suite, so nothing here is verified beyond manual use and
review.

Treat it accordingly: it is a personal project, and the [licence](#licence)
disclaims all warranty. If you plan to run it on data you care about, read the
code first — particularly the sign-in and database paths.

## Licence

[PolyForm Noncommercial 1.0.0](LICENSE). Use it, change it and pass it on freely
for any noncommercial purpose — hobby and personal use, study, research, and use
by charities, schools, public research bodies and government institutions are all
covered explicitly. Running it as part of a business, or any other use for
commercial advantage, needs separate permission from the licensor.

Attribution travels with it: anyone passing on part of the software has to
include the licence (or its URL) and the `Required Notice:` line at the top of
[LICENSE](LICENSE), which carries the copyright and this repository's URL.
Breaching a term gives you 32 days from written notice to come into compliance
before the licences end.

Because it restricts commercial use, this is a source-available licence rather
than an open-source one in the OSI sense. None of the above is legal advice.

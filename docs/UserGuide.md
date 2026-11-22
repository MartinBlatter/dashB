# Using DashB

DashB is a personal dashboard you run yourself. The dashboard holds widgets
for the small recurring things — tasks, shopping, habits, spending, the
weather — and pages hold everything else, from notes and tables to files and
boards. Everything you enter stays in your own installation.

## Your account

Register with your name, email and a password, then sign in. Every widget,
page and uploaded file belongs to your account, and the whole app sits behind
the sign-in — nothing is public. Sign out from the account menu in the
top-right corner.

## Finding your way

- **Header** — the ☰ button collapses the sidebar. Header widgets sit in the
  middle, the button for adding one and your account menu on the right.
- **Sidebar** — a link to the dashboard, then your own pages. Drag its right
  edge to make it wider.
- **Footer** — the link to this help.

## The dashboard

The dashboard is a grid of widgets, and it is the page you land on.

- **Add one** with _Add a widget_ on the right: pick a type, fill in its
  settings, confirm with _Add widget_.
- **Move** a widget by dragging its handle, and **resize** it from the corner
  at the bottom right. The layout saves itself.
- **Change or remove** a widget through its own menu: _Edit widget_ reopens
  the settings, _Delete widget_ removes it along with everything it stored.

| Widget            | What it shows                                                               |
| ----------------- | --------------------------------------------------------------------------- |
| **To-do list**    | Tasks with a deadline, grouped by when they are due, overdue ones first.    |
| **Shopping list** | Things to buy, grouped by aisle, to check off while you shop.               |
| **Habits**        | A daily check-off with streaks.                                             |
| **Expenses**      | What you spent, this month against the months before.                       |
| **Schedule**      | A month calendar of your events, plus calendars you import or subscribe to. |
| **Weather**       | Current conditions and a short forecast for a place you name.               |
| **Bookmarks**     | Quick links to the places you keep going back to.                           |

## Header widgets

Header widgets are one-line readouts that stay visible on every page. Add one
with _Add widget_ in the header. Each has a drag handle to reorder it and a
pencil to edit its settings.

| Widget          | What it shows                          |
| --------------- | -------------------------------------- |
| **Date & time** | The current date and time.             |
| **World clock** | The time in another timezone.          |
| **Weather now** | The current temperature for one place. |
| **Next event**  | The next entry from a calendar feed.   |
| **Countdown**   | The time left until a date.            |
| **Countup**     | The time since a date.                 |

## Pages

Pages are yours to create, and each one has a **type** that decides what it
does.

1. Press _Add page_ in the sidebar and give it a **title**, a **slug** (the
   part that appears in the address), a **position** among its neighbours and,
   if it belongs under another page, a **parent page**.
2. Open the new page and press _Set page type_, then pick a type.
3. To rename a page, move it or change its settings later, use the gear icon
   on the page, or _Edit pages_ in the sidebar. Deleting a page deletes its
   subpages with it.

Pages can be nested as deeply as you like; the breadcrumb at the top of each
page shows where you are.

| Page type     | What it is for                                                        |
| ------------- | --------------------------------------------------------------------- |
| **Dashboard** | A second widget grid, separate from the main dashboard.               |
| **Notes**     | A board of notes you drag, resize and write in, with text and images. |
| **Article**   | One long document with headings, text and images, like a wiki page.   |
| **Table**     | A table whose columns you define yourself, one row per entry.         |
| **Board**     | Lanes of cards you drag along as work moves through stages.           |
| **Gallery**   | Pictures as thumbnails, with albums and a large view.                 |
| **Documents** | Folders and uploaded files in a tree, with a preview and a download.  |
| **Embed**     | Another site or tool shown inside the page.                           |
| **Section**   | An index of the pages below this one, as cards.                       |

A few types are worth a note:

- **Table** — add columns of text, long text, number, date, date and time,
  choice or checkbox, mark them required, reorder them, and search your
  entries.
- **Article** — write in rich text or switch to Markdown; the headings can
  become a table of contents beside the text.
- **Gallery** and **Documents** — the pictures you upload here are also the
  ones you can pick as a background image.
- **Embed** — paste a URL and set how tall the frame should be. Some sites
  refuse to be embedded; that is their choice, not a fault in DashB.

## Making it yours

Everything in this list is in the account menu, top right, and is remembered
for your account:

- **Dark mode** — switch between the light and dark theme.
- **Theme color** — drag the slider to recolor the app, and reset it when you
  have had enough.
- **Surface opacity** — makes the header, sidebar and panels translucent.
- **Background image** — choose one of the pictures you uploaded on a
  documents or gallery page. Combined with a lower surface opacity, it shows
  through the whole app.
- **Language** — English or German. Your own text is never translated.

## Your data

Everything lives in the database of your own installation, including uploaded
files. There is no cloud account and no sync.

Deleting is immediate and permanent: a widget takes the entries it stored with
it, a page takes its subpages and their contents. Nothing is moved to a
recycle bin, so make a copy of the database if you want a way back.

## Going further

DashB is meant to be extended with widgets and page types of your own. The
other guides in this help are written for that:

- [Overview](../README.md) — how the project is put together.
- [Creating a dashboard widget](DashboardWidgets.md)
- [Creating a header widget](HeaderWidgets.md)
- [Creating a page type](PageTypes.md)

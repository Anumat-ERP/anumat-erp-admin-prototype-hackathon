# Anumat Console · hackathon prototype

A clickable prototype of **Anumat Console**, the staff-only back office for
running Anumat pilots: customer workspaces, the sales pipeline, feedback and
problem reports, email and Telegram delivery, and a full audit log of what
staff did.

**Live:** https://anumat-erp.github.io/anumat-erp-admin-prototype-hackathon/
(needs GitHub Pages turned on for this repository: Settings → Pages → Source:
GitHub Actions). The customer app it supports is
[anumat-erp-prototype-hackathon](https://github.com/Anumat-ERP/anumat-erp-prototype-hackathon).

It uses the hackathon brand (**Anumat Blue `#003D96`**) and the calm back-office
design from
[anumat-erp-web/packages/brand](https://github.com/Anumat-ERP/anumat-erp-web/tree/main/packages/brand):
neutral surfaces, status as a dot plus a word, exact times on hover, ⌘K / Ctrl+K
search, light and dark themes.

Everything runs in the browser with demo data. Changes are saved in your
browser only. Use the account menu → **Reset demo data** to start over.

## What you can try

| Screen | Try this |
|---|---|
| Overview (`/`) | Live workspaces, weekly requests, sales pipeline, system status, and **Needs attention**: quiet workspaces, pilots about to end, failed messages, open problems |
| Workspaces | Search, filter by status and plan, sort, or show only the ones that need attention |
| Workspace detail | Open **Battambang Rice Mill** (pilot ends in 3 days): **Extend pilot**, change plan, suspend (a reason is required) and reactivate, turn features on or off, add an internal note, **View as owner** |
| Leads | A board from New to Won/Lost. Open **Mekong Solar**: assign an owner and move the stage. Open **Golden Lotus Garments** → **Start a pilot** creates the workspace. **Mark as lost** asks why |
| Feedback | Problem reports (assign, **Take it**, resolve, reopen), survey answers and suggestions |
| System | Service health (Email is degraded) and every email and Telegram message; **Retry** a failed one. Addresses are masked |
| Audit log | Every console action, who did it and when. Filter by staff member |
| Staff | Who has console access, and what each role can do |

Switch who is signed in from the account menu (Owner, Support, Sales,
Engineer) to see actions logged under their name.

## Principles

- **Staff only.** Separate from the customer app, `noindex`, and every action is
  written to the audit log.
- **Least exposure.** Customer email and Telegram handles are masked. **View as
  owner** is logged.
- **Reasons for destructive actions.** Suspending a workspace or losing a lead
  needs a reason.
- **Attention first.** The overview tells you what to do today, not just totals.
- **Motion that explains.** Pages settle in; a note you add or a status, stage or
  date you change is briefly highlighted; charts grow once. All off with reduced
  motion. See `src/styles/motion.css`.

## Run it

```sh
bun install
bun run dev            # http://localhost:5173
bun run build          # type-check and build to dist/
bun run build:artifact # single-file HTML in dist-artifact/
```

`vendor/ui` is a copy of `@repo/ui` from anumat-erp-web; `bun run sync-ui`
refreshes it.

## Code map

| Path | What |
|---|---|
| `src/data/types.ts` | Workspaces, leads, feedback, deliveries, services, audit entries, staff |
| `src/data/seed.ts` | Demo data: 11 workspaces, 7 leads, 4 staff |
| `src/data/store.tsx` | Reducer; every action appends an audit entry. `attentionReasons()` decides what needs attention |
| `src/layout/Shell.tsx` | Sidebar with badges, top bar, ⌘K, staff switcher |
| `src/pages/` | One file per screen |

In the real product this becomes an `/admin` area of anumat-erp-web, behind
Clerk with a staff-only organization; see
[anumat-erp-docs](https://github.com/Anumat-ERP/anumat-erp-docs).

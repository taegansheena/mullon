# Reading log

An installable web app for keeping a list of the books I've read, with when I read them, the author, and an open page per book for notes and quotes.

Built with React, TanStack Router and TanStack Query, Tailwind CSS and shadcn/ui (on Base UI). Books are stored in Supabase per account, cached on the device so the app opens and takes edits offline, and synced when back online.

## Develop

```sh
pnpm install
pnpm dev        # http://localhost:5173
pnpm lint
pnpm build      # type-checks and builds to dist/
```

- Routes are files in `src/routes/` (TanStack Router generates `src/routeTree.gen.ts`). Screens with books sit under `_authed/`, which sends signed-out visitors to `/sign-in`.
- Data lives in `src/lib/queries.ts`: one `books` query per user, and every edit is a `saveBook` mutation that updates the screen at once and queues the write while offline. Each book keeps the time of its latest edit, and the database keeps the most recent edit (see `supabase/setup.sql`).
- shadcn components are in `src/components/ui/`; add more with `pnpm dlx shadcn@latest add <name>`. The theme colours are the CSS variables at the top of `src/index.css`.
- Anywhere other than `taegansheena.github.io` (local dev, preview links) reads and writes the `preview_books` table, so trying out a change never touches real books.

## Deploy

`.github/workflows/deploy.yml` builds every push to `main` and publishes `dist/` to GitHub Pages at https://taegansheena.github.io/mullon/. In the repository settings, Pages → Source must be **GitHub Actions**.

The app must stay at that address: the earlier plain-HTML version kept books in that origin's storage, and the app uploads any of them that hadn't synced the first time someone signs in on that device.

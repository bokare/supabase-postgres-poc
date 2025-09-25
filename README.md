## Supabase Todo Case Study (Next.js App Router)

### What is Supabase?

Supabase is an open-source Firebase alternative built on Postgres. It provides:

- Authentication (email/password, OAuth)
- PostgreSQL database with Row Level Security (RLS)
- Real-time subscriptions
- Storage and Edge Functions

### Why use Supabase?

- Strong relational data with Postgres and SQL
- Built-in auth tightly integrated with RLS for secure data access
- Real-time out of the box for collaborative/live updates
- Open-source and self-hostable, or use hosted service

### When to use Supabase

- You need auth + database quickly without managing servers
- You want SQL and relational constraints
- You need real-time change streams
- MVPs, prototypes, internal tools, and many production apps

### How this project uses Supabase

- Email/password authentication for signup/login
- A `todos` table secured by RLS (each user sees only their own)
- CRUD UI in Next.js App Router with real-time updates

### Getting Started

1. Create a project at `https://supabase.com` and get your `Project URL` and `anon key`.
2. In the Supabase SQL editor, run `schema.sql` from the repo to create the `todos` table and RLS policies.
3. Create `.env.local` with:

```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

4. Install deps and run the app:

```
npm install
npm run dev
```

5. Visit `/signup` to create an account, then `/login`, then `/todos` to manage your list.

### Files of interest

- `src/lib/supabaseClient.ts`: Supabase client
- `src/app/signup/page.tsx`: Signup form
- `src/app/login/page.tsx`: Login form
- `src/app/todos/page.tsx`: Protected CRUD with realtime
- `schema.sql`: Database schema + RLS policies

### Notes

- Ensure RLS is enabled and policies are applied; otherwise queries will return empty or errors.
- For OAuth providers or server actions, extend this base as needed.

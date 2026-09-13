# Prompt Dictionary

Prompt Dictionary is an interactive library for finding, adapting, sharing, and reusing AI prompts.

## Stack

- Next.js 16 and React 19
- TypeScript and Tailwind CSS 4
- Supabase Auth and PostgreSQL (integration pending)
- Netlify deployment configuration in `netlify.toml`

## Local development

Copy `.env.example` to `.env.local` and add the Supabase project values when authentication is enabled. Then run:

```sh
pnpm install
pnpm dev
```

The public library works with fixture data. Supabase-backed contributions and persistence are planned but not yet connected to a live project.

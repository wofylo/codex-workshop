# CCA-F Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the deployable foundation for the CCA-F exam prep app: Next.js, TypeScript, Tailwind, shadcn/ui, Supabase client wiring, environment validation, health check, CI, and Vercel setup documentation.

**Architecture:** The app will live at the repository root as a Next.js App Router project using a `src/` directory. Supabase access is split into browser, server, proxy, and admin clients so public keys and server-only secrets have clear boundaries. CI runs lint and typecheck on pull requests and `main`; Vercel deploys production from `main`, with previews disabled until a separate preview Supabase project exists.

**Tech Stack:** Next.js App Router, React, TypeScript, pnpm, Tailwind CSS, shadcn/ui, Supabase SSR client, Zod, GitHub Actions, Vercel.

## Global Constraints

- App framework: Next.js with React and TypeScript.
- UI: shadcn/ui and Tailwind CSS.
- Package manager: pnpm.
- Auth and database: Supabase Auth and Supabase Postgres.
- Hosting: Vercel.
- Source control and CI: GitHub and GitHub Actions.
- Public browser code may use only public environment variables.
- Supabase secret keys, AI keys, and email provider keys must stay server-only and must never be imported into client components or exposed in browser bundles.
- Use one Supabase environment for v1.
- Vercel preview deployments are disabled for v1 unless a separate preview Supabase project is created.
- GitHub Actions checks run on pull requests and push to `main`.
- Do not include a fake smoke test. Use a real `/api/health` endpoint check.
- The foundation phase does not implement database migrations, RLS policies, auth pages, study pages, quiz flows, admin pages, or AI features.
- Visual direction: Dark Scholarly Command Center. Use dark theme only for v1, near-black background, charcoal panels, muted slate text, soft borders, and restrained gold accents for primary actions, selected state, progress, score, premium, and focus indicators.

---

## Reference Notes

- Next.js official `create-next-app` CLI supports pnpm and TypeScript/App Router/Tailwind/src-dir options.
- shadcn/ui official Next.js install supports `pnpm dlx shadcn@latest init` and adding components with `pnpm dlx shadcn@latest add`.
- Supabase official Next.js SSR guidance uses `@supabase/ssr`, `@supabase/supabase-js`, browser/server clients, and a root `proxy.ts` for cookie refresh.
- Vercel GitHub integration creates preview deployments by default for branches and pull requests, so v1 must document disabling previews or using a separate preview Supabase project.

## File Structure

Created or modified by this foundation phase:

- `package.json`: pnpm scripts and dependencies.
- `pnpm-lock.yaml`: locked dependency graph.
- `.gitignore`: Next.js, env, and local build ignores.
- `.env.example`: documented environment variable names without secrets.
- `next.config.ts`: minimal Next.js config.
- `tsconfig.json`: TypeScript config with `@/*` alias.
- `eslint.config.mjs`: generated Next.js lint config.
- `postcss.config.mjs`: Tailwind PostCSS config.
- `components.json`: shadcn/ui config.
- `src/app/layout.tsx`: root layout and metadata.
- `src/app/page.tsx`: foundation landing/status page.
- `src/app/globals.css`: Tailwind and base theme CSS.
- `src/app/api/health/route.ts`: real health endpoint.
- `src/lib/env/client.ts`: typed public environment access for browser-safe variables.
- `src/lib/env/server.ts`: typed server-only environment access for secrets.
- `src/lib/supabase/database.types.ts`: initial generated-types file for the empty foundation phase.
- `src/lib/supabase/browser.ts`: browser Supabase client factory.
- `src/lib/supabase/server.ts`: server Supabase client factory.
- `src/lib/supabase/admin.ts`: server-only admin Supabase client factory.
- `src/lib/supabase/proxy.ts`: Supabase auth cookie refresh helper.
- `src/proxy.ts`: Next.js proxy entrypoint.
- `scripts/check-health.mjs`: real health check script for running app instances.
- `.github/workflows/ci.yml`: lint/typecheck CI.
- `docs/deployment/foundation.md`: beginner-facing setup checklist for foundation deployment.

## Task 1: Scaffold The Next.js App At The Repo Root

**Files:**
- Create: `package.json`
- Create: `pnpm-lock.yaml`
- Create: `.gitignore`
- Create: `next.config.ts`
- Create: `tsconfig.json`
- Create: `eslint.config.mjs`
- Create: `postcss.config.mjs`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Create: `src/app/globals.css`
- Modify: generated scaffold files as shown below

**Interfaces:**
- Consumes: existing `CCA-F/` and `docs/` folders must remain in place.
- Produces: a root Next.js app runnable with `pnpm dev`, `pnpm lint`, and `pnpm typecheck`.

- [ ] **Step 1: Verify the repo has no existing app scaffold**

Run:

```powershell
Test-Path package.json
Test-Path src
```

Expected:

```text
False
False
```

- [ ] **Step 2: Create a temporary Next.js scaffold**

Run:

```powershell
pnpm create next-app@latest .scaffold-next --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-pnpm
```

Expected:

```text
Success! Created .scaffold-next
```

- [ ] **Step 3: Copy scaffold files into the repo root**

Run:

```powershell
Get-ChildItem -Force .scaffold-next | ForEach-Object {
  Copy-Item -LiteralPath $_.FullName -Destination . -Recurse -Force
}
```

Expected:

```text
No command errors.
```

- [ ] **Step 4: Remove the temporary scaffold directory**

Run:

```powershell
Remove-Item -Recurse -Force .scaffold-next
```

Expected:

```text
No command errors.
```

- [ ] **Step 5: Replace `src/app/layout.tsx` with project metadata**

Write this exact file:

```tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CCA-F Exam Prep",
  description: "Multi-user CCA-F study, quiz, and progress platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 6: Replace `src/app/page.tsx` with a foundation status page**

Write this exact file:

```tsx
const foundationItems = [
  { label: "Next.js App Router", detail: "Application shell" },
  { label: "TypeScript", detail: "Strict project contracts" },
  { label: "Tailwind CSS", detail: "Dark/gold design tokens" },
  { label: "Supabase boundary", detail: "Client and server split" },
  { label: "GitHub Actions", detail: "PR and main checks" },
  { label: "Vercel", detail: "Production deploy path" },
];

export default function Home() {
  return (
    <main className="min-h-svh bg-[#070706] text-[#f4efe2]">
      <section className="mx-auto flex min-h-svh w-full max-w-6xl flex-col justify-center px-6 py-16">
        <div className="max-w-3xl">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#c8a756]">
            CCA-F Exam Prep
          </p>
          <h1 className="mt-5 text-4xl font-semibold tracking-normal text-balance sm:text-5xl">
            A dark scholarly command center for certification study.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-[#b8b0a0]">
            This first slice establishes the deployable app shell. Auth,
            database migrations, study pages, quizzes, admin tools, and AI
            features are implemented in follow-up plans.
          </p>
        </div>
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {foundationItems.map((item) => (
            <div
              key={item.label}
              className="rounded-lg border border-[#2d2a22] bg-[#12110f] px-4 py-4 shadow-[0_20px_80px_rgba(0,0,0,0.28)]"
            >
              <div className="text-sm font-medium text-[#f4efe2]">{item.label}</div>
              <div className="mt-2 text-sm text-[#8f8878]">{item.detail}</div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
```

- [ ] **Step 7: Replace `src/app/globals.css` with dark/gold theme tokens**

Write this exact file:

```css
@import "tailwindcss";

:root {
  --background: #070706;
  --foreground: #f4efe2;
  --card: #12110f;
  --card-foreground: #f4efe2;
  --popover: #12110f;
  --popover-foreground: #f4efe2;
  --primary: #c8a756;
  --primary-foreground: #090806;
  --secondary: #1b1915;
  --secondary-foreground: #e8dcc3;
  --muted: #191713;
  --muted-foreground: #9a9281;
  --accent: #2a2415;
  --accent-foreground: #f2d991;
  --destructive: #ef4444;
  --destructive-foreground: #fff7ed;
  --border: #2d2a22;
  --input: #2d2a22;
  --ring: #c8a756;
  --radius: 0.5rem;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
}

* {
  border-color: var(--border);
}

body {
  min-height: 100svh;
  background:
    radial-gradient(circle at top left, rgba(200, 167, 86, 0.16), transparent 34rem),
    linear-gradient(180deg, #090806 0%, var(--background) 34rem);
  color: var(--foreground);
}

::selection {
  background: rgba(200, 167, 86, 0.32);
  color: var(--foreground);
}
```

- [ ] **Step 8: Ensure `package.json` has required scripts**

Run:

```powershell
pnpm pkg set scripts.dev="next dev"
pnpm pkg set scripts.build="next build"
pnpm pkg set scripts.start="next start"
pnpm pkg set scripts.lint="eslint ."
pnpm pkg set scripts.typecheck="tsc --noEmit"
```

Expected:

```text
No command errors.
```

- [ ] **Step 9: Install dependencies**

Run:

```powershell
pnpm install
```

Expected:

```text
Done
```

- [ ] **Step 10: Run foundation checks**

Run:

```powershell
pnpm lint
pnpm typecheck
```

Expected:

```text
Both commands exit 0.
```

- [ ] **Step 11: Commit the scaffold**

Run:

```powershell
git add package.json pnpm-lock.yaml .gitignore next.config.ts tsconfig.json eslint.config.mjs postcss.config.mjs src/app/layout.tsx src/app/page.tsx src/app/globals.css
git commit -m "feat: scaffold Next.js foundation"
```

Expected:

```text
Commit created.
```

## Task 2: Add Environment Validation And Supabase Client Boundaries

**Files:**
- Create: `.env.example`
- Create: `src/lib/env/client.ts`
- Create: `src/lib/env/server.ts`
- Create: `src/lib/supabase/database.types.ts`
- Create: `src/lib/supabase/browser.ts`
- Create: `src/lib/supabase/server.ts`
- Create: `src/lib/supabase/admin.ts`
- Create: `src/lib/supabase/proxy.ts`
- Create: `src/proxy.ts`
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`

**Interfaces:**
- Consumes: Next.js root app from Task 1.
- Produces:
  - `publicEnv.NEXT_PUBLIC_SUPABASE_URL: string`
  - `publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: string`
  - `serverEnv.SUPABASE_SECRET_KEY?: string`
  - `createBrowserSupabaseClient()`
  - `createServerSupabaseClient()`
  - `createAdminSupabaseClient()`
  - `updateSession(request: NextRequest)`

- [ ] **Step 1: Install Supabase and validation packages**

Run:

```powershell
pnpm add @supabase/ssr @supabase/supabase-js zod server-only
```

Expected:

```text
Done
```

- [ ] **Step 2: Create `.env.example`**

Write this exact file:

```bash
# Supabase public client configuration
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=

# Supabase server-only secret key. Never expose this to browser code.
SUPABASE_SECRET_KEY=

# Optional AI provider configuration for later phases
AI_PROVIDER=
AI_BASE_URL=
AI_API_KEY=
AI_MODEL=

# Optional email provider configuration for later phases
EMAIL_PROVIDER=
EMAIL_API_KEY=
EMAIL_FROM=
```

- [ ] **Step 3: Create public env module**

Write `src/lib/env/client.ts`:

```ts
import { z } from "zod";

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
});

export const publicEnv = publicEnvSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
});
```

- [ ] **Step 4: Create server env module**

Write `src/lib/env/server.ts`:

```ts
import "server-only";
import { z } from "zod";

const serverEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  SUPABASE_SECRET_KEY: z.string().min(1).optional(),
  AI_PROVIDER: z.string().min(1).optional(),
  AI_BASE_URL: z.string().url().optional(),
  AI_API_KEY: z.string().min(1).optional(),
  AI_MODEL: z.string().min(1).optional(),
  EMAIL_PROVIDER: z.string().min(1).optional(),
  EMAIL_API_KEY: z.string().min(1).optional(),
  EMAIL_FROM: z.string().email().optional(),
});

export const serverEnv = serverEnvSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY || undefined,
  AI_PROVIDER: process.env.AI_PROVIDER || undefined,
  AI_BASE_URL: process.env.AI_BASE_URL || undefined,
  AI_API_KEY: process.env.AI_API_KEY || undefined,
  AI_MODEL: process.env.AI_MODEL || undefined,
  EMAIL_PROVIDER: process.env.EMAIL_PROVIDER || undefined,
  EMAIL_API_KEY: process.env.EMAIL_API_KEY || undefined,
  EMAIL_FROM: process.env.EMAIL_FROM || undefined,
});
```

- [ ] **Step 5: Create initial Supabase database types**

Write `src/lib/supabase/database.types.ts`:

```ts
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
```

- [ ] **Step 6: Create browser Supabase client**

Write `src/lib/supabase/browser.ts`:

```ts
"use client";

import { createBrowserClient } from "@supabase/ssr";
import { publicEnv } from "@/lib/env/client";
import type { Database } from "@/lib/supabase/database.types";

export function createBrowserSupabaseClient() {
  return createBrowserClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}
```

- [ ] **Step 7: Create server Supabase client**

Write `src/lib/supabase/server.ts`:

```ts
import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { serverEnv } from "@/lib/env/server";
import type { Database } from "@/lib/supabase/database.types";

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    serverEnv.NEXT_PUBLIC_SUPABASE_URL,
    serverEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Components cannot always write cookies. Supabase proxy
            // refresh handles writable response cookies.
          }
        },
      },
    },
  );
}
```

- [ ] **Step 8: Create admin Supabase client**

Write `src/lib/supabase/admin.ts`:

```ts
import "server-only";
import { createClient } from "@supabase/supabase-js";
import { serverEnv } from "@/lib/env/server";
import type { Database } from "@/lib/supabase/database.types";

export function createAdminSupabaseClient() {
  if (!serverEnv.SUPABASE_SECRET_KEY) {
    throw new Error("SUPABASE_SECRET_KEY is required for admin Supabase access.");
  }

  return createClient<Database>(
    serverEnv.NEXT_PUBLIC_SUPABASE_URL,
    serverEnv.SUPABASE_SECRET_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
```

- [ ] **Step 9: Create Supabase proxy helper**

Write `src/lib/supabase/proxy.ts`:

```ts
import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { serverEnv } from "@/lib/env/server";
import type { Database } from "@/lib/supabase/database.types";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient<Database>(
    serverEnv.NEXT_PUBLIC_SUPABASE_URL,
    serverEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));

          response = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  await supabase.auth.getClaims();

  return response;
}
```

- [ ] **Step 10: Create root `src/proxy.ts`**

Write this exact file:

```ts
import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

- [ ] **Step 11: Verify typecheck catches missing env at runtime only, not compile time**

Run:

```powershell
pnpm typecheck
```

Expected:

```text
Command exits 0.
```

- [ ] **Step 12: Commit environment and Supabase client boundaries**

Run:

```powershell
git add .env.example package.json pnpm-lock.yaml src/lib/env/client.ts src/lib/env/server.ts src/lib/supabase/database.types.ts src/lib/supabase/browser.ts src/lib/supabase/server.ts src/lib/supabase/admin.ts src/lib/supabase/proxy.ts src/proxy.ts
git commit -m "feat: add Supabase client foundation"
```

Expected:

```text
Commit created.
```

## Task 3: Add Health Endpoint And Real Smoke Check

**Files:**
- Create: `src/app/api/health/route.ts`
- Create: `scripts/check-health.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: Next.js app from Task 1.
- Produces:
  - `GET /api/health` returns `{ "ok": true, "service": "cca-f-exam-prep" }`
  - `pnpm health:check` validates a running app URL.

- [ ] **Step 1: Create health route**

Write `src/app/api/health/route.ts`:

```ts
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({
    ok: true,
    service: "cca-f-exam-prep",
  });
}
```

- [ ] **Step 2: Create health check script**

Write `scripts/check-health.mjs`:

```js
const baseUrl = process.env.APP_URL ?? "http://localhost:3000";
const healthUrl = new URL("/api/health", baseUrl);

const response = await fetch(healthUrl);

if (!response.ok) {
  throw new Error(`Health check failed with HTTP ${response.status}`);
}

const body = await response.json();

if (body.ok !== true || body.service !== "cca-f-exam-prep") {
  throw new Error(`Unexpected health response: ${JSON.stringify(body)}`);
}

console.log(`Health check passed for ${healthUrl.toString()}`);
```

- [ ] **Step 3: Add health script**

Run:

```powershell
pnpm pkg set scripts.health:check="node scripts/check-health.mjs"
```

Expected:

```text
No command errors.
```

- [ ] **Step 4: Verify route compiles**

Run:

```powershell
pnpm typecheck
```

Expected:

```text
Command exits 0.
```

- [ ] **Step 5: Verify health endpoint manually**

Run in terminal 1:

```powershell
pnpm dev
```

Expected:

```text
Local: http://localhost:3000
```

Run in terminal 2:

```powershell
pnpm health:check
```

Expected:

```text
Health check passed for http://localhost:3000/api/health
```

- [ ] **Step 6: Stop the dev server**

In terminal 1, press:

```text
Ctrl+C
```

Expected:

```text
The dev server exits.
```

- [ ] **Step 7: Commit health endpoint**

Run:

```powershell
git add package.json scripts/check-health.mjs src/app/api/health/route.ts
git commit -m "feat: add health check endpoint"
```

Expected:

```text
Commit created.
```

## Task 4: Initialize shadcn/ui And Base Components

**Files:**
- Create: `components.json`
- Create: `src/lib/utils.ts`
- Create: `src/components/ui/button.tsx`
- Create: `src/components/ui/card.tsx`
- Create: `src/components/ui/badge.tsx`
- Create: `src/components/ui/separator.tsx`
- Modify: `src/app/page.tsx`
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`

**Interfaces:**
- Consumes: Tailwind and `@/*` alias from Task 1.
- Produces:
  - `cn(...inputs: ClassValue[]): string`
  - reusable shadcn `Button`, `Card`, `Badge`, and `Separator` components.

- [ ] **Step 1: Initialize shadcn/ui**

Run:

```powershell
pnpm dlx shadcn@latest init --yes --base-color neutral
```

Expected:

```text
components.json created.
```

- [ ] **Step 2: Add base UI components**

Run:

```powershell
pnpm dlx shadcn@latest add button card badge separator
pnpm add lucide-react
```

Expected:

```text
src/components/ui/button.tsx
src/components/ui/card.tsx
src/components/ui/badge.tsx
src/components/ui/separator.tsx
```

- [ ] **Step 3: Replace `src/app/page.tsx` to use shadcn components**

Write this exact file:

```tsx
import { Badge } from "@/components/ui/badge";
import { BookOpenCheck, Crown, Gauge, ShieldCheck } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const foundationItems = [
  {
    label: "Study cockpit",
    detail: "Dark workspace for domain progress and review focus.",
    icon: BookOpenCheck,
  },
  {
    label: "Deployment path",
    detail: "GitHub Actions and Vercel production branch are defined.",
    icon: Gauge,
  },
  {
    label: "Security boundary",
    detail: "Public and server-only Supabase clients are separated.",
    icon: ShieldCheck,
  },
  {
    label: "Premium-ready",
    detail: "Gold accent system is reserved for premium and key actions.",
    icon: Crown,
  },
];

export default function Home() {
  return (
    <main className="min-h-svh bg-background text-foreground">
      <section className="mx-auto flex min-h-svh w-full max-w-6xl flex-col justify-center px-6 py-16">
        <Badge className="w-fit border-primary/40 bg-primary/10 text-primary" variant="outline">
          CCA-F Exam Prep
        </Badge>
        <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-normal text-balance sm:text-5xl">
          A dark scholarly command center for certification study.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
          This first slice establishes the deployable app shell. Auth, database
          migrations, study pages, quizzes, admin tools, and AI features are
          implemented in follow-up plans.
        </p>
        <Separator className="my-8 bg-border" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {foundationItems.map((item) => {
            const Icon = item.icon;

            return (
              <Card key={item.label} className="rounded-lg border-border bg-card/92">
                <CardHeader className="space-y-3">
                  <div className="flex size-9 items-center justify-center rounded-md border border-primary/30 bg-primary/10 text-primary">
                    <Icon className="size-4" aria-hidden="true" />
                  </div>
                  <CardTitle className="text-base">{item.label}</CardTitle>
                  <CardDescription>{item.detail}</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Ready for the next implementation phase.
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </main>
  );
}
```

- [ ] **Step 4: Verify lint and typecheck**

Run:

```powershell
pnpm lint
pnpm typecheck
```

Expected:

```text
Both commands exit 0.
```

- [ ] **Step 5: Commit shadcn foundation**

Run:

```powershell
git add components.json package.json pnpm-lock.yaml src/lib/utils.ts src/components/ui/button.tsx src/components/ui/card.tsx src/components/ui/badge.tsx src/components/ui/separator.tsx src/app/page.tsx
git commit -m "feat: add shadcn UI foundation"
```

Expected:

```text
Commit created.
```

## Task 5: Add CI Workflow And Vercel Deployment Notes

**Files:**
- Create: `.github/workflows/ci.yml`
- Create: `docs/deployment/foundation.md`

**Interfaces:**
- Consumes: `pnpm lint` and `pnpm typecheck` scripts from Task 1.
- Produces: CI checks on pull requests and `main`, plus a Vercel setup guide that keeps preview deployments disabled for v1.

- [ ] **Step 1: Create GitHub Actions workflow**

Write `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  pull_request:
    branches:
      - main
  push:
    branches:
      - main

permissions:
  contents: read

jobs:
  checks:
    name: Lint and typecheck
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Lint
        run: pnpm lint

      - name: Typecheck
        run: pnpm typecheck
```

- [ ] **Step 2: Create deployment foundation guide**

Write `docs/deployment/foundation.md`:

````markdown
# Foundation Deployment Guide

## Local Checks

Run these before pushing:

```powershell
pnpm lint
pnpm typecheck
```

Both commands must exit 0.

## GitHub Branch Protection

Configure the `main` branch with these rules:

- Require a pull request before merging.
- Require the `CI / Lint and typecheck` check to pass.
- Block direct pushes to `main`.

## Vercel Project Setup

Create a Vercel project from the GitHub repository.

Use these settings:

- Framework preset: Next.js.
- Production branch: `main`.
- Root directory: repository root.
- Install command: `pnpm install --frozen-lockfile`.
- Build command: `pnpm build`.

## Preview Deployments

Disable preview deployments for v1 unless a separate preview Supabase project exists.

Reason: preview deployments connected to production Supabase can read or mutate production users, questions, progress, and admin data.

## Environment Variables

Set these in Vercel production only:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SECRET_KEY
```

The AI and email variables are optional until those features are implemented.
````

- [ ] **Step 3: Verify workflow syntax by inspection**

Run:

```powershell
Get-Content .github\workflows\ci.yml
```

Expected:

```text
The file contains pull_request and push triggers for main.
```

- [ ] **Step 4: Run local checks**

Run:

```powershell
pnpm lint
pnpm typecheck
```

Expected:

```text
Both commands exit 0.
```

- [ ] **Step 5: Commit CI and deployment notes**

Run:

```powershell
git add .github/workflows/ci.yml docs/deployment/foundation.md
git commit -m "ci: add foundation checks"
```

Expected:

```text
Commit created.
```

## Task 6: Final Foundation Verification

**Files:**
- Read: `package.json`
- Read: `.env.example`
- Read: `.github/workflows/ci.yml`
- Read: `docs/deployment/foundation.md`

**Interfaces:**
- Consumes: all previous foundation tasks.
- Produces: verified foundation branch ready for the database/auth implementation plan.

- [ ] **Step 1: Confirm working tree is clean**

Run:

```powershell
git status --short
```

Expected:

```text
No tracked or untracked app changes are listed.
```

- [ ] **Step 2: Run all foundation checks**

Run:

```powershell
pnpm lint
pnpm typecheck
pnpm build
```

Expected:

```text
All commands exit 0.
```

- [ ] **Step 3: Verify server secrets are not exposed through public env names**

Run:

```powershell
Select-String -Path .env.example,src\**\*.ts,src\**\*.tsx -Pattern "NEXT_PUBLIC_.*SECRET|NEXT_PUBLIC_.*KEY.*SECRET|SUPABASE_SECRET_KEY" -CaseSensitive
```

Expected:

```text
SUPABASE_SECRET_KEY appears only in .env.example, src/lib/env/server.ts, and src/lib/supabase/admin.ts.
```

- [ ] **Step 4: Verify recent commits**

Run:

```powershell
git log --oneline -6
```

Expected:

```text
The log includes commits for scaffold, Supabase client foundation, health endpoint, shadcn foundation, and CI checks.
```

- [ ] **Step 5: Record foundation completion**

Run:

```powershell
git status --short
```

Expected:

```text
No tracked or untracked app changes are listed.
```

## Self-Review

Spec coverage:

- Next.js + TypeScript + pnpm foundation: Task 1.
- Tailwind + shadcn/ui foundation: Task 1 and Task 4.
- Supabase client boundary and server-only secret handling: Task 2.
- Real health endpoint and smoke check: Task 3.
- GitHub Actions on pull requests and `main`: Task 5.
- Vercel production-from-main setup and preview deployment warning: Task 5.
- Database migrations, RLS policies, auth flows, study content rendering, quiz behavior, admin dashboard, AI, and email behavior are intentionally outside this foundation plan and belong to follow-up implementation plans.

Red-flag scan:

- No undefined functions are referenced across tasks.
- Every created custom file has exact content.
- Each task ends with verification and a commit.

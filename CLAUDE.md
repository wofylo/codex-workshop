# Claude/Codex Project Memory

## Communication

- Prefer Traditional Chinese for normal conversation.
- Keep commands, paths, env vars, package names, APIs, and code identifiers in English.
- Be direct and pragmatic. Do not ask for tokens that are already documented here unless a command proves they are missing.

## Workspace

- Main workspace: `D:\Lab\codex-workshop`
- Shell: PowerShell
- Repo: `git@github.com:wofylo/codex-workshop.git`
- Branch: `main`
- Production URL: `https://codex-workshop-two.vercel.app/`

## Secrets

Secrets are stored locally at:

```text
C:\secrets\.env
```

Current checked key names:

```text
JIRA_API_TOKEN
JIRA_BASE_URL
JIRA_DEFAULT_PROJECT_KEY
JIRA_EMAIL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
NEXT_PUBLIC_SUPABASE_URL
SUPABASE_ACCESS_TOKEN
SUPABASE_SECRET_KEY
VERCEL_TOKEN
```

Do not print secret values. It is acceptable to inspect only key names.

## GitHub Access

GitHub git access uses SSH, not a GitHub API token.

SSH public key:

```text
C:\Users\WofyLo\.ssh\github_wofylo.pub
```

Do not ask for `GITHUB_TOKEN` / `GH_TOKEN` for normal git operations. Use:

```powershell
git pull
git push origin main
```

Only ask for a GitHub token if the task specifically requires GitHub API or `gh` operations that SSH cannot cover, such as Actions log API calls, PR API creation, or repository administration.

## Vercel Access

`VERCEL_TOKEN` exists in `C:\secrets\.env`.

Use it for CLI/API troubleshooting:

```powershell
$env:VERCEL_TOKEN = '<load from C:\secrets\.env without printing>'
npx vercel inspect https://codex-workshop-two.vercel.app --token $env:VERCEL_TOKEN
npx vercel logs https://codex-workshop-two.vercel.app --token $env:VERCEL_TOKEN
```

Vercel IDs:

```text
Project: prj_3Pb4cARgnOOI8PoMAOHgxPrsgjvi
Team: team_lEkdAVKvWzUfDSPAQw13RsQs
```

## Supabase Access

`SUPABASE_ACCESS_TOKEN`, `SUPABASE_SECRET_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` exist in `C:\secrets\.env`.

Supabase project:

```text
Project ref: ufqcfniaxmwwcwmrssfk
URL: https://ufqcfniaxmwwcwmrssfk.supabase.co
Region: ap-northeast-1
```

Use the Supabase access token for CLI/API work. Use `SUPABASE_SECRET_KEY` only server-side.

### Supabase CLI

The CLI is installed globally (`supabase` v2.108.0) and the project is linked. Always set the token before running CLI commands:

```powershell
$env:SUPABASE_ACCESS_TOKEN = (Get-Content "C:\secrets\.env" | Where-Object { $_ -match "^SUPABASE_ACCESS_TOKEN=" }) -replace "^SUPABASE_ACCESS_TOKEN=",""
```

**Run a SQL query against production:**

```powershell
supabase db query --linked --file path\to\query.sql
```

**Apply pending migrations:**

```powershell
supabase db push --linked
```

**Check migration state (local vs remote):**

```powershell
supabase migration list
```

**Repair migration tracking** (when local/remote diverge):

```powershell
supabase migration repair --status applied <version>   # mark as applied without running
supabase migration repair --status reverted <version>  # remove from tracking
```

**Regen TypeScript types from live schema:**

```powershell
supabase gen types typescript --linked > src/lib/supabase/database.types.ts
```

### Migration workflow

- New migrations go in `supabase/migrations/` as `YYYYMMDDHHMMSS_<name>.sql`
- Pushing to `main` with changes under `supabase/migrations/**` triggers the GitHub Actions workflow (`.github/workflows/migrate.yml`) which runs `supabase db push` automatically
- Never apply schema changes via the Supabase dashboard SQL editor — always use migration files so the CLI tracking stays in sync

## Current Auth State

Last checked production database state on 2026-06-18 21:23 +08:00:

```text
auth.users = 1
public.profiles = 1
active approved admins = 1
```

First account `wofy` has been promoted to an approved admin and email-confirmed. If login fails now, check the credentials and Supabase Auth logs rather than assuming the account is missing or unapproved.

First-admin SQL:

```sql
update public.profiles
set
  role = 'admin',
  approval_status = 'approved',
  approved_at = now(),
  approved_by = id
where display_name_normalized = lower('YOUR DISPLAY NAME');
```

## Verification

Use:

```powershell
$env:COREPACK_HOME = 'D:\Lab\codex-workshop\.corepack'
corepack pnpm test
corepack pnpm lint
corepack pnpm typecheck
```

Build requires env values:

```powershell
$env:NEXT_PUBLIC_SUPABASE_URL='https://example.supabase.co'
$env:NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY='placeholder'
$env:SUPABASE_SECRET_KEY='placeholder-secret'
$env:COREPACK_HOME = 'D:\Lab\codex-workshop\.corepack'
corepack pnpm build
```

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

## Current Auth State

Last checked production database state:

```text
auth.users = 0
public.profiles = 0
active approved admins = 0
```

If login fails before an account is created, the root cause is expected: Supabase has no user for those credentials. Create the first account at `/auth/sign-up`, then promote it to admin in Supabase SQL Editor.

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
